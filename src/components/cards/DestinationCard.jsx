import { Link } from 'react-router-dom';
import './DestinationCard.css';

export default function DestinationCard({ color = 'cyan', status, title, purpose, cta, path, index = 0 }) {
  return (
    <Link
      className={`dest-card ${color}`}
      to={path}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="dest-top">
        <span className="dest-status">{status}</span>
        <div className="dest-title">{title}</div>
        <p className="dest-purpose">{purpose}</p>
      </div>
      <div className="dest-bottom">
        <span className="dest-cta">{cta} →</span>
      </div>
    </Link>
  );
}
