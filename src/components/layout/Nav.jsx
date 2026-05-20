import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import navData from '../../data/navigation.json';
import './Nav.css';
import HoverEditor from '../ui/HoverEditor';
import { useTheme } from '../../context/ThemeContext';

export default function Nav() {
  const location = useLocation();
  const { isLightMode, toggleTheme } = useTheme();
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
        <img 
          src={isLightMode ? "/assets/branding/hyperion/Hyblklogoonly.png" : "/assets/branding/hyperion/Hywhtlogoonly.png"} 
          alt="Hyperion" 
          className="nav-mark" 
        />
        <div className="nav-wordmark" style={{ color: isLightMode ? '#000' : '#fff' }}>
          Hyperion<span style={{ color: isLightMode ? '#666' : 'var(--text-dim)' }}>Industries</span>
        </div>
      </Link>

      <button className={`nav-burger${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
        <span /><span /><span />
      </button>

      <HoverEditor model="navigation">
        <ul className={`nav-links${mobileOpen ? ' open' : ''}`}>
          {navData.main.map(link => (
            <li key={link.path}>
              <Link to={link.path} className={location.pathname === link.path ? 'active' : ''}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </HoverEditor>

      <HoverEditor model="navigation">
        <div className={`nav-cta${mobileOpen ? ' open' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={toggleTheme} 
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-soft)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            aria-label="Toggle Theme"
          >
            {isLightMode ? '☾' : '☼'}
          </button>
          {navData.cta.map((btn, i) => (
            btn.external
              ? <a key={i} href={btn.href} className={`btn btn-${btn.variant}`} target="_blank" rel="noopener noreferrer">{btn.label}</a>
              : <Link key={i} to={btn.path} className={`btn btn-${btn.variant}`}>{btn.label}</Link>
          ))}
        </div>
      </HoverEditor>
    </nav>
  );
}
