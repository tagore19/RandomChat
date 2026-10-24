import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

let isInitialized = false;

if (typeof window !== 'undefined' && SENTRY_DSN) {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 0.2, // 20% performance trace sampling
      sendDefaultPii: false, // PRIVACY: Never send IP addresses or user information
      beforeSend: (event) => {
        // Strip any potential PII or message content
        if (event.user) {
          delete event.user.ip_address;
          delete event.user.email;
        }
        return event;
      }
    });
    isInitialized = true;
  } catch (err) {
    console.warn('[Sentry] Failed to initialize frontend error monitoring:', err);
  }
}

export const logger = {
  captureException: (error, context = {}) => {
    if (isInitialized) {
      Sentry.captureException(error, { extra: context });
    } else {
      console.error('[App Error]:', error, context);
    }
  }
};
