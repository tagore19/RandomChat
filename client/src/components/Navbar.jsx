import React from 'react';

export default function Navbar({ onlineCount, isConnected }) {
  return (
    <header className="classic-navbar">
      <div className="navbar-brand">
        <div className="brand-icon-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <span className="brand-name">StrangerConnect</span>
      </div>

      <div className="navbar-center-tag">
        <span>Anonymous 1-on-1 Chat</span>
      </div>

      <div className="navbar-right">
        <div className="online-indicator-pill">
          <span className={`online-pulse-dot ${isConnected ? '' : 'offline'}`}></span>
          <span>{isConnected ? `${onlineCount.toLocaleString()} online now` : 'Connecting...'}</span>
        </div>
      </div>
    </header>
  );
}
