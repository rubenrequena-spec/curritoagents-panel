export function LogoIcon({
  className,
  ringColor = "#15171E",
}: {
  className?: string;
  ringColor?: string;
}) {
  return (
    <svg viewBox="0 0 62 62" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="46" height="46" rx="13" fill="#1E4DF0" />
      <g transform="translate(19,19)">
        <rect x="3" y="10" width="2.6" height="4" rx="1.3" fill="#FFFFFF" />
        <rect x="7.4" y="7" width="2.6" height="10" rx="1.3" fill="#FFFFFF" />
        <rect x="11.7" y="4.5" width="2.6" height="15" rx="1.3" fill="#FFFFFF" />
        <rect x="16.1" y="8.5" width="2.6" height="7" rx="1.3" fill="#FFFFFF" />
      </g>
      <circle cx="51" cy="11" r="7" fill="#FF7A1A" stroke={ringColor} strokeWidth="2.5" />
    </svg>
  );
}

export function LogoLockup({
  className,
  theme = "dark",
}: {
  className?: string;
  theme?: "dark" | "light";
}) {
  const onDark = theme === "dark";
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoIcon className="h-8 w-8 shrink-0" ringColor={onDark ? "#15171E" : "#FFFFFF"} />
      <span
        className={`font-display font-bold text-lg leading-none tracking-tight ${
          onDark ? "text-white" : "text-brand-ink"
        }`}
      >
        Currito
        <span className={onDark ? "font-medium text-slate-400" : "font-medium text-slate-500"}>
          Agents
        </span>
      </span>
    </div>
  );
}
