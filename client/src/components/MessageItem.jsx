import React, { useState } from 'react';

export default function MessageItem({ message, onImageClick }) {
  const isMe = message.sender === 'me';
  const isSystem = message.type === 'system';
  const isPhoto = message.type === 'photo';

  const [isRevealed, setIsRevealed] = useState(isMe);

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isSystem) {
    return (
      <div className={`classic-system-banner ${message.variant || ''}`}>
        <span className="system-icon">{message.icon || '💬'}</span>
        <span className="system-text">{message.text}</span>
      </div>
    );
  }

  const isValidPhoto = isPhoto && typeof message.image === 'string' && /^data:image\/(webp|jpeg|jpg|png);base64,/i.test(message.image);

  return (
    <div className={`chat-message-row ${isMe ? 'row-me' : 'row-stranger'}`}>
      <div className="message-header-info">
        <span className={`sender-tag ${isMe ? 'tag-me' : 'tag-stranger'}`}>
          {isMe ? 'You' : 'Stranger'}
        </span>
        <span className="message-timestamp">{formatTime(message.timestamp)}</span>
      </div>

      <div className="message-content-bubble">
        {isPhoto ? (
          isValidPhoto ? (
            <div className="ephemeral-photo-box">
              <img 
                src={message.image} 
                alt="Shared photo" 
                className={`photo-img-element ${!isRevealed ? 'photo-blurred' : ''}`}
                onClick={() => {
                  if (isRevealed && onImageClick) {
                    onImageClick(message.image);
                  }
                }}
              />

            {!isRevealed ? (
              <div 
                className="photo-reveal-overlay" 
                onClick={() => setIsRevealed(true)}
                title="Click to view photo"
              >
                <div className="reveal-badge-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>Click to view photo</span>
                </div>
                <span className="photo-safety-hint">Safe blur enabled</span>
              </div>
            ) : (
              !isMe && (
                <button 
                  className="photo-reblur-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRevealed(false);
                  }}
                  title="Hide photo"
                >
                  Hide photo
                </button>
              )
            )}
          </div>
        ) : (
          <div style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.85rem' }}>Blocked untrusted media attachment</div>
        )) : (
          <div className="text-body">{message.text}</div>
        )}
      </div>
    </div>
  );
}
