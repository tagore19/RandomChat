import React, { useState } from 'react';

export default function LegalModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div className="classic-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="legal-modal-title">
      <div className="classic-modal-card legal-card">
        {/* Modal Top Bar */}
        <div className="legal-top-bar">
          <div className="legal-tabs-row" role="tablist">
            <button 
              type="button" 
              role="tab" 
              aria-selected={activeTab === 'terms'}
              className={`legal-tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
              onClick={() => setActiveTab('terms')}
            >
              Terms of Service
            </button>
            <button 
              type="button" 
              role="tab" 
              aria-selected={activeTab === 'privacy'}
              className={`legal-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              Privacy Policy
            </button>
            <button 
              type="button" 
              role="tab" 
              aria-selected={activeTab === 'safety'}
              className={`legal-tab-btn ${activeTab === 'safety' ? 'active' : ''}`}
              onClick={() => setActiveTab('safety')}
            >
              Safety Rules
            </button>
          </div>

          <button 
            type="button" 
            className="legal-close-icon-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Content Scroll Area */}
        <div className="legal-content-scroll">
          {activeTab === 'terms' && (
            <div className="legal-tab-panel">
              <h2 id="legal-modal-title" className="legal-heading">Terms of Service</h2>
              <span className="legal-date">Last Updated: October 2026</span>

              <section className="legal-section">
                <h3>1. Age Requirement</h3>
                <p>
                  You must be at least 18 years of age to access or use StrangerConnect. If you are under 18, you are strictly prohibited from using this service.
                </p>
              </section>

              <section className="legal-section">
                <h3>2. Acceptable Use & Conduct</h3>
                <p>StrangerConnect is intended for friendly, spontaneous one-on-one text conversations. You agree NOT to:</p>
                <ul>
                  <li>Transmit unlawful, harassing, defamatory, abusive, or sexually explicit content.</li>
                  <li>Engage in unsolicited commercial advertising, spamming, or phishing.</li>
                  <li>Impersonate any person or misrepresent your affiliation.</li>
                  <li>Attempt to harvest personal data or breach system boundaries.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>3. Disclaimer of Interaction Liability</h3>
                <p>
                  StrangerConnect provides an unmoderated peer-to-peer medium connecting random strangers worldwide. You understand and acknowledge that you are solely responsible for your interactions and what information you choose to share.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="legal-tab-panel">
              <h2 id="legal-modal-title" className="legal-heading">Privacy Policy</h2>
              <span className="legal-date">Last Updated: October 2026</span>

              <section className="legal-section">
                <h3>1. Zero Persistent Database Storage</h3>
                <p>
                  StrangerConnect does NOT store messages, photos, or conversation histories in any database. All messages are transmitted transiently through memory and vanish immediately when you leave or refresh the chat.
                </p>
              </section>

              <section className="legal-section">
                <h3>2. No Account or Registration</h3>
                <p>
                  We do not collect names, email addresses, phone numbers, or social media links. Matching is 100% anonymous.
                </p>
              </section>

              <section className="legal-section">
                <h3>3. Ephemeral Photos</h3>
                <p>
                  Photos shared are compressed on your local device before transmission. They are kept only in the transient memory of the active conversation and are completely purged upon room closure.
                </p>
              </section>

              <section className="legal-section">
                <h3>4. Safe Session ID</h3>
                <p>
                  A temporary session ID is stored in your browser session storage solely to allow quick app-switching on mobile without dropping your active conversation. It is cleared when you close your browser tab.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="legal-tab-panel">
              <h2 id="legal-modal-title" className="legal-heading">Community & Safety Guidelines</h2>
              <span className="legal-date">Tips for a safe & fun chat</span>

              <div className="safety-tips-list">
                <div className="safety-tip-card">
                  <div className="safety-tip-icon">🛡️</div>
                  <div>
                    <strong>Keep Personal Info Secret</strong>
                    <p>Never share your full name, location, school, phone number, Snapchat, Instagram, or banking details.</p>
                  </div>
                </div>

                <div className="safety-tip-card">
                  <div className="safety-tip-icon">⚑</div>
                  <div>
                    <strong>Use the Report Button</strong>
                    <p>If someone is rude, sends inappropriate content, or makes you uncomfortable, tap the flag icon (⚑) to instantly report them and connect with someone else.</p>
                  </div>
                </div>

                <div className="safety-tip-card">
                  <div className="safety-tip-icon">⏭</div>
                  <div>
                    <strong>Skip Anytime</strong>
                    <p>You are never trapped in a conversation. Tap "Next Stranger" or press the Esc key at any time to move on.</p>
                  </div>
                </div>

                <div className="safety-tip-card">
                  <div className="safety-tip-icon">🤝</div>
                  <div>
                    <strong>Be Friendly & Respectful</strong>
                    <p>StrangerConnect is a community of diverse individuals. Treat everyone with dignity, courtesy, and respect.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="legal-bottom-bar">
          <button type="button" className="legal-confirm-btn" onClick={onClose}>
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
