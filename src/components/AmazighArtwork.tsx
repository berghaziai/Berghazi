import React from 'react';

export const YazEmblem: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
    <rect x="6" y="6" width="52" height="52" rx="8" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
    <path
      d="M32 12V52M18 18C22 24 26 27 32 27C38 27 42 24 46 18M18 46C22 40 26 37 32 37C38 37 42 40 46 46"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const AmazighGeometricFrieze: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-full overflow-hidden select-none ${className}`} aria-hidden="true">
    <svg viewBox="0 0 1200 32" preserveAspectRatio="none" className="w-full h-5 text-[#C68B1C]/40">
      <defs>
        <pattern id="amazigh-frieze" width="60" height="32" patternUnits="userSpaceOnUse">
          <path d="M0 16 L15 4 L30 16 L15 28 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M30 16 L45 4 L60 16 L45 28 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="15" cy="16" r="2" fill="currentColor" />
          <circle cx="45" cy="16" r="2" fill="currentColor" />
          <line x1="0" y1="2" x2="60" y2="2" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
          <line x1="0" y1="30" x2="60" y2="30" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="1200" height="32" fill="url(#amazigh-frieze)" />
    </svg>
  </div>
);

export const AtlasHeroIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`relative overflow-hidden rounded-xl border border-[#1D3A5F]/20 bg-gradient-to-br from-[#16222E] via-[#1D3A5F] to-[#23394D] ${className}`}
  >
    <svg
      viewBox="0 0 900 540"
      className="w-full h-full object-cover block"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="High Atlas Mountains and Amazigh Kasbah architectural illustration"
    >
      <defs>
        <linearGradient id="atlas-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#121D29" />
          <stop offset="55%" stopColor="#1D3A5F" />
          <stop offset="100%" stopColor="#C68B1C" stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id="sun-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E5AD44" />
          <stop offset="100%" stopColor="#C68B1C" stopOpacity="0.2" />
        </linearGradient>
        <pattern id="kasbah-motif" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M16 2 L30 16 L16 30 L2 16 Z" fill="none" stroke="#E5AD44" strokeWidth="0.7" opacity="0.22" />
        </pattern>
      </defs>

      <rect width="900" height="540" fill="url(#atlas-sky)" />
      <rect width="900" height="240" fill="url(#kasbah-motif)" opacity="0.35" />

      {/* Warm Atlas Sun */}
      <circle cx="670" cy="175" r="76" fill="url(#sun-glow)" opacity="0.85" />
      <circle cx="670" cy="175" r="96" fill="none" stroke="#E5AD44" strokeWidth="1" strokeDasharray="4 6" opacity="0.45" />

      {/* Distant High Atlas Ridges */}
      <path
        d="M0 320 L120 225 L235 280 L365 185 L495 270 L615 198 L750 260 L900 185 L900 540 L0 540 Z"
        fill="#1A314A"
      />
      {/* Mid Mountain Range with Sunlit Faces */}
      <path
        d="M0 375 L160 280 L290 345 L430 245 L580 330 L740 250 L900 335 L900 540 L0 540 Z"
        fill="#142638"
      />
      <path d="M430 245 L580 330 L495 340 Z" fill="#C68B1C" opacity="0.18" />
      <path d="M740 250 L900 335 L790 345 Z" fill="#C68B1C" opacity="0.16" />

      {/* Traditional Amazigh Kasbah Silhouette on Ridge */}
      <g transform="translate(145, 290)" fill="#0F1C28" stroke="#C68B1C" strokeOpacity="0.45" strokeWidth="1.2">
        <rect x="0" y="38" width="160" height="68" />
        <rect x="18" y="10" width="36" height="96" />
        <rect x="106" y="16" width="38" height="90" />
        <rect x="64" y="24" width="32" height="82" />
        {/* Crenellations */}
        <path d="M18 10 L24 2 L30 10 L36 2 L42 10 L48 2 L54 10" fill="none" />
        <path d="M106 16 L112 8 L118 16 L124 8 L130 16 L136 8 L144 16" fill="none" />
        {/* Warm lit windows */}
        <rect x="31" y="28" width="10" height="14" rx="5" fill="#E5AD44" fillOpacity="0.7" stroke="none" />
        <rect x="75" y="42" width="10" height="14" rx="5" fill="#E5AD44" fillOpacity="0.65" stroke="none" />
        <rect x="120" y="32" width="10" height="14" rx="5" fill="#E5AD44" fillOpacity="0.7" stroke="none" />
      </g>

      {/* Foreground Terraced Valley */}
      <path d="M0 430 Q260 390 520 440 T900 415 L900 540 L0 540 Z" fill="#0F1B26" />
      <path d="M0 475 Q320 445 640 485 T900 470 L900 540 L0 540 Z" fill="#0A131C" />

      {/* Subtle Yaz Emblem Overlay */}
      <g transform="translate(636, 141)" stroke="#16222E" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.75">
        <path d="M34 10 V58 M16 18 C21 26 26 29 34 29 C42 29 47 26 52 18 M16 50 C21 42 26 39 34 39 C42 39 47 42 52 50" />
      </g>
    </svg>
    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/80 font-mono-num">
      <span>ⴰⴷⵔⴰⵔ ⵏ ⴷⵔⵏ · High Atlas</span>
      <span>31.06° N · 7.91° W</span>
    </div>
  </div>
);

export const HeritageTapestryIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 600 360"
    className={`w-full h-full rounded-lg border border-[#E5E4DF] bg-[#16222E] ${className}`}
    role="img"
    aria-label="Traditional Moroccan Amazigh geometric textile and Tifinagh heritage pattern"
  >
    <defs>
      <pattern id="carpet-weave" width="120" height="120" patternUnits="userSpaceOnUse">
        <rect width="120" height="120" fill="#16222E" />
        <polygon points="60,8 112,60 60,112 8,60" fill="none" stroke="#C68B1C" strokeWidth="2.5" />
        <polygon points="60,24 96,60 60,96 24,60" fill="#1D3A5F" stroke="#F4EFE6" strokeWidth="1.5" />
        <polygon points="60,42 78,60 60,78 42,60" fill="#C68B1C" />
        <path d="M0 0 L24 24 M120 0 L96 24 M0 120 L24 96 M120 120 L96 96" stroke="#1B6B50" strokeWidth="2" />
      </pattern>
    </defs>
    <rect width="600" height="360" fill="url(#carpet-weave)" />
    <rect x="20" y="20" width="560" height="320" fill="none" stroke="#F4EFE6" strokeOpacity="0.35" strokeWidth="2" />
    <circle cx="300" cy="180" r="64" fill="#16222E" stroke="#C68B1C" strokeWidth="3" />
    <text
      x="300"
      y="200"
      textAnchor="middle"
      fill="#F4EFE6"
      fontSize="58"
      className="font-tifinagh"
    >
      ⵣ
    </text>
  </svg>
);
