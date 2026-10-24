import React, { useState, useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import ReportModal from './ReportModal';
import { compressImage } from '../utils/imageCompressor';

export default function ChatView({
  messages,
  isPartnerTyping,
  partnerLeft,
  onSendMessage,
  onSendPhoto,
  onSkip,
  onLeave,
  onReport,
  onTypingChange
}) {
  const [inputText, setInputText] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportToast, setReportToast] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollMessagesToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        if (smooth) {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        } else {
          container.scrollTop = container.scrollHeight;
        }
      }
    }
  };

  useEffect(() => {
    scrollMessagesToBottom(true);
  }, [messages.length, isPartnerTyping]);

  useEffect(() => {
    if (!partnerLeft) {
      textInputRef.current?.focus();
    }
  }, [partnerLeft]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isReportOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      }
      if (partnerLeft && (e.key === ' ' || e.key === 'Enter') && document.activeElement !== textInputRef.current) {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip, partnerLeft, isReportOpen]);

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.nativeEvent.isComposing || e.keyCode === 229) {
        return;
      }
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollMessagesToBottom(false);
    }, 250);
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    onTypingChange(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTypingChange(false);
    }, 1500);
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || partnerLeft) return;

    onSendMessage(inputText.trim());
    setInputText('');
    onTypingChange(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressed = await compressImage(file, 800, 0.75);
      onSendPhoto(compressed.dataUrl);
    } catch (err) {
      console.error('Failed to compress image:', err);
      alert('Could not attach image. Please select a valid photo.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmitReport = (reason) => {
    setIsReportOpen(false);
    if (onReport) {
      onReport(reason);
    }
    setReportToast('Report submitted. Connecting you with a new stranger...');
    setTimeout(() => setReportToast(null), 3500);
  };

  return (
    <div className="classic-chat-container">
      {/* Top Chat Action Bar */}
      <div className="chat-top-bar">
        <div className="chat-partner-badge">
          <div className="avatar-circle">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="partner-details">
            <span className="partner-title">Stranger</span>
            <span className={`partner-live-state ${partnerLeft ? 'state-offline' : 'state-online'}`}>
              {partnerLeft ? 'Disconnected' : 'Online & Chatting'}
            </span>
          </div>
        </div>

        <div className="chat-nav-actions">
          {/* In-Chat Report Button inspired by OpenTalk */}
          {!partnerLeft && (
            <button 
              type="button"
              className="chat-report-flag-btn" 
              onClick={() => setIsReportOpen(true)}
              title="Report inappropriate behavior"
              aria-label="Report stranger"
            >
              <span className="flag-icon">⚑</span>
              <span className="flag-text">Report</span>
            </button>
          )}

          <button 
            type="button"
            className="classic-skip-btn" 
            onClick={onSkip} 
            title="Disconnect and find another stranger (Esc)"
          >
            <span>Next Stranger</span>
            <kbd className="classic-kbd-light">Esc</kbd>
          </button>
          <button 
            type="button"
            className="classic-leave-btn" 
            onClick={onLeave}
          >
            Leave
          </button>
        </div>
      </div>

      {/* Inline Toast Notification for Reports */}
      {reportToast && (
        <div className="report-toast-banner" role="status">
          <span>🛡️ {reportToast}</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="chat-messages-scroll">
        <div className="chat-start-notice">
          <span>💬 You are now connected with a random stranger. Say hello!</span>
        </div>

        {messages.map((msg) => (
          <MessageItem 
            key={msg.id} 
            message={msg} 
            onImageClick={(imgUrl) => setModalImage(imgUrl)}
          />
        ))}

        {isPartnerTyping && !partnerLeft && (
          <div className="typing-notice-bar">
            <div className="typing-dot-group">
              <div className="typing-bounce-dot"></div>
              <div className="typing-bounce-dot"></div>
              <div className="typing-bounce-dot"></div>
            </div>
            <span className="typing-text">Stranger is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Disconnected Notice or Chat Input Bar */}
      {partnerLeft ? (
        <div className="disconnected-alert-bar">
          <div className="disconnected-info">
            <span className="disconnected-dot"></span>
            <span>Stranger has left the conversation.</span>
          </div>
          <button className="find-new-btn" onClick={onSkip}>
            <span>Find a New Stranger</span>
            <kbd className="classic-kbd">Space</kbd>
          </button>
        </div>
      ) : (
        <form className="chat-input-bar" onSubmit={handleSend}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            style={{ display: 'none' }}
          />

          <button 
            type="button" 
            className="attach-photo-btn" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
            title="Share a photo safely"
            aria-label="Attach photo"
          >
            {isCompressing ? (
              <span className="compressing-text">...</span>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            )}
          </button>

          <div className="input-field-wrapper">
            <input 
              ref={textInputRef}
              type="text" 
              className="chat-text-box" 
              placeholder="Type your message here..."
              value={inputText}
              onChange={handleTextChange}
              onKeyDown={handleInputKeyDown}
              onFocus={handleInputFocus}
              maxLength={2000}
              enterKeyHint="send"
              inputMode="text"
              autoComplete="off"
              autoCorrect="on"
              spellCheck="true"
            />
          </div>

          <button 
            type="submit" 
            className="send-message-btn" 
            disabled={!inputText.trim()}
            title="Send Message"
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      )}

      {/* Fullscreen Photo Modal */}
      {modalImage && (
        <div className="photo-modal-backdrop" onClick={() => setModalImage(null)}>
          <div className="modal-content-wrap">
            <img src={modalImage} alt="Fullscreen preview" className="modal-photo-img" />
            <button type="button" className="modal-close-btn" onClick={() => setModalImage(null)}>✕ Close</button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmitReport={handleSubmitReport}
      />
    </div>
  );
}
