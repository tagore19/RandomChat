import { io } from 'socket.io-client';

// Use VITE_SOCKET_URL if explicitly set (e.g. production backend), otherwise use current origin
// so Vite's dev proxy forwards /socket.io directly to port 8080 (bypassing any mobile firewall restrictions)
const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';
};

const SERVER_URL = getSocketUrl();

// Generate or retrieve persistent ephemeral session ID for background reconnection
export const getSessionId = () => {
  if (typeof window === 'undefined') return 'server_session';
  let sid = sessionStorage.getItem('sc_session_id');
  if (!sid) {
    sid = 'sc_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    sessionStorage.setItem('sc_session_id', sid);
  }
  return sid;
};

export const socket = io(SERVER_URL, {
  auth: {
    sessionId: getSessionId()
  },
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 2000,
  timeout: 20000
});

