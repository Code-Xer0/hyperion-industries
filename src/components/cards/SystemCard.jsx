import { Link } from 'react-router-dom';
import './SystemCard.css';
import { useTheme } from '../../context/ThemeContext';
import { mediaSource } from '../../utils/media';

export default function SystemCard({ system }) {
  const { code, name, tagline, description, status, statusLabel, link, linkLabel, icon, color } = system;
  const { brandMark } = useTheme();

  const badgeClass = status === 'live' ? 'b-live' : status === 'building' ? 'b-building' : 'b-concept';
  const isExternal = link && link.startsWith('http');
  const iconSrc = mediaSource(icon)?.includes('/assets/branding/hyperion/') ? brandMark : mediaSource(icon);

  return (
    <div className={`sys-row ${color}`}>
      <div className="sys-left">
        <span className="sys-num">{code}</span>
        <span className="sys-name">
          {iconSrc && <img src={iconSrc} alt="" className="sys-icon" />}
          {name}
        </span>
        <span className="sys-tagline">{tagline}</span>
      </div>
      <div className="sys-desc">{description}</div>
      <div className="sys-right">
        <span className={`badge ${badgeClass}`}>
          {status === 'live' && <span className="badge-dot" />}
          {statusLabel}
        </span>
        {link && linkLabel && (
          isExternal
            ? <a href={link} className="sys-link" target="_blank" rel="noopener noreferrer">{linkLabel}</a>
            : <Link to={link} className="sys-link">{linkLabel}</Link>
        )}
        {!link && linkLabel && <span className="sys-link disabled">{linkLabel}</span>}
      </div>
    </div>
  );
}
