import React from 'react';

interface DuoMascotProps {
  size?: number;
  mood?: 'happy' | 'fire' | 'celebrate' | 'focused';
  className?: string;
}

export const DuoMascot: React.FC<DuoMascotProps> = ({ size = 64, mood = 'happy', className = '' }) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="drop-shadow-[0_4px_12px_rgba(88,204,2,0.4)]"
      >
        {/* Flame Aura behind mascot if mood is fire */}
        {mood === 'fire' && (
          <g className="animate-flame opacity-90">
            <path
              d="M 50 5 Q 65 30 75 45 Q 85 65 65 85 Q 50 95 35 85 Q 15 65 25 45 Q 35 30 50 5 Z"
              fill="url(#fireGradientMascot)"
            />
          </g>
        )}

        <defs>
          <linearGradient id="bodyGreen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#78e018" />
            <stop offset="50%" stopColor="#58cc02" />
            <stop offset="100%" stopColor="#43a000" />
          </linearGradient>

          <linearGradient id="bellyGreen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a3f542" />
            <stop offset="100%" stopColor="#7be310" />
          </linearGradient>

          <linearGradient id="beakOrange" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffb020" />
            <stop offset="100%" stopColor="#ff8400" />
          </linearGradient>

          <linearGradient id="fireGradientMascot" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffee55" />
            <stop offset="40%" stopColor="#ff8800" />
            <stop offset="100%" stopColor="#ff2200" />
          </linearGradient>
        </defs>

        {/* Mascot Body */}
        <path
          d="M 22 45 C 22 22, 35 15, 50 15 C 65 15, 78 22, 78 45 C 78 70, 72 85, 50 85 C 28 85, 22 70, 22 45 Z"
          fill="url(#bodyGreen)"
        />

        {/* Mascot Wings */}
        <path
          d="M 22 42 C 12 48, 10 65, 20 72 C 22 65, 24 55, 25 48 Z"
          fill="#43a000"
        />
        <path
          d="M 78 42 C 88 48, 90 65, 80 72 C 78 65, 76 55, 75 48 Z"
          fill="#43a000"
        />

        {/* Mascot Belly / Chest Patch */}
        <ellipse cx="50" cy="58" rx="20" ry="18" fill="url(#bellyGreen)" />

        {/* Feather Details */}
        <path d="M 44 54 Q 50 58 56 54" stroke="#46a302" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 41 62 Q 50 67 59 62" stroke="#46a302" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Big Owl Eyes */}
        <g>
          {/* Eye Background White */}
          <ellipse cx="38" cy="38" rx="10" ry="11" fill="#ffffff" />
          <ellipse cx="62" cy="38" rx="10" ry="11" fill="#ffffff" />

          {/* Eye Iris Dark Pupil */}
          <ellipse cx="39" cy="38" rx="6" ry="7" fill="#1b2e05" />
          <ellipse cx="61" cy="38" rx="6" ry="7" fill="#1b2e05" />

          {/* Eye Sparkle Reflections */}
          <circle cx="37" cy="35" r="2.5" fill="#ffffff" />
          <circle cx="59" cy="35" r="2.5" fill="#ffffff" />
          <circle cx="41" cy="40" r="1.2" fill="#ffffff" />
          <circle cx="63" cy="40" r="1.2" fill="#ffffff" />
        </g>

        {/* Cute Beak */}
        <polygon
          points="50,43 43,49 57,49"
          fill="url(#beakOrange)"
          stroke="#e06500"
          strokeWidth="0.8"
        />
        <polygon
          points="50,56 43,49 57,49"
          fill="url(#beakOrange)"
          stroke="#e06500"
          strokeWidth="0.8"
        />

        {/* Cute Feet */}
        <ellipse cx="40" cy="85" rx="5" ry="3" fill="#ff9800" />
        <ellipse cx="60" cy="85" rx="5" ry="3" fill="#ff9800" />

        {/* Flame crown on head if mood is fire */}
        {mood === 'fire' && (
          <g className="animate-bounce">
            <path
              d="M 50 12 Q 54 2 58 8 Q 63 3 61 14 Q 50 16 50 12 Z"
              fill="#ffee22"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
