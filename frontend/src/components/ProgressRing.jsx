export default function ProgressRing({ value, size = 110, stroke = 12 }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = pct >= 75 ? 'var(--ring-good)' : pct >= 60 ? 'var(--ring-mid)' : 'var(--ring-bad)';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
              strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
              transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
            fill="#fff" fontSize={size * 0.22} fontWeight="600">
        {value == null ? '-' : `${Math.round(pct)}%`}
      </text>
    </svg>
  );
}