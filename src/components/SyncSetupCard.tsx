import React, { useState } from 'react';

interface SyncSetupCardProps {
  onConfirm: (identity: string) => void;
  currentIdentity?: string;
  isInline?: boolean; // true = settings panel, false = first-time overlay
}

export const SyncSetupCard: React.FC<SyncSetupCardProps> = ({ onConfirm, currentIdentity, isInline = false }) => {
  const [value, setValue] = useState(currentIdentity || '');
  const [inputType, setInputType] = useState<'email' | 'phone'>('email');
  const [error, setError] = useState('');

  const validate = (v: string) => {
    if (!v.trim()) return 'Please enter your email or phone number.';
    if (inputType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address.';
    if (inputType === 'phone' && !/^\+?[0-9\s\-]{8,15}$/.test(v.trim())) return 'Enter a valid phone number (with country code).';
    return '';
  };

  const handleSubmit = () => {
    const err = validate(value);
    if (err) { setError(err); return; }
    onConfirm(value.trim().toLowerCase());
  };

  const card = (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      border: '1px solid rgba(99,102,241,0.4)',
      borderRadius: 20,
      padding: '32px 28px',
      maxWidth: 420,
      width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.15)',
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Icon */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, marginBottom: 12,
          boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
        }}>🔗</div>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>
          Set Sync Identity
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
          Enter the same email or phone on all your devices to keep data in sync automatically.
        </p>
      </div>

      {/* Toggle Email / Phone */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 16,
        background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 4,
      }}>
        {(['email', 'phone'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setInputType(t); setValue(''); setError(''); }}
            style={{
              flex: 1, padding: '8px 0', border: 'none', borderRadius: 7, cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              background: inputType === t ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
              color: inputType === t ? '#fff' : 'rgba(255,255,255,0.5)',
            }}
          >
            {t === 'email' ? '✉️ Email' : '📱 Phone'}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ marginBottom: 8 }}>
        <input
          type={inputType === 'email' ? 'email' : 'tel'}
          placeholder={inputType === 'email' ? 'your@email.com' : '+91 9876543210'}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid',
            borderColor: error ? '#f87171' : 'rgba(99,102,241,0.35)',
            background: 'rgba(255,255,255,0.06)', color: '#fff',
            fontSize: 15, outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          autoComplete={inputType === 'email' ? 'email' : 'tel'}
        />
        {error && (
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#f87171' }}>{error}</p>
        )}
      </div>

      <p style={{ margin: '0 0 16px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
        💡 This is used only as your sync key — no OTP or password needed.
      </p>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        style={{
          width: '100%', padding: '13px 0', border: 'none', borderRadius: 11, cursor: 'pointer',
          background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',
          color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: '0.3px',
          boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
          transition: 'transform 0.15s, box-shadow 0.15s',
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
        {currentIdentity ? 'Update Sync Identity' : 'Start Syncing →'}
      </button>

      {currentIdentity && (
        <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Current: <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{currentIdentity}</span>
        </p>
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
