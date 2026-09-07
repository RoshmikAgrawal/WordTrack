import React from "react";

interface WordTrackLogoProps {
  className?: string;
  size?: number | string;
  withBackground?: boolean;
}

export const WordTrackLogo: React.FC<WordTrackLogoProps> = ({
  className = "",
  size = 36,
  withBackground = false,
}) => {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        <radialGradient id="wtBgGlow" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>

        <linearGradient id="wtTileRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>

        <linearGradient id="wtTileDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        <linearGradient id="wtTileGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <linearGradient id="wtTileYellow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        <filter id="wtTileShadow" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Optional Dark Bento Backplate */}
      {withBackground && (
        <>
          <rect width="512" height="512" rx="112" fill="url(#wtBgGlow)" />
          <rect width="510" height="510" x="1" y="1" rx="111" stroke="#1e293b" strokeWidth="2" />
        </>
      )}

      {/* Checkmark Tile Sequence */}
      <g filter="url(#wtTileShadow)">
        {/* W - Red Tile */}
        <g transform="translate(42, 228)">
          <rect width="56" height="56" rx="14" fill="url(#wtTileRed)" stroke="#fca5a5" strokeWidth="1.5" strokeOpacity="0.4" />
          <text x="28" y="38" fontFamily="'JetBrains Mono', monospace" fontSize="28" fontWeight="900" fill="#ffffff" textAnchor="middle">W</text>
        </g>

        {/* O - Black Tile */}
        <g transform="translate(106, 292)">
          <rect width="56" height="56" rx="14" fill="url(#wtTileDark)" stroke="#475569" strokeWidth="2" />
          <text x="28" y="38" fontFamily="'JetBrains Mono', monospace" fontSize="28" fontWeight="900" fill="#94a3b8" textAnchor="middle">O</text>
        </g>

        {/* R - Green Turnaround Vertex */}
        <g transform="translate(170, 356)">
          <rect width="56" height="56" rx="14" fill="url(#wtTileGreen)" stroke="#6ee7b7" strokeWidth="1.5" strokeOpacity="0.4" />
          <text x="28" y="38" fontFamily="'JetBrains Mono', monospace" fontSize="28" fontWeight="900" fill="#ffffff" textAnchor="middle">R</text>
        </g>

        {/* D - Yellow Tile */}
        <g transform="translate(234, 292)">
          <rect width="56" height="56" rx="14" fill="url(#wtTileYellow)" stroke="#fde68a" strokeWidth="1.5" strokeOpacity="0.4" />
          <text x="28" y="38" fontFamily="'JetBrains Mono', monospace" fontSize="28" fontWeight="900" fill="#ffffff" textAnchor="middle">D</text>
        </g>

        {/* T - Black Tile */}
        <g transform="translate(298, 228)">
          <rect width="56" height="56" rx="14" fill="url(#wtTileDark)" stroke="#475569" strokeWidth="2" />
          <text x="28" y="38" fontFamily="'JetBrains Mono', monospace" fontSize="28" fontWeight="900" fill="#94a3b8" textAnchor="middle">T</text>
        </g>

        {/* R - Yellow Tile */}
        <g transform="translate(362, 164)">
          <rect width="56" height="56" rx="14" fill="url(#wtTileYellow)" stroke="#fde68a" strokeWidth="1.5" strokeOpacity="0.4" />
          <text x="28" y="38" fontFamily="'JetBrains Mono', monospace" fontSize="28" fontWeight="900" fill="#ffffff" textAnchor="middle">R</text>
        </g>

        {/* K - Green Victory Peak Tile */}
        <g transform="translate(426, 100)">
          <rect width="56" height="56" rx="14" fill="url(#wtTileGreen)" stroke="#6ee7b7" strokeWidth="1.5" strokeOpacity="0.4" />
          <text x="28" y="38" fontFamily="'JetBrains Mono', monospace" fontSize="28" fontWeight="900" fill="#ffffff" textAnchor="middle">K</text>
        </g>
      </g>
    </svg>
  );
};
