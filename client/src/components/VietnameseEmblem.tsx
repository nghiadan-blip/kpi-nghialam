import React from 'react';

interface Props {
  className?: string;
  size?: number;
}

export const VietnameseEmblem: React.FC<Props> = ({ className = 'w-10 h-10', size = 40 }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`inline-block drop-shadow-md flex-shrink-0 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Red Disc Gradient */}
        <radialGradient id="emblemRedGrad" cx="50%" cy="45%" r="55%" fx="45%" fy="35%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="70%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </radialGradient>

        {/* Gold Star & Rice Gradient */}
        <linearGradient id="emblemGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>

        {/* Outer Ring Gold */}
        <linearGradient id="outerRingGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>

        {/* Shadow filter */}
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#78350f" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer Golden Border Circle */}
      <circle cx="100" cy="100" r="98" fill="url(#outerRingGold)" stroke="#b45309" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="93" fill="#7f1d1d" />

      {/* Central Red Background Disc */}
      <circle cx="100" cy="100" r="90" fill="url(#emblemRedGrad)" stroke="#fef08a" strokeWidth="1" />

      {/* Golden Sunrays in background */}
      <g stroke="url(#emblemGoldGrad)" strokeWidth="1.2" opacity="0.35">
        <line x1="100" y1="10" x2="100" y2="40" />
        <line x1="100" y1="160" x2="100" y2="190" />
        <line x1="10" y1="100" x2="40" y2="100" />
        <line x1="160" y1="100" x2="190" y2="100" />
        <line x1="36" y1="36" x2="58" y2="58" />
        <line x1="142" y1="142" x2="164" y2="164" />
        <line x1="164" y1="36" x2="142" y2="58" />
        <line x1="58" y1="142" x2="36" y2="164" />
      </g>

      {/* Left Rice Stalk (Bông lúa bên trái) */}
      <g filter="url(#goldGlow)" fill="url(#emblemGoldGrad)" stroke="#854d0e" strokeWidth="0.6">
        <path d="M 28,110 C 22,75 42,42 75,22 C 70,32 55,50 48,72 C 42,90 40,110 42,125 Z" />
        {/* Rice grains left */}
        <ellipse cx="38" cy="60" rx="6" ry="11" transform="rotate(-30 38 60)" />
        <ellipse cx="48" cy="45" rx="6" ry="11" transform="rotate(-20 48 45)" />
        <ellipse cx="62" cy="34" rx="6" ry="11" transform="rotate(-10 62 34)" />
        <ellipse cx="78" cy="26" rx="5.5" ry="10" transform="rotate(5 78 26)" />
        <ellipse cx="32" cy="78" rx="6.5" ry="12" transform="rotate(-40 32 78)" />
        <ellipse cx="28" cy="98" rx="7" ry="12" transform="rotate(-50 28 98)" />
        <ellipse cx="28" cy="118" rx="7" ry="12" transform="rotate(-60 28 118)" />
        <ellipse cx="32" cy="138" rx="7" ry="12" transform="rotate(-70 32 138)" />
        <ellipse cx="40" cy="155" rx="6.5" ry="11" transform="rotate(-80 40 155)" />
      </g>

      {/* Right Rice Stalk (Bông lúa bên phải) */}
      <g filter="url(#goldGlow)" fill="url(#emblemGoldGrad)" stroke="#854d0e" strokeWidth="0.6">
        <path d="M 172,110 C 178,75 158,42 125,22 C 130,32 145,50 152,72 C 158,90 160,110 158,125 Z" />
        {/* Rice grains right */}
        <ellipse cx="162" cy="60" rx="6" ry="11" transform="rotate(30 162 60)" />
        <ellipse cx="152" cy="45" rx="6" ry="11" transform="rotate(20 152 45)" />
        <ellipse cx="138" cy="34" rx="6" ry="11" transform="rotate(10 138 34)" />
        <ellipse cx="122" cy="26" rx="5.5" ry="10" transform="rotate(-5 122 26)" />
        <ellipse cx="168" cy="78" rx="6.5" ry="12" transform="rotate(40 168 78)" />
        <ellipse cx="172" cy="98" rx="7" ry="12" transform="rotate(50 172 98)" />
        <ellipse cx="172" cy="118" rx="7" ry="12" transform="rotate(60 172 118)" />
        <ellipse cx="168" cy="138" rx="7" ry="12" transform="rotate(70 168 138)" />
        <ellipse cx="160" cy="155" rx="6.5" ry="11" transform="rotate(80 160 155)" />
      </g>

      {/* Central 5-Pointed Gold Star (Ngôi sao vàng 5 cánh) */}
      <polygon
        points="100,42 112,78 150,78 119,101 131,137 100,114 69,137 81,101 50,78 88,78"
        fill="url(#emblemGoldGrad)"
        stroke="#ca8a04"
        strokeWidth="1.5"
        filter="url(#goldGlow)"
      />

      {/* Bottom Industrial Cogwheel (Bánh xe răng công nghiệp) */}
      <g filter="url(#goldGlow)" fill="url(#emblemGoldGrad)" stroke="#854d0e" strokeWidth="0.8">
        <path d="M 78,162 C 84,158 92,156 100,156 C 108,156 116,158 122,162 L 128,154 L 134,158 L 130,166 C 134,170 137,175 139,180 L 148,178 L 150,186 L 142,190 C 142,192 142,194 141,196 L 59,196 C 58,194 58,192 58,190 L 50,186 L 52,178 L 61,180 C 63,175 66,170 70,166 L 66,158 L 72,154 Z" />
        <circle cx="100" cy="176" r="8" fill="#991b1b" stroke="url(#emblemGoldGrad)" strokeWidth="1.5" />
      </g>

      {/* Red & Gold Ribbon / Banner (Dải ruy băng đỏ viền vàng phía dưới) */}
      <g filter="url(#goldGlow)">
        {/* Ribbon base */}
        <path
          d="M 38,168 C 65,182 135,182 162,168 L 168,184 C 138,200 62,200 32,184 Z"
          fill="#b91c1c"
          stroke="url(#outerRingGold)"
          strokeWidth="1.5"
        />
        {/* Ribbon center plate */}
        <path
          d="M 52,174 C 75,185 125,185 148,174 L 146,188 C 125,198 75,198 54,188 Z"
          fill="#dc2626"
          stroke="#fde047"
          strokeWidth="1"
        />
      </g>
    </svg>
  );
};
