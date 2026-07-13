import './StatusChip.css';

export default function StatusChip({ label, tone = 'map', compact = false }) {
  return (
    <span className={`city-status city-status-${tone}${compact ? ' is-compact' : ''}`}>
      <span className="city-status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

