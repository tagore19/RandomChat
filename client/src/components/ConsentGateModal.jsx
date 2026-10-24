import React from 'react';

export default function ConsentGateModal({ isOpen, onAgree, onReject }) {
  if (!isOpen) return null;

  return (
    <div className="classic-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className="classic-modal-card consent-card">
        <div className="consent-badge-icon">
          <span>🔞</span>
        </div>

        <h2 id="consent-title" className="classic-modal-title">
          Welcome to StrangerConnect
        </h2>

        <p className="consent-subtitle">
          Please confirm the following community standards before you begin:
        </p>

        <div className="consent-checklist">
          <div className="consent-item">
            <span className="consent-check-ico">✓</span>
            <div>
              <strong>18+ Adults Only</strong>
              <p>You must be at least 18 years of age to use this random chat platform.</p>
            </div>
          </div>

          <div className="consent-item">
            <span className="consent-check-ico">✓</span>
            <div>
              <strong>Protect Your Privacy</strong>
              <p>Never share phone numbers, physical addresses, passwords, or personal social accounts with strangers.</p>
            </div>
          </div>

          <div className="consent-item">
            <span className="consent-check-ico">✓</span>
            <div>
              <strong>Zero Tolerance for Abuse</strong>
              <p>Harassment, hate speech, spam, and unlawful content will result in immediate bans.</p>
            </div>
          </div>
        </div>

        <div className="consent-actions">
          <button 
            type="button" 
            className="consent-agree-btn"
            onClick={onAgree}
            autoFocus
          >
            I am 18+ and Agree to Terms
          </button>
          <button 
            type="button" 
            className="consent-reject-btn"
            onClick={onReject}
          >
            Leave
          </button>
        </div>

        <span className="consent-disclaimer-note">
          100% Free · No Registration · Ephemeral In-Memory Chat
        </span>
      </div>
    </div>
  );
}
