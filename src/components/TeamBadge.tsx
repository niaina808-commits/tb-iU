import React from 'react';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface TeamBadgeProps {
  teamName: string;
  size?: BadgeSize;
  className?: string;
}

interface LeagueBadgeProps {
  size?: BadgeSize;
  className?: string;
}

const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-9 h-9',
  xl: 'w-12 h-12'
};

function normalizeTeamKey(name: string): string {
  const n = (name || '').toLowerCase().trim();
  if (n.includes('liverpool') || n === 'liv') return 'liverpool';
  if (n.includes('palace') || n === 'cry') return 'cpalace';
  if (n.includes('fulham') || n === 'ful') return 'fulham';
  if (n.includes('burnley') || n === 'bur') return 'burnley';
  if (n.includes('west ham') || n === 'whu') return 'westham';
  if (n.includes('manchester blue') || n.includes('man blue') || n.includes('man city') || n === 'mnc' || n === 'mci') return 'manblue';
  if (n.includes('brentford') || n === 'bre') return 'brentford';
  if (n.includes('sunderland') || n === 'sun') return 'sunderland';
  if (n.includes('everton') || n === 'eve') return 'everton';
  if (n.includes('london blues') || n.includes('london blue') || n.includes('chelsea') || n === 'che') return 'londonblues';
  if (n.includes('spurs') || n.includes('tottenham') || n.includes('london white') || n === 'tot') return 'spurs';
  if (n.includes('forest') || n === 'nfo') return 'nforest';
  if (n.includes('bournemouth') || n === 'bou') return 'bournemouth';
  if (n.includes('villa') || n.includes('birmingham') || n === 'avl' || n === 'ast') return 'avilla';
  if (n.includes('newcastle') || n === 'new') return 'newcastle';
  if (n.includes('london reds') || n.includes('london red') || n.includes('arsenal') || n === 'ars') return 'londonreds';
  if (n.includes('brighton') || n === 'bha') return 'brighton';
  if (n.includes('leeds') || n === 'lee') return 'leeds';
  if (n.includes('wolverhampton') || n.includes('wolves') || n === 'wol') return 'wolverhampton';
  if (n.includes('manchester red') || n.includes('man red') || n.includes('man utd') || n === 'mun') return 'manred';
  return 'default';
}

/**
 * Official Bet261 Instant League 8035 Team Badges matching the exact visual crests
 */
export const TeamBadge: React.FC<TeamBadgeProps> = ({
  teamName,
  size = 'md',
  className = ''
}) => {
  const key = normalizeTeamKey(teamName);
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${sizeClass} ${className}`}
      title={teamName}
    >
      {key === 'liverpool' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          {/* Teal base accents */}
          <polygon points="5,26 11,29 7,29" fill="#008c7a" />
          <polygon points="27,26 21,29 25,29" fill="#008c7a" />
          {/* Main shield */}
          <path
            d="M5 5 Q16 2 27 5 L25 18 Q24 26 16 29 Q8 26 7 18 Z"
            fill="#ffffff"
            stroke="#c8102e"
            strokeWidth="2"
          />
          {/* Red top crown section */}
          <path d="M5 5 Q16 2 27 5 L26 11 Q16 13 6 11 Z" fill="#c8102e" />
        </svg>
      )}

      {key === 'cpalace' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          {/* Silver bottom base */}
          <path d="M5 21 L16 30 L27 21 L27 28 L5 28 Z" fill="#cbd5e1" opacity="0.65" />
          {/* Royal blue shield */}
          <path
            d="M6 4 L26 4 L26 17 Q26 25 16 29 Q6 25 6 17 Z"
            fill="#1b458f"
            stroke="#e2e8f0"
            strokeWidth="2.2"
          />
          <path
            d="M8.5 6.5 L23.5 6.5 L23.5 16.5 Q23.5 22.5 16 26 Q8.5 22.5 8.5 16.5 Z"
            fill="none"
            stroke="#93c5fd"
            strokeWidth="0.8"
          />
        </svg>
      )}

      {key === 'fulham' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <defs>
            <clipPath id="fulham-clip">
              <path d="M6 4 L26 4 L26 17 Q26 25 16 29 Q6 25 6 17 Z" />
            </clipPath>
          </defs>
          <g clipPath="url(#fulham-clip)">
            <rect x="4" y="2" width="24" height="28" fill="#ffffff" />
            <rect x="4" y="2" width="6.5" height="28" fill="#111827" />
            <rect x="21.5" y="2" width="6.5" height="28" fill="#111827" />
            <rect x="13" y="14" width="6" height="3.2" rx="0.8" fill="#dc2626" />
          </g>
          <path
            d="M6 4 L26 4 L26 17 Q26 25 16 29 Q6 25 6 17 Z"
            fill="none"
            stroke="#1f2937"
            strokeWidth="1.8"
          />
        </svg>
      )}

      {key === 'burnley' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <path
            d="M6 4 L26 4 L26 17 Q26 25 16 29 Q6 25 6 17 Z"
            fill="#6c1d45"
            stroke="#f8fafc"
            strokeWidth="1.8"
          />
          <path
            d="M9 7 L23 7 L23 16.5 Q23 22.5 16 25.5 Q9 22.5 9 16.5 Z"
            fill="none"
            stroke="#f8fafc"
            strokeWidth="1.2"
          />
          <rect x="11" y="9" width="4" height="2.5" fill="#f8fafc" />
          <rect x="17" y="9" width="4" height="2.5" fill="#f8fafc" />
          <path d="M10 14 L16 19 L22 14" fill="none" stroke="#f8fafc" strokeWidth="1.5" />
        </svg>
      )}

      {key === 'westham' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <path
            d="M6 4 L26 4 L26 17 Q26 25 16 29 Q6 25 6 17 Z"
            fill="#7a263a"
            stroke="#38bdf8"
            strokeWidth="2"
          />
          {/* Crossed gold hammers */}
          <line x1="10" y1="22" x2="22" y2="10" stroke="#f59e0b" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="22" y1="22" x2="10" y2="10" stroke="#f59e0b" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="19" y="8" width="5" height="2.6" rx="0.6" transform="rotate(45 21.5 9.3)" fill="#f59e0b" />
          <rect x="8" y="8" width="5" height="2.6" rx="0.6" transform="rotate(-45 10.5 9.3)" fill="#f59e0b" />
        </svg>
      )}

      {key === 'manblue' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <circle cx="16" cy="16" r="13" fill="#ffffff" stroke="#1e3a8a" strokeWidth="1.6" />
          <circle cx="16" cy="16" r="10.2" fill="#ffffff" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="16" cy="16" r="6.8" fill="#ffffff" stroke="#1e3a8a" strokeWidth="1.2" />
          <rect x="10" y="13.2" width="12" height="3.2" fill="#eab308" opacity="0.85" />
          <line x1="9.5" y1="13" x2="22.5" y2="13" stroke="#1e3a8a" strokeWidth="1.2" />
        </svg>
      )}

      {key === 'brentford' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <circle cx="16" cy="16" r="13" fill="#dc2626" />
          <circle cx="16" cy="16" r="8.8" fill="#ffffff" />
          <ellipse cx="16" cy="16" rx="3.4" ry="5.8" fill="#f59e0b" stroke="#991b1b" strokeWidth="1.4" />
        </svg>
      )}

      {key === 'sunderland' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <defs>
            <clipPath id="sun-clip">
              <path d="M7 4 L25 4 L25 16 Q25 22 16 25 Q7 22 7 16 Z" />
            </clipPath>
          </defs>
          <g clipPath="url(#sun-clip)">
            <rect x="6" y="3" width="20" height="23" fill="#ffffff" />
            <rect x="7" y="3" width="3.6" height="23" fill="#dc2626" />
            <rect x="14.2" y="3" width="3.6" height="23" fill="#dc2626" />
            <rect x="21.4" y="3" width="3.6" height="23" fill="#dc2626" />
            <rect x="7" y="4" width="9" height="8" fill="#d97706" />
          </g>
          <path
            d="M7 4 L25 4 L25 16 Q25 22 16 25 Q7 22 7 16 Z"
            fill="none"
            stroke="#991b1b"
            strokeWidth="1.5"
          />
          {/* Bottom scroll ribbon */}
          <path d="M5 26 Q16 23 27 26 L26 29 Q16 26.5 6 29 Z" fill="#dc2626" />
        </svg>
      )}

      {key === 'everton' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <path
            d="M6 5 L16 3 L26 5 L25 18 Q24 25 16 29 Q8 25 7 18 Z"
            fill="#003399"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          {/* Tower silhouette */}
          <polygon points="16,7 13.5,13 18.5,13" fill="#ffffff" />
          <rect x="14" y="13" width="4" height="7" fill="#ffffff" />
          <line x1="9" y1="21.5" x2="23" y2="21.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}

      {key === 'londonblues' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <circle cx="16" cy="16" r="13" fill="#034694" stroke="#eab308" strokeWidth="1.2" />
          <circle cx="16" cy="16" r="8.2" fill="#ffffff" />
          <rect x="13.2" y="7.5" width="5.6" height="17" rx="2.5" fill="#034694" />
          <circle cx="5.5" cy="16" r="1.3" fill="#eab308" />
          <circle cx="26.5" cy="16" r="1.3" fill="#eab308" />
        </svg>
      )}

      {key === 'spurs' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <ellipse cx="16" cy="16" rx="8.5" ry="13.5" fill="#132257" stroke="#e2e8f0" strokeWidth="1.2" />
          {/* Cockerel & ball stylized */}
          <circle cx="16" cy="23" r="2.6" fill="none" stroke="#ffffff" strokeWidth="1.4" />
          <path
            d="M14 20 C13 15 14 10 17 7 C18 9 18.5 12 17.5 15 C19 14 20 15 19 17 C17.5 18.5 16.5 20 16 20.5 Z"
            fill="#ffffff"
          />
        </svg>
      )}

      {key === 'nforest' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <rect x="8.5" y="3" width="15" height="26" rx="4" fill="#dd0000" />
          {/* Two stars/dots at top */}
          <circle cx="13" cy="6.5" r="1.1" fill="#ffffff" />
          <circle cx="19" cy="6.5" r="1.1" fill="#ffffff" />
          {/* Stylized tree */}
          <circle cx="16" cy="14" r="4.5" fill="#ffffff" />
          <rect x="14.5" y="17" width="3" height="8.5" rx="1" fill="#ffffff" />
        </svg>
      )}

      {key === 'bournemouth' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <defs>
            <clipPath id="bou-clip">
              <path d="M6 4 L26 4 L26 17 Q26 25 16 29 Q6 25 6 17 Z" />
            </clipPath>
          </defs>
          <g clipPath="url(#bou-clip)">
            <rect x="5" y="3" width="22" height="27" fill="#d71920" />
            <rect x="19" y="3" width="2.5" height="27" fill="#111827" />
            <rect x="23" y="3" width="2.5" height="27" fill="#111827" />
          </g>
          <path
            d="M6 4 L26 4 L26 17 Q26 25 16 29 Q6 25 6 17 Z"
            fill="none"
            stroke="#111827"
            strokeWidth="2"
          />
        </svg>
      )}

      {key === 'avilla' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <circle cx="16" cy="16" r="13" fill="#670e36" />
          <circle cx="16" cy="16" r="8.8" fill="#95bfe5" />
          <ellipse cx="16" cy="16" rx="3.8" ry="6.8" fill="#670e36" />
        </svg>
      )}

      {key === 'newcastle' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <defs>
            <clipPath id="new-clip">
              <path d="M6 4 L26 4 L26 17 Q26 25 16 29 Q6 25 6 17 Z" />
            </clipPath>
          </defs>
          <g clipPath="url(#new-clip)">
            <rect x="5" y="3" width="22" height="27" fill="#111827" />
            <rect x="10.5" y="3" width="3.8" height="27" fill="#ffffff" />
            <rect x="17.7" y="3" width="3.8" height="27" fill="#ffffff" />
          </g>
          <path
            d="M6 4 L26 4 L26 17 Q26 25 16 29 Q6 25 6 17 Z"
            fill="none"
            stroke="#eab308"
            strokeWidth="1.6"
          />
        </svg>
      )}

      {key === 'londonreds' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <path
            d="M6 4 L26 4 L26 17 Q26 25 16 29 Q6 25 6 17 Z"
            fill="#ef0107"
            stroke="#d4af37"
            strokeWidth="2"
          />
          <rect x="8.5" y="13.5" width="15" height="3.2" rx="1" fill="#fef08a" />
        </svg>
      )}

      {key === 'brighton' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <circle cx="16" cy="16" r="13" fill="#ffffff" stroke="#0057b8" strokeWidth="1.6" />
          <circle cx="16" cy="16" r="8.2" fill="#0057b8" />
          <rect x="7.8" y="14.2" width="16.4" height="3.6" fill="#ffffff" />
        </svg>
      )}

      {key === 'leeds' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <defs>
            <clipPath id="leeds-clip">
              <path d="M6 4 L26 4 L26 17 Q26 25 16 29 Q6 25 6 17 Z" />
            </clipPath>
          </defs>
          <g clipPath="url(#leeds-clip)">
            <rect x="5" y="3" width="22" height="27" fill="#fef08a" />
            <rect x="11" y="9" width="3.5" height="20" fill="#ffffff" stroke="#1d428a" strokeWidth="0.8" />
            <rect x="17.5" y="9" width="3.5" height="20" fill="#ffffff" stroke="#1d428a" strokeWidth="0.8" />
            <rect x="5" y="3" width="22" height="6.5" fill="#1d428a" />
            <line x1="7" y1="15" x2="25" y2="23" stroke="#1d428a" strokeWidth="1.6" />
          </g>
          <path
            d="M6 4 L26 4 L26 17 Q26 25 16 29 Q6 25 6 17 Z"
            fill="none"
            stroke="#1d428a"
            strokeWidth="1.8"
          />
        </svg>
      )}

      {key === 'wolverhampton' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          {/* Gold Hexagon */}
          <polygon
            points="10,4 22,4 28,16 22,28 10,28 4,16"
            fill="#fdb913"
            stroke="#111827"
            strokeWidth="1.8"
          />
          {/* Black wolf-head triangle */}
          <polygon points="10.5,8 21.5,8 16,24" fill="#111827" />
        </svg>
      )}

      {key === 'manred' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <circle cx="16" cy="16" r="13" fill="#facc15" stroke="#dc2626" strokeWidth="2.4" />
          <path d="M9.5 10.5 L22.5 10.5 L22.5 18.5 L9.5 18.5 Z" fill="#dc2626" />
          <circle cx="16" cy="22.5" r="1.8" fill="#dc2626" />
        </svg>
      )}

      {key === 'default' && (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm">
          <path
            d="M6 4 L26 4 L26 17 Q26 25 16 29 Q6 25 6 17 Z"
            fill="#1e293b"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          <text
            x="16"
            y="19"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            {(teamName || 'FC').slice(0, 3).toUpperCase()}
          </text>
        </svg>
      )}
    </span>
  );
};

/**
 * Official Instant League 8035 Crest / League Badge
 */
export const LeagueBadge: React.FC<LeagueBadgeProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${sizeClass} ${className}`}
      title="Bet261 Instant League 8035 - Premier Virtual League"
    >
      <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id="il8035-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38003c" />
            <stop offset="55%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#00ff85" />
          </linearGradient>
        </defs>
        {/* Outer Shield */}
        <path
          d="M5 6 Q20 2 35 6 L33 23 Q32 33 20 38 Q8 33 7 23 Z"
          fill="url(#il8035-grad)"
          stroke="#00ff85"
          strokeWidth="2"
        />
        {/* Golden Crown at top */}
        <polygon
          points="12,12 14,7 17,10 20,6 23,10 26,7 28,12"
          fill="#facc15"
        />
        {/* 8035 League Emblem Text */}
        <rect x="9" y="15" width="22" height="9" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
        <text
          x="20"
          y="21.8"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="7.5"
          fontWeight="900"
          fontFamily="monospace"
        >
          8035
        </text>
        {/* Bottom Star */}
        <circle cx="20" cy="30" r="2.5" fill="#00ff85" />
      </svg>
    </span>
  );
};
