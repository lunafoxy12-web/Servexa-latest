import React from 'react';

interface ServexaLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textColor?: string;
}

export const ServexaLogo: React.FC<ServexaLogoProps> = ({
  className = '',
  size = 36,
  showText = false,
  textColor = 'text-slate-900'
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform hover:scale-105 duration-200"
      >
        <defs>
          {/* Main Top to Center Gradient */}
          <linearGradient id="servexaTopGrad" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="40%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>

          {/* Lower Swoosh to Deep Violet Gradient */}
          <linearGradient id="servexaBottomGrad" x1="0%" y1="20%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="60%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>

          {/* Dark Contrast Crest Wing */}
          <linearGradient id="servexaWingGrad" x1="10%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#311042" />
          </linearGradient>

          {/* Top Node Radial Dot */}
          <radialGradient id="servexaTopDot" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </radialGradient>

          {/* Bottom Node Radial Dot */}
          <radialGradient id="servexaBottomDot" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>

        {/* Top Floating Node Dot */}
        <circle cx="82" cy="18" r="14" fill="url(#servexaTopDot)" />

        {/* Dark crescent wing layer (Right shoulder) */}
        <path
          d="M62 38 C78 39, 102 46, 108 66 C110 74, 105 84, 96 90 C84 98, 70 88, 62 76 C58 70, 56 50, 62 38 Z"
          fill="url(#servexaWingGrad)"
        />

        {/* Upper S-Curve Sweeping Body */}
        <path
          d="M82 18 C58 18, 22 28, 18 52 C14 74, 46 72, 60 84 C76 98, 64 114, 38 116 C48 116, 76 112, 88 92 C98 76, 76 68, 56 60 C38 52, 42 38, 58 34 C72 30, 84 34, 88 36 C86 28, 86 22, 82 18 Z"
          fill="url(#servexaTopGrad)"
        />

        {/* Lower Main S-Curve Body & Violet Tail */}
        <path
          d="M58 48 C42 54, 18 64, 22 84 C26 102, 54 116, 82 108 C94 104, 104 94, 98 84 C92 74, 76 68, 62 60 C50 54, 52 50, 58 48 Z"
          fill="url(#servexaBottomGrad)"
        />

        {/* Bottom Floating Node Dot */}
        <circle cx="28" cy="94" r="13" fill="url(#servexaBottomDot)" />
      </svg>

      {showText && (
        <div className="flex flex-col text-left min-w-0">
          <span className={`font-light text-lg tracking-wide leading-none ${textColor} truncate`}>
            Servexa
          </span>
          <span className="hidden sm:block text-[10px] font-light text-slate-400 tracking-wider truncate">
            Services & Marketplace
          </span>
        </div>
      )}
    </div>
  );
};
