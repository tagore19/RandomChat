const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Sentry = require('@sentry/node');

// Optional Sentry Error Monitoring for Backend
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.2,
    sendDefaultPii: false
  });
  console.log('[Sentry] Backend error monitoring initialized.');
}

const app = express();
app.use(cors());

// Health-check endpoint for Cron-job.org / UptimeRobot (Keeps Render free instance awake)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('StrangerConnect Real-Time Signaling Server is running.');
});

// Diagnostic endpoint to inspect live matchmaker queue in production
app.get('/status', (req, res) => {
  const roomsList = [];
  for (const [rid, r] of activeRooms.entries()) {
    roomsList.push({
      roomId: rid,
      userA: { sid: r.userA.sessionId, socketId: r.userA.socketId, isOnline: r.userA.isOnline },
      userB: { sid: r.userB.sessionId, socketId: r.userB.socketId, isOnline: r.userB.isOnline }
    });
  }
  const sessionsList = [];
  for (const [sid, s] of sessions.entries()) {
    sessionsList.push({
      sessionId: sid,
      socketId: s.socketId,
      roomId: s.roomId,
      isOnline: s.isOnline
    });
  }
  res.status(200).json({
    onlineSockets: io.engine.clientsCount || 0,
    waitingQueueSize: waitingQueue.size,
    waitingQueueSessions: Array.from(waitingQueue),
    activeRoomsCount: activeRooms.size,
    rooms: roomsList,
    sessions: sessionsList,
    uptime: Math.floor(process.uptime())
  });
});

const server = http.createServer(app);

// Initialize Socket.io with 1MB max HTTP buffer size for compressed photos
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e6, // 1MB limit per packet
  pingTimeout: 20000,
  pingInterval: 10000
});

// In-Memory Session & Room State (0 Database, 0 Disk Storage)
// sessions: Map<sessionId, { sessionId, socketId, roomId, isOnline, lastActive }>
const sessions = new Map();

// activeRooms: Map<roomId, { roomId, userA, userB, queuedForA, queuedForB, createdAt }>
const activeRooms = new Map();

// FIFO Queue of sessionIds looking for a match
const waitingQueue = new Set();

// Reverse lookup: socket.id -> sessionId
const socketToSession = new Map();

// In-memory rate limiting: sessionId -> { count, windowStart }
const rateLimitMap = new Map();
const skipRateLimitMap = new Map();

// 3-Minute Grace Period before terminating an abandoned background session
const BACKGROUND_GRACE_PERIOD_MS = 3 * 60 * 1000;

// Security: Whitelist safe raster image formats only (Blocks SVG/HTML/JS payload injection)
const SAFE_IMAGE_PREFIX_REGEX = /^data:image\/(webp|jpeg|jpg|png);base64,[A-Za-z0-9+/=]+$/;

// Security: Periodic memory pruning every 60s to guarantee zero memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now - record.windowStart > 10000) {
      rateLimitMap.delete(key);
    }
  }
  for (const [key, lastActionTime] of skipRateLimitMap.entries()) {
    if (now - lastActionTime > 10000) {
      skipRateLimitMap.delete(key);
    }
  }
  // Prune idle disconnected sessions that have no active room and haven't reconnected in 15 mins
  for (const [sid, sess] of sessions.entries()) {
    if (!sess.isOnline && !sess.roomId && now - sess.lastActive > 15 * 60 * 1000) {
      sessions.delete(sid);
    }
  }
}, 60000);

/**
 * Broadcast current online count to all connected sockets
 */
function broadcastOnlineCount() {
  const count = io.engine.clientsCount || 0;
  io.emit('online_count', count);
}

/**
 * Cleanly terminate a room when explicitly requested or when grace period expires
 */
function terminateRoom(roomId, { reason = 'explicit_leave', initiatedBySessionId = null } = {}) {
  const room = activeRooms.get(roomId);
  if (!room) return;

  console.log(`🛑 [TERMINATE ROOM] Room ${roomId} terminated. Reason: ${reason}`);

  if (room.userA.disconnectTimer) clearTimeout(room.userA.disconnectTimer);
  if (room.userB.disconnectTimer) clearTimeout(room.userB.disconnectTimer);

  const sessionA = sessions.get(room.userA.sessionId);
  const sessionB = sessions.get(room.userB.sessionId);

  if (sessionA) sessionA.roomId = null;
  if (sessionB) sessionB.roomId = null;

  activeRooms.delete(roomId);

  const notifyPartner = (slot, eventName) => {
    if (slot.isOnline && slot.socketId) {
      io.to(slot.socketId).emit(eventName);
    }
  };

  const eventToEmit = reason === 'timeout' ? 'stranger_disconnected' : 'stranger_left';

  if (initiatedBySessionId === room.userA.sessionId) {
    notifyPartner(room.userB, eventToEmit);
  } else if (initiatedBySessionId === room.userB.sessionId) {
    notifyPartner(room.userA, eventToEmit);
  } else {
    notifyPartner(room.userA, eventToEmit);
    notifyPartner(room.userB, eventToEmit);
  }
}

/**
 * Queue matchmaker logic for a session
 */
function enqueueAndMatch(sessionId, socket) {
  // Ensure previous room is cleanly left
  const currentSession = sessions.get(sessionId);
  if (currentSession && currentSession.roomId) {
    terminateRoom(currentSession.roomId, { reason: 'explicit_skip', initiatedBySessionId: sessionId });
  }

  // Remove self from queue if already present
  waitingQueue.delete(sessionId);

  let partnerSession = null;
  while (waitingQueue.size > 0) {
    const [candidateId] = waitingQueue;
    waitingQueue.delete(candidateId);

    if (candidateId !== sessionId) {
      const candidate = sessions.get(candidateId);
      if (candidate && candidate.isOnline && candidate.socketId) {
        const candidateSocket = io.sockets.sockets.get(candidate.socketId);
        if (candidateSocket && candidateSocket.connected) {
          partnerSession = candidate;
          break;
        }
      }
    }
  }

  if (partnerSession) {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const mySession = sessions.get(sessionId);

    const room = {
      roomId,
      userA: { sessionId, socketId: socket.id, isOnline: true, disconnectTimer: null },
      userB: { sessionId: partnerSession.sessionId, socketId: partnerSession.socketId, isOnline: true, disconnectTimer: null },
      queuedForA: [],
      queuedForB: [],
      createdAt: Date.now()
    };

    activeRooms.set(roomId, room);
    mySession.roomId = roomId;
    partnerSession.roomId = roomId;

    socket.join(roomId);
    const partnerSocket = io.sockets.sockets.get(partnerSession.socketId);
    if (partnerSocket) partnerSocket.join(roomId);

    console.log(`🎉 [MATCHED] Room ${roomId}: ${sessionId} <---> ${partnerSession.sessionId}`);

    socket.emit('matched', { roomId });
    if (partnerSocket) partnerSocket.emit('matched', { roomId });
  } else {
    waitingQueue.add(sessionId);
    console.log(`⏳ [SEARCHING] Session ${sessionId} entered waiting queue. Queue size: ${waitingQueue.size}`);
    socket.emit('searching');
  }
}

/**
 * Rate limiter: max 5 messages per 1 second window per session
 */
function checkRateLimit(sessionId) {
  const now = Date.now();
  const record = rateLimitMap.get(sessionId) || { count: 0, windowStart: now };

  if (now - record.windowStart > 1000) {
    record.count = 1;
    record.windowStart = now;
    rateLimitMap.set(sessionId, record);
    return true;
  }

  if (record.count >= 5) {
    return false;
  }

  record.count += 1;
  rateLimitMap.set(sessionId, record);
  return true;
}

io.on('connection', (socket) => {
  const rawSessionId = socket.handshake.auth?.sessionId;
  const sessionId = (typeof rawSessionId === 'string' && rawSessionId.trim().length > 0)
    ? rawSessionId.trim()
    : `anon_${socket.id}`;

  socketToSession.set(socket.id, sessionId);

  let session = sessions.get(sessionId);
  if (!session) {
    session = { sessionId, socketId: socket.id, roomId: null, isOnline: true, lastActive: Date.now() };
    sessions.set(sessionId, session);
  } else {
    session.socketId = socket.id;
    session.isOnline = true;
    session.lastActive = Date.now();
  }

  console.log(`🔌 [Connected] Socket: ${socket.id} | Session: ${sessionId} | Total Online: ${io.engine.clientsCount}`);
  broadcastOnlineCount();

  // Handle session check and room restoration
  const handleSessionSync = () => {
    if (session.roomId && activeRooms.has(session.roomId)) {
      const room = activeRooms.get(session.roomId);
      const isUserA = room.userA.sessionId === sessionId;
      const mySlot = isUserA ? room.userA : room.userB;

      if (mySlot.disconnectTimer) {
        clearTimeout(mySlot.disconnectTimer);
        mySlot.disconnectTimer = null;
        console.log(`♻️ [RESUMED] Session ${sessionId} returned from background! Room: ${room.roomId}`);
      }

      mySlot.socketId = socket.id;
      mySlot.isOnline = true;
      socket.join(room.roomId);

      // Notify returning client that session is active
      socket.emit('session_resumed', { roomId: room.roomId });

      // Deliver buffered messages that arrived while backgrounded
      const pending = isUserA ? room.queuedForA : room.queuedForB;
      if (pending && pending.length > 0) {
        console.log(`📦 [DELIVERING QUEUE] Flushing ${pending.length} buffered messages to ${sessionId}`);
        socket.emit('buffered_messages', pending);
        if (isUserA) room.queuedForA = [];
        else room.queuedForB = [];
      }
    } else if (session.roomId) {
      session.roomId = null;
      socket.emit('session_invalidated');
    }
  };

  // Run on connection
  handleSessionSync();

  // Listen for explicit ping when mobile browser returns to foreground
  socket.on('check_session', handleSessionSync);

  // 1. User requests to find a stranger
  socket.on('find_stranger', () => {
    const sid = socketToSession.get(socket.id);
    if (!sid) return;

    const now = Date.now();
    const lastSkip = skipRateLimitMap.get(sid) || 0;
    if (now - lastSkip < 250) return;
    skipRateLimitMap.set(sid, now);

    enqueueAndMatch(sid, socket);
  });

  // 2. User stops searching
  socket.on('stop_search', () => {
    const sid = socketToSession.get(socket.id);
    if (sid) {
      waitingQueue.delete(sid);
    }
    socket.emit('search_stopped');
  });

  // 3. User clicks Skip / Next Stranger (explicit action)
  socket.on('skip', (options = {}) => {
    const sid = socketToSession.get(socket.id);
    if (!sid) return;

    const now = Date.now();
    const lastSkip = skipRateLimitMap.get(sid) || 0;
    if (now - lastSkip < 250) return;
    skipRateLimitMap.set(sid, now);

    const sess = sessions.get(sid);
    if (sess && sess.roomId) {
      terminateRoom(sess.roomId, { reason: 'explicit_skip', initiatedBySessionId: sid });
    }

    if (options.autoRequeue !== false) {
      enqueueAndMatch(sid, socket);
    } else {
      socket.emit('search_stopped');
    }
  });

  // 4. User clicks Leave (explicit action)
  socket.on('leave_room', () => {
    const sid = socketToSession.get(socket.id);
    if (!sid) return;

    const sess = sessions.get(sid);
    if (sess && sess.roomId) {
      terminateRoom(sess.roomId, { reason: 'explicit_leave', initiatedBySessionId: sid });
    }
    socket.emit('search_stopped');
  });

  // 4b. User Reports Stranger (Abuse, Inappropriate Media, Harassment, Underage)
  socket.on('report_stranger', (data = {}) => {
    const sid = socketToSession.get(socket.id);
    if (!sid) return;

    const sess = sessions.get(sid);
    if (sess && sess.roomId) {
      const room = activeRooms.get(sess.roomId);
      if (room) {
        const isUserA = room.userA.sessionId === sid;
        const reportedSlot = isUserA ? room.userB : room.userA;
        console.log(`⚠️ [REPORT FILED] Reporter: ${sid} reported ${reportedSlot.sessionId}. Category: ${data.category || 'general'}`);
        
        terminateRoom(room.roomId, { reason: 'reported', initiatedBySessionId: sid });
        
        if (reportedSlot.isOnline && reportedSlot.socketId) {
          io.to(reportedSlot.socketId).emit('reported_notice', {
            message: 'You have been disconnected following a community report.'
          });
        }
      }
    }

    // Immediately queue the reporter for a fresh stranger
    enqueueAndMatch(sid, socket);
  });

  // 5. Text chat message relay with background queue buffering
  socket.on('chat_message', (payload) => {
    const sid = socketToSession.get(socket.id);
    if (!sid || !checkRateLimit(sid)) {
      socket.emit('rate_limited', { message: 'Sending messages too fast. Slow down!' });
      return;
    }

    const sess = sessions.get(sid);
    if (!sess || !sess.roomId) {
      socket.emit('stranger_disconnected');
      return;
    }

    const room = activeRooms.get(sess.roomId);
    if (!room) {
      sess.roomId = null;
      socket.emit('stranger_disconnected');
      return;
    }

    if (payload && typeof payload.text === 'string') {
      const trimmedText = payload.text.trim();
      if (trimmedText.length > 0 && trimmedText.length <= 3000) {
        const msgObj = {
          id: payload.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          sender: 'stranger',
          type: 'text',
          text: trimmedText,
          timestamp: Date.now()
        };

        const isUserA = room.userA.sessionId === sid;
        const partnerSlot = isUserA ? room.userB : room.userA;

        if (partnerSlot.isOnline && partnerSlot.socketId) {
          // Partner is connected right now -> deliver live!
          io.to(partnerSlot.socketId).emit('chat_message', msgObj);
        } else {
          // Partner is backgrounded/app-switched -> hold in room buffer!
          console.log(`📥 [BUFFERED MESSAGE] Partner ${partnerSlot.sessionId} is backgrounded. Queued in room ${room.roomId}`);
          const targetQueue = isUserA ? room.queuedForB : room.queuedForA;
          targetQueue.push(msgObj);
        }
      }
    }
  });

  // 6. Typing indicator relay
  socket.on('typing', (payload) => {
    const sid = socketToSession.get(socket.id);
    if (!sid) return;

    const sess = sessions.get(sid);
    if (!sess || !sess.roomId) return;

    const room = activeRooms.get(sess.roomId);
    if (!room) return;

    const isUserA = room.userA.sessionId === sid;
    const partnerSlot = isUserA ? room.userB : room.userA;

    if (partnerSlot.isOnline && partnerSlot.socketId) {
      io.to(partnerSlot.socketId).emit('typing', {
        isTyping: Boolean(payload && payload.isTyping)
      });
    }
  });

  // 7. Ephemeral Photo transfer (compressed base64 data)
  socket.on('send_photo', (payload) => {
    const sid = socketToSession.get(socket.id);
    if (!sid || !checkRateLimit(sid)) {
      socket.emit('rate_limited', { message: 'Too many uploads. Please wait.' });
      return;
    }

    const sess = sessions.get(sid);
    if (!sess || !sess.roomId) {
      socket.emit('stranger_disconnected');
      return;
    }

    const room = activeRooms.get(sess.roomId);
    if (!room) {
      sess.roomId = null;
      socket.emit('stranger_disconnected');
      return;
    }

    if (payload && typeof payload.image === 'string') {
      if (payload.image.length < 300000 && SAFE_IMAGE_PREFIX_REGEX.test(payload.image)) {
        const photoObj = {
          id: payload.id || `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          sender: 'stranger',
          type: 'photo',
          image: payload.image,
          timestamp: Date.now()
        };

        const isUserA = room.userA.sessionId === sid;
        const partnerSlot = isUserA ? room.userB : room.userA;

        if (partnerSlot.isOnline && partnerSlot.socketId) {
          io.to(partnerSlot.socketId).emit('receive_photo', photoObj);
        } else {
          console.log(`📥 [BUFFERED PHOTO] Partner ${partnerSlot.sessionId} is backgrounded. Queued in room ${room.roomId}`);
          const targetQueue = isUserA ? room.queuedForB : room.queuedForA;
          targetQueue.push(photoObj);
        }
      }
    }
  });

  // 8. Socket Disconnection (e.g. Mobile background, tab minimize, network hop)
  socket.on('disconnect', (reason) => {
    const sid = socketToSession.get(socket.id);
    socketToSession.delete(socket.id);

    console.log(`🔌 [Socket Closed] Socket ${socket.id} (Session: ${sid}) | Reason: ${reason}`);
    broadcastOnlineCount();

    if (!sid) return;

    const sess = sessions.get(sid);
    if (!sess) return;

    sess.isOnline = false;
    sess.socketId = null;
    sess.lastActive = Date.now();

    // Remove from waiting queue if in matchmaking
    waitingQueue.delete(sid);

    // If engaged in an active room: DO NOT TERMINATE OR NOTIFY PARTNER!
    // Start generous 3-minute grace period timer.
    if (sess.roomId && activeRooms.has(sess.roomId)) {
      const room = activeRooms.get(sess.roomId);
      const isUserA = room.userA.sessionId === sid;
      const mySlot = isUserA ? room.userA : room.userB;

      mySlot.isOnline = false;
      mySlot.socketId = null;

      if (mySlot.disconnectTimer) clearTimeout(mySlot.disconnectTimer);

      console.log(`⏳ [GRACE PERIOD STARTED] Session ${sid} backgrounded. Room ${room.roomId} preserved for 3 mins.`);
      mySlot.disconnectTimer = setTimeout(() => {
        console.log(`⏰ [GRACE PERIOD EXPIRED] Session ${sid} did not return. Cleaning up room ${room.roomId}.`);
        terminateRoom(room.roomId, {
          reason: 'timeout',
          initiatedBySessionId: sid
        });
      }, BACKGROUND_GRACE_PERIOD_MS);
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`StrangerConnect signaling & matchmaker running on http://0.0.0.0:${PORT}`);
});
