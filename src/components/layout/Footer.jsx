import { Link } from 'react-router-dom';
import navData from '../../../site-content/collections/navigation.json';
import './Footer.css';
import HoverEditor from '../ui/HoverEditor';
import { useTheme } from '../../context/ThemeContext';

export default function Footer() {
  const { footer } = navData;
  const { brandMark } = useTheme();
  const year = new Date().getFullYear();

  const renderLink = (item, i) => {
    if (item.external) return <a key={i} href={item.href} target="_blank" rel="noopener noreferrer">{item.label}{item.note && <small>{item.note}</small>}</a>;
    return <Link key={i} to={item.path}>{item.label}{item.note && <small>{item.note}</small>}</Link>;
  };

  return (
    <footer className="hi-footer">
      <div className="shell">
        <div className="footer-top">
          <HoverEditor model="navigation">
            <div className="footer-brand">
              <div className="footer-logo-row">
                <img src={brandMark} alt="" className="footer-mark" />
                <span className="footer-wm">Hyperion Industries</span>
              </div>
              <p className="footer-desc">Local-first intelligence infrastructure. Built for people who need custody, continuity, and control.</p>
              <a href="https://hyperion-industries.dev" className="footer-url">hyperion-industries.dev</a>
            </div>
          </HoverEditor>
          <div className="fcol">
            <div className="fcol-title">Systems</div>
            <div className="fcol-links">{footer.systems.map(renderLink)}</div>
          </div>
          <div className="fcol">
            <div className="fcol-title">Explore</div>
            <div className="fcol-links">{footer.explore.map(renderLink)}</div>
          </div>
          <div className="fcol">
            <div className="fcol-title">Connect</div>
            <div className="fcol-links">{footer.connect.map(renderLink)}</div>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© {year} Hyperion Industries — <span>Local-first. Always.</span></span>
          <div className="footer-legal">
            <a href="mailto:hello@hyperion-industries.dev">hello@hyperion-industries.dev</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
