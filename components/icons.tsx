type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconUsers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" />
      <path d="M16 4.5c1.5.4 2.5 1.77 2.5 3.3S17.5 10.6 16 11" />
      <path d="M21 20c0-2.9-1.85-5.35-4.5-5.9" />
    </svg>
  );
}

export function IconMegaphone({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 11v2a2 2 0 002 2h1l5 4V5l-5 4H5a2 2 0 00-2 2z" />
      <path d="M14.5 8.5c1.2 1 1.2 6 0 7" />
      <path d="M18 6c2 1.8 2 10.2 0 12" />
    </svg>
  );
}

export function IconSpark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5L15 9M9 15l-2.5 2.5" />
    </svg>
  );
}

export function IconClock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.3l2.4 2.4 4.6-5.4" />
    </svg>
  );
}

export function IconBell({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M18 16v-5a6 6 0 00-12 0v5l-2 3h16l-2-3z" />
      <path d="M9.5 19a2.5 2.5 0 005 0" />
    </svg>
  );
}

export function IconBriefcase({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="8" width="18" height="11" rx="2" />
      <path d="M9 8V6a3 3 0 013-3h0a3 3 0 013 3v2" />
      <path d="M3 13h18" />
    </svg>
  );
}

export function IconKanban({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3.5" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="10" rx="1.5" />
      <rect x="15.5" y="4" width="5" height="13" rx="1.5" />
    </svg>
  );
}

export function IconLogout({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3" />
      <path d="M15 16l4-4-4-4" />
      <path d="M19 12H9" />
    </svg>
  );
}

export function IconArrowLeft({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  );
}

export function IconDashboard({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.5" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="1.5" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.5" />
    </svg>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 7h16" />
      <path d="M9 7V4.5a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0115 4.5V7" />
      <path d="M6 7l1 12.5A2 2 0 009 21.5h6a2 2 0 002-2L18 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IconUserMinus({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" />
      <path d="M16.5 9.5h5" />
    </svg>
  );
}

export function IconUserCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" />
      <path d="M15.5 10.3l1.6 1.6 3-3.3" />
    </svg>
  );
}

export function IconX({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
}
