import React, { useEffect } from 'react';

export default function LandingHero({ onStartChatting, onlineCount, onOpenLegal }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement?.tagName)) return;
        e.preventDefault();
        onStartChatting();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartChatting]);

  return (
    <div className="classic-landing-wrapper">
      <div className="classic-card">
        {/* Friendly Top Pill */}
        <div className="friendly-pill">
          <span className="friendly-dot"></span>
          <span>{onlineCount > 1 ? `${onlineCount.toLocaleString()} people online now` : 'Live 1-on-1 Stranger Chat'}</span>
        </div>

        {/* Main Heading */}
        <h1 className="classic-hero-title">
          Talk to strangers, <br />
          <span className="accent-highlight">make new friends.</span>
        </h1>

        {/* User-Friendly Subtitle */}
        <p className="classic-hero-desc">
          StrangerConnect pairs you instantly with random people around the world for a private, anonymous one-on-one text conversation. No registration, no downloads, and zero saved logs.
        </p>

        {/* Big Classic Start CTA */}
        <div className="cta-container">
          <button 
            type="button"
            className="classic-start-btn" 
            onClick={onStartChatting}
            aria-label="Start chatting with a random stranger"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Start Chatting</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>

          <span className="cta-shortcut-hint">
            Press <kbd className="classic-kbd">Space</kbd> or <kbd className="classic-kbd">Enter</kbd> to begin
          </span>
        </div>

        {/* Trust Badges Bar inspired by OpenTalk */}
        <div className="trust-bar">
          <span className="trust-item">⚡ Instant Match</span>
          <span className="trust-dot">·</span>
          <span className="trust-item">🔒 100% Anonymous</span>
          <span className="trust-dot">·</span>
          <span className="trust-item">🌍 100+ Countries</span>
          <span className="trust-dot">·</span>
          <span className="trust-item">🛡️ Safe & Moderated</span>
          <span className="trust-dot">·</span>
          <span className="trust-item">🆓 100% Free</span>
        </div>

        {/* Feature Highlights Grid */}
        <div className="classic-features-row">
          <div className="classic-feature-item">
            <div className="feature-icon-badge">🎭</div>
            <div className="feature-text-block">
              <strong>Zero Registration</strong>
              <span>No email, password, or profile needed. Instant access in any browser.</span>
            </div>
          </div>

          <div className="classic-feature-item">
            <div className="feature-icon-badge">🔒</div>
            <div className="feature-text-block">
              <strong>Private & Ephemeral</strong>
              <span>Messages are in-memory only. Zero database storage. Cleared on disconnect.</span>
            </div>
          </div>

          <div className="classic-feature-item">
            <div className="feature-icon-badge">📸</div>
            <div className="feature-text-block">
              <strong>Safe Photo Sharing</strong>
              <span>Client-side compression. Photos remain blurred until you choose to tap and view.</span>
            </div>
          </div>
        </div>

        {/* Friendly Community Notice */}
        <div className="community-notice-box">
          <span className="notice-icon">🤝</span>
          <span>Please be kind, polite, and respectful to everyone you meet. You must be 18+ to use this service.</span>
        </div>

        {/* Classic Footer Links */}
        <div className="classic-landing-footer">
          <button type="button" className="footer-link-btn" onClick={() => onOpenLegal('terms')}>
            Terms of Service
          </button>
          <span className="footer-sep">·</span>
          <button type="button" className="footer-link-btn" onClick={() => onOpenLegal('privacy')}>
            Privacy Policy
          </button>
          <span className="footer-sep">·</span>
          <button type="button" className="footer-link-btn" onClick={() => onOpenLegal('safety')}>
            Community & Safety
          </button>
        </div>
      </div>
    </div>
  );
}
