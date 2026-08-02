export function ProgressRing({ value }: { value: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="progress-ring" aria-label={`${value}% of weekly goals complete`}>
      <svg viewBox="0 0 124 124" role="img">
        <circle className="ring-track" cx="62" cy="62" r={radius} />
        <circle className="ring-value" cx="62" cy="62" r={radius} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="ring-label">
        <strong>{value}%</strong>
        <span>complete</span>
      </div>
    </div>
  );
}
