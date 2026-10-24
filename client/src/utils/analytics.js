import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let isInitialized = false;

// Initialize PostHog with strict privacy & anonymity settings
if (typeof window !== 'undefined' && POSTHOG_KEY) {
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,               // PRIVACY: Never capture form inputs or keystrokes
      disable_session_recording: true,  // PRIVACY: Strictly disable video session recordings
      capture_pageview: true,
      persistence: 'memory',            // PRIVACY: Zero persistent cookies on client machine
      bootstrap: {
        distinctID: 'anon_' + Math.random().toString(36).substring(2, 10)
      }
    });
    isInitialized = true;
  } catch (err) {
    console.warn('[Analytics] Failed to initialize PostHog:', err);
  }
}

/**
 * Anonymous Event Tracker
 * Tracks product health & matchmaking liquidity without collecting user identity
 */
export const analytics = {
  trackSearchStarted: () => {
    if (isInitialized) posthog.capture('search_started');
  },
  trackSearchCancelled: () => {
    if (isInitialized) posthog.capture('search_cancelled');
  },
  trackMatchConnected: () => {
    if (isInitialized) posthog.capture('match_connected');
  },
  trackMessageSent: () => {
    if (isInitialized) posthog.capture('message_sent');
  },
  trackPhotoSent: () => {
    if (isInitialized) posthog.capture('photo_sent');
  },
  trackChatSkipped: (durationSeconds = 0) => {
    if (isInitialized) posthog.capture('chat_skipped', { duration_seconds: Math.round(durationSeconds) });
  },
  trackChatLeft: (durationSeconds = 0) => {
    if (isInitialized) posthog.capture('chat_left', { duration_seconds: Math.round(durationSeconds) });
  }
};
