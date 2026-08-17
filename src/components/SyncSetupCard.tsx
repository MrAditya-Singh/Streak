import React, { useState } from 'react';

interface SyncSetupCardProps {
  onConfirm: (email: string, phone: string) => void;
  currentEmail?: string;
  currentPhone?: string;
  isInline?: boolean; // true = settings panel, false = first-time overlay
}

export const SyncSetupCard: React.FC<SyncSetupCardProps> = ({
  onConfirm,
  currentEmail = '',
  currentPhone = '',
  isInline = false
}) => {
  const [email, setEmail] = useState(currentEmail);
  const [phone, setPhone] = useState(currentPhone);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim() && !phone.trim()) {
      return 'Please enter at least your Gmail address or Contact number.';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Please enter a valid Gmail / email address.';
    }
    if (phone.trim() && !/^\+?[0-9\s\-]{8,15}$/.test(phone.trim())) {
      return 'Please enter a valid Contact number.';
    }
    return '';
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    onConfirm(email.trim().toLowerCase(), phone.trim());
  };

  const card = (
    <div style={{
      background: 'linear-gradient(135deg, #101428 0%, #161e38 50%, #0c2040 100%)',
      border: '1.5px solid rgba(99,102,241,0.4)',
      borderRadius: 24,
      padding: '32px 28px',
      maxWidth: 440,
      width: '100%',
      boxShadow: '0 25px 70px rgba(0,0,0,0.6), 0 0 50px rgba(99,102,241,0.2)',
      color: '#fff',
      fontFamily: '"Inter", system-ui, sans-serif',
      boxSizing: 'border-box',
    }}>
      {/* Icon */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 68, height: 68, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, marginBottom: 14,
          boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
        }}>🔗</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 21, fontWeight: 800, letterSpacing: '-0.4px' }}>
          Connect Unified Account
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          Enter your Gmail and Contact number to link your account. Your habits will sync instantly across laptop and mobile.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
        {/* Email Field */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6, letterSpacing: '0.05em' }}>
            ✉️ Gmail Address
          </label>
          <input
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid rgba(99,102,241,0.3)',
              background: 'rgba(255,255,255,0.06)', color: '#fff',
              fontSize: 14, outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        {/* Phone Field */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6, letterSpacing: '0.05em' }}>
            📱 Contact Number
          </label>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(''); }}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid rgba(99,102,241,0.3)',
              background: 'rgba(255,255,255,0.06)', color: '#fff',
              fontSize: 14, outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#f87171',
          marginBottom: 16,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        style={{
          width: '100%', padding: '14px 0', border: 'none', borderRadius: 12, cursor: 'pointer',
          background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',
          color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: '0.3px',
          boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
          (e.target as HTMLButtonElement).style.boxShadow = '0 10px 28px rgba(99,102,241,0.5)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.transform = '';
          (e.target as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)';
        }}
      >
        {currentEmail || currentPhone ? 'Update Linked Account' : 'Connect & Sync Account →'}
      </button>

      {(currentEmail || currentPhone) && (
        <div style={{ margin: '14px 0 0', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
          {currentEmail && <div>Linked Gmail: <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{currentEmail}</span></div>}
          {currentPhone && <div>Linked Phone: <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{currentPhone}</span></div>}
        </div>
      )}
    </div>
  );

  if (isInline) return card;

  // Full-screen overlay for first-time setup
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      backdropFilter: 'blur(8px)',
    }}>
      {card}
    </div>
  );
};
