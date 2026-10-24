import React, { useEffect } from 'react';

export default function SearchingOverlay({ onCancel }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="searching-container">
      <div className="searching-card">
        {/* Animated Radar Pulse */}
        <div className="radar-circle-wrap">
          <div className="radar-ring r1"></div>
          <div className="radar-ring r2"></div>
          <div className="radar-ring r3"></div>
          <div className="radar-center-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
        </div>

        <h2 className="searching-headline">Looking for a stranger...</h2>
        <p className="searching-subtext">Connecting you with someone online. Hang tight!</p>

        <div className="icebreaker-tip">
          <span>💡</span>
          <span>Tip: Break the ice with a friendly greeting or share your favorite hobby!</span>
        </div>

        <button className="classic-cancel-btn" onClick={onCancel} title="Stop searching (Esc)">
          <span>Cancel</span>
          <kbd className="classic-kbd">Esc</kbd>
        </button>
      </div>
    </div>
  );
}
