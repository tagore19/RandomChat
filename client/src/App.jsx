import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import SearchingOverlay from './components/SearchingOverlay';
import ChatView from './components/ChatView';
import ConsentGateModal from './components/ConsentGateModal';
import LegalModal from './components/LegalModal';
import { socket } from './socket';
import { analytics } from './utils/analytics';
import './App.css';

const STORAGE_KEYS = {
  APP_STATE: 'sc_active_app_state',
  ROOM_ID: 'sc_active_room_id',
  MESSAGES: 'sc_active_messages',
  CHAT_START: 'sc_active_chat_start',
  SAFETY_CONSENT: 'sc_safety_accepted_v1'
};

const getPersistedState = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEYS.APP_STATE);
    const roomId = sessionStorage.getItem(STORAGE_KEYS.ROOM_ID);
    if (saved === 'chatting' && roomId) return 'chatting';
  } catch {}
  return 'landing';
};

const getPersistedMessages = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

const clearPersistedChat = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.APP_STATE);
    sessionStorage.removeItem(STORAGE_KEYS.ROOM_ID);
    sessionStorage.removeItem(STORAGE_KEYS.MESSAGES);
    sessionStorage.removeItem(STORAGE_KEYS.CHAT_START);
  } catch {}
};

export default function App() {
  const [appState, setAppState] = useState(getPersistedState);
  const [onlineCount, setOnlineCount] = useState(1);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState(getPersistedMessages);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [partnerLeft, setPartnerLeft] = useState(false);

  // Modals
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState(null);

  const chatStartTimeRef = useRef(Number(sessionStorage.getItem(STORAGE_KEYS.CHAT_START)) || null);
  const appStateRef = useRef(appState);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  // Persist active chat state & messages across app-switches or mobile tab reloads
  useEffect(() => {
    try {
      if (appState === 'chatting') {
        sessionStorage.setItem(STORAGE_KEYS.APP_STATE, 'chatting');
        sessionStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      }
    } catch {}
  }, [appState, messages]);

  // Viewport handling for iOS Safari & Android virtual keyboards
  useEffect(() => {
    let rafId = null;
    const updateViewport = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (window.visualViewport) {
          const vv = window.visualViewport;
          const height = vv.height;
          const offsetTop = vv.offsetTop || 0;
          const isKeyboardOpen = window.innerHeight - height > 140;

          document.documentElement.style.setProperty('--app-height', `${height}px`);
          document.documentElement.style.setProperty('--app-top', `${offsetTop}px`);
          document.documentElement.style.setProperty(
            '--keyboard-safe-bottom',
            isKeyboardOpen ? '0px' : 'var(--safe-bottom)'
          );
        } else {
          document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
          document.documentElement.style.setProperty('--app-top', '0px');
          document.documentElement.style.setProperty('--keyboard-safe-bottom', 'var(--safe-bottom)');
        }
      });
    };

    updateViewport();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
      window.visualViewport.addEventListener('scroll', updateViewport);
    } else {
      window.addEventListener('resize', updateViewport);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
        window.visualViewport.removeEventListener('scroll', updateViewport);
      } else {
        window.removeEventListener('resize', updateViewport);
      }
    };
  }, []);

  // Socket Lifecycle and Background Tab Synchronization
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (socket.connected) {
          socket.emit('check_session');
        } else {
          socket.connect();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('check_session');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleOnlineCount = (count) => {
      setOnlineCount(count);
    };

    const handleSearching = () => {
      setAppState('searching');
    };

    const handleMatched = (data) => {
      clearPersistedChat();
      try {
        sessionStorage.setItem(STORAGE_KEYS.APP_STATE, 'chatting');
        sessionStorage.setItem(STORAGE_KEYS.ROOM_ID, data.roomId);
        sessionStorage.setItem(STORAGE_KEYS.CHAT_START, String(Date.now()));
      } catch {}

      chatStartTimeRef.current = Date.now();
      analytics.trackMatched();

      setMessages([]);
      setPartnerLeft(false);
      setIsPartnerTyping(false);
      setAppState('chatting');
    };

    const handleSessionResumed = (data) => {
      try {
        sessionStorage.setItem(STORAGE_KEYS.APP_STATE, 'chatting');
        sessionStorage.setItem(STORAGE_KEYS.ROOM_ID, data.roomId);
      } catch {}
      setPartnerLeft(false);
      setAppState('chatting');
    };

    const handleSessionInvalidated = () => {
      clearPersistedChat();
      if (appStateRef.current === 'chatting') {
        setPartnerLeft(true);
        setIsPartnerTyping(false);
      }
    };

    const handleBufferedMessages = (queuedMessages) => {
      if (Array.isArray(queuedMessages) && queuedMessages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newUnique = queuedMessages.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newUnique];
        });
      }
    };

    const handleChatMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      analytics.trackMessageReceived();
    };

    const handleReceivePhoto = (photoMsg) => {
      setMessages((prev) => [...prev, photoMsg]);
      analytics.trackPhotoReceived();
    };

    const handleTyping = ({ isTyping }) => {
      setIsPartnerTyping(isTyping);
    };

    const handleStrangerLeft = () => {
      clearPersistedChat();
      setPartnerLeft(true);
      setIsPartnerTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys_left_${Date.now()}`,
          type: 'system',
          text: 'Stranger has left the conversation.',
          icon: '🚪',
          variant: 'left'
        }
      ]);
    };

    const handleStrangerTimeout = () => {
      clearPersistedChat();
      setPartnerLeft(true);
      setIsPartnerTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys_timeout_${Date.now()}`,
          type: 'system',
          text: 'Stranger disconnected due to inactivity.',
          icon: '⏳',
          variant: 'left'
        }
      ]);
    };

    const handleReportedNotice = (notice) => {
      clearPersistedChat();
      setPartnerLeft(true);
      setIsPartnerTyping(false);
      alert(notice?.message || 'The conversation ended following a community report.');
      setAppState('landing');
    };

    const handleRateLimited = (err) => {
      alert(err.message || 'You are sending messages too quickly. Please slow down.');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('online_count', handleOnlineCount);
    socket.on('searching', handleSearching);
    socket.on('matched', handleMatched);
    socket.on('session_resumed', handleSessionResumed);
    socket.on('session_invalidated', handleSessionInvalidated);
    socket.on('buffered_messages', handleBufferedMessages);
    socket.on('chat_message', handleChatMessage);
    socket.on('receive_photo', handleReceivePhoto);
    socket.on('typing', handleTyping);
    socket.on('stranger_left', handleStrangerLeft);
    socket.on('stranger_disconnected', handleStrangerTimeout);
    socket.on('reported_notice', handleReportedNotice);
    socket.on('rate_limited', handleRateLimited);

    if (socket.connected) {
      setIsConnected(true);
      socket.emit('check_session');
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('online_count', handleOnlineCount);
      socket.off('searching', handleSearching);
      socket.off('matched', handleMatched);
      socket.off('session_resumed', handleSessionResumed);
      socket.off('session_invalidated', handleSessionInvalidated);
      socket.off('buffered_messages', handleBufferedMessages);
      socket.off('chat_message', handleChatMessage);
      socket.off('receive_photo', handleReceivePhoto);
      socket.off('typing', handleTyping);
      socket.off('stranger_left', handleStrangerLeft);
      socket.off('stranger_disconnected', handleStrangerTimeout);
      socket.off('reported_notice', handleReportedNotice);
      socket.off('rate_limited', handleRateLimited);
    };
  }, []);

  // Action Handlers
  const triggerMatchmaking = useCallback(() => {
    clearPersistedChat();
    analytics.trackSearchStarted();
    setAppState('searching');
    if (!socket.connected) {
      socket.connect();
      socket.once('connect', () => {
        socket.emit('find_stranger');
      });
    } else {
      socket.emit('find_stranger');
    }
  }, []);

  const handleStartChatting = useCallback(() => {
    const hasConsented = localStorage.getItem(STORAGE_KEYS.SAFETY_CONSENT) === 'true';
    if (!hasConsented) {
      setIsConsentOpen(true);
      return;
    }
    triggerMatchmaking();
  }, [triggerMatchmaking]);

  const handleConsentAgree = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAFETY_CONSENT, 'true');
    } catch {}
    setIsConsentOpen(false);
    triggerMatchmaking();
  }, [triggerMatchmaking]);

  const handleConsentReject = useCallback(() => {
    setIsConsentOpen(false);
  }, []);

  const handleCancelSearch = useCallback(() => {
    clearPersistedChat();
    analytics.trackSearchCancelled();
    socket.emit('stop_search');
    setAppState('landing');
  }, []);

  const handleSkip = useCallback(() => {
    clearPersistedChat();
    const duration = chatStartTimeRef.current ? (Date.now() - chatStartTimeRef.current) / 1000 : 0;
    analytics.trackChatSkipped(duration);
    chatStartTimeRef.current = null;

    setAppState('searching');
    setPartnerLeft(false);
    setIsPartnerTyping(false);
    if (!socket.connected) {
      socket.connect();
      socket.once('connect', () => {
        socket.emit('skip', { autoRequeue: true });
      });
    } else {
      socket.emit('skip', { autoRequeue: true });
    }
  }, []);

  const handleReportStranger = useCallback((category) => {
    clearPersistedChat();
    const duration = chatStartTimeRef.current ? (Date.now() - chatStartTimeRef.current) / 1000 : 0;
    analytics.trackChatSkipped(duration);
    chatStartTimeRef.current = null;

    setAppState('searching');
    setPartnerLeft(false);
    setIsPartnerTyping(false);
    socket.emit('report_stranger', { category });
  }, []);

  const handleLeave = useCallback(() => {
    clearPersistedChat();
    const duration = chatStartTimeRef.current ? (Date.now() - chatStartTimeRef.current) / 1000 : 0;
    analytics.trackChatLeft(duration);
    chatStartTimeRef.current = null;

    socket.emit('leave_room');
    setAppState('landing');
    setMessages([]);
    setPartnerLeft(false);
  }, []);

  const handleSendMessage = useCallback((text) => {
    const msgId = `me_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMsg = {
      id: msgId,
      sender: 'me',
      type: 'text',
      text,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, newMsg]);
    analytics.trackMessageSent();
    socket.emit('chat_message', { id: msgId, text });
  }, []);

  const handleSendPhoto = useCallback((dataUrl) => {
    const imgId = `me_img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMsg = {
      id: imgId,
      sender: 'me',
      type: 'photo',
      image: dataUrl,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, newMsg]);
    analytics.trackPhotoSent();
    socket.emit('send_photo', { id: imgId, image: dataUrl });
  }, []);

  const handleTypingChange = useCallback((isTyping) => {
    socket.emit('typing', { isTyping });
  }, []);

  return (
    <div className="app-container">
      <Navbar onlineCount={onlineCount} isConnected={isConnected} />

      <main className="figma-workspace">
        {appState === 'landing' && (
          <LandingHero 
            onStartChatting={handleStartChatting} 
            onlineCount={onlineCount} 
            onOpenLegal={(tab) => setLegalModalTab(tab)}
          />
        )}

        {appState === 'searching' && (
          <SearchingOverlay 
            onCancel={handleCancelSearch} 
          />
        )}

        {appState === 'chatting' && (
          <ChatView 
            messages={messages}
            isPartnerTyping={isPartnerTyping}
            partnerLeft={partnerLeft}
            onSendMessage={handleSendMessage}
            onSendPhoto={handleSendPhoto}
            onSkip={handleSkip}
            onLeave={handleLeave}
            onReport={handleReportStranger}
            onTypingChange={handleTypingChange}
          />
        )}
      </main>

      {/* 18+ Safety & Age Verification Modal */}
      <ConsentGateModal 
        isOpen={isConsentOpen}
        onAgree={handleConsentAgree}
        onReject={handleConsentReject}
      />

      {/* Terms of Service / Privacy / Community Safety Modal */}
      <LegalModal 
        isOpen={Boolean(legalModalTab)}
        initialTab={legalModalTab || 'terms'}
        onClose={() => setLegalModalTab(null)}
      />
    </div>
  );
}
