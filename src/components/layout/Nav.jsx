import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import navData from '../../data/navigation.json';
import './Nav.css';
import HoverEditor from '../ui/HoverEditor';
import { useTheme } from '../../context/ThemeContext';

export default function Nav() {
  const location = useLocation();
  const { isLightMode, brandMark, toggleTheme } = useTheme();
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
          src={brandMark}
          alt="Hyperion"
          className="nav-mark"
        />
        <div className="nav-wordmark">
          Hyperion<span>Industries</span>
        </div>
      </Link>

      <button className={`nav-burger${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
        <span /><span /><span />
      </button>

      <div className={`nav-mobile-panel${mobileOpen ? ' open' : ''}`}>
        <HoverEditor model="navigation">
          <ul className="nav-mobile-links">
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
          <div className="nav-mobile-cta">
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label="Toggle Theme"
              title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
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
      </div>

      <HoverEditor model="navigation">
        <ul className="nav-links">
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
        <div className="nav-cta">
          <button 
            onClick={toggleTheme} 
            className="theme-toggle"
            aria-label="Toggle Theme"
            title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
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
