import React, { useState } from 'react';

const REPORT_REASONS = [
  { id: 'inappropriate', label: 'Inappropriate Content or Photos', desc: 'Nudity, sexual content, or suggestive images' },
  { id: 'harassment', label: 'Harassment or Bullying', desc: 'Abusive language, hate speech, or threats' },
  { id: 'spam', label: 'Spam, Links or Advertising', desc: 'Promoting external channels, bots, or scams' },
  { id: 'underage', label: 'Appears Underage (<18)', desc: 'User indicates or appears to be a minor' },
  { id: 'other', label: 'Other Misbehavior', desc: 'Disruptive or inappropriate conversation' }
];

export default function ReportModal({ isOpen, onClose, onSubmitReport }) {
  const [selectedReason, setSelectedReason] = useState('inappropriate');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitReport(selectedReason);
  };

  return (
    <div className="classic-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <div className="classic-modal-card report-card">
        <div className="report-header">
          <div className="report-flag-icon">⚑</div>
          <div>
            <h3 id="report-title" className="report-title">Report Stranger</h3>
            <p className="report-desc">Reporting immediately ends this conversation and finds you a new stranger.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <div className="report-reasons-group">
            {REPORT_REASONS.map((reason) => (
              <label 
                key={reason.id} 
                className={`report-radio-label ${selectedReason === reason.id ? 'active' : ''}`}
              >
                <input 
                  type="radio" 
                  name="reportReason" 
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={() => setSelectedReason(reason.id)}
                  className="report-radio-input"
                />
                <div className="report-text-wrap">
                  <span className="report-reason-title">{reason.label}</span>
                  <span className="report-reason-desc">{reason.desc}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="report-actions">
            <button type="submit" className="report-submit-btn">
              Submit & Find Next Stranger
            </button>
            <button type="button" className="report-cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
