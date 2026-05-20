import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import navData from '../../data/navigation.json';
import './Nav.css';

export default function Nav() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <nav className={`hi-nav${scrolled ? ' scrolled' : ''}`} aria-label="Primary">
      <Link to="/" className="nav-logo">
        <img src="/assets/branding/hyperion/Hyblklogoonly.png" alt="" className="nav-mark" />
        <div className="nav-wordmark">Hyperion<span>Industries</span></div>
      </Link>

      <button className={`nav-burger${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
        <span /><span /><span />
      </button>

      <ul className={`nav-links${mobileOpen ? ' open' : ''}`}>
        {navData.main.map(link => (
          <li key={link.path}>
            <Link to={link.path} className={location.pathname === link.path ? 'active' : ''}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className={`nav-cta${mobileOpen ? ' open' : ''}`}>
        {navData.cta.map((btn, i) => (
          btn.external
            ? <a key={i} href={btn.href} className={`btn btn-${btn.variant}`} target="_blank" rel="noopener noreferrer">{btn.label}</a>
            : <Link key={i} to={btn.path} className={`btn btn-${btn.variant}`}>{btn.label}</Link>
        ))}
      </div>
    </nav>
  );
}
