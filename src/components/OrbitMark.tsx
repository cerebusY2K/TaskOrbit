export function OrbitMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <defs>
        <radialGradient id="orbit-mark-core">
          <stop offset="0%" stopColor="#e3edff" />
          <stop offset="60%" stopColor="#6da2ff" />
          <stop offset="100%" stopColor="#6da2ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="24" cy="24" rx="20" ry="8" fill="none" stroke="#6da2ff" strokeOpacity="0.55" transform="rotate(-20 24 24)" />
      <ellipse cx="24" cy="24" rx="13" ry="5" fill="none" stroke="#a970ff" strokeOpacity="0.55" transform="rotate(25 24 24)" />
      <circle cx="24" cy="24" r="6" fill="url(#orbit-mark-core)" />
      <circle cx="42.6" cy="17.4" r="2.6" fill="#ff9f43" />
      <circle cx="13" cy="30.5" r="2" fill="#22b07d" />
    </svg>
  );
}
