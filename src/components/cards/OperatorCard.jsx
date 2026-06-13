import { motion } from 'framer-motion';
import './OperatorCard.css';
import MediaFrame from '../ui/MediaFrame';
import { mediaSource } from '../../utils/media';

const THEME_BY_ID = { 'HYP-OP-002': 'operator-navy' };

/**
 * OperatorCard — operator-dossier card used on the homepage roster and the
 * Meet-the-Founders index. Frosted glass, persona-accented by `operator.theme`
 * (operator-red / operator-navy), portrait + stat readout + focus chips.
 * Display-only: it lives inside a <Link> on both pages, so no nested controls.
 */
export default function OperatorCard({ operator }) {
  const theme = operator.theme || THEME_BY_ID[operator.id] || 'operator-red';
  const hasImg = !!mediaSource(operator.image);

  return (
    <motion.article
      className="op-card"
      data-theme={theme}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      <span className="op-corner tl" /><span className="op-corner tr" />
      <span className="op-corner bl" /><span className="op-corner br" />

      <div className="op-card-top">
        <span className="op-kicker">Operator dossier</span>
        <span className="op-attr" title={operator.attrTitle || ''}>{operator.attr || 'H'}</span>
      </div>

      <div className="op-portrait" style={operator.artBackground ? { background: operator.artBackground } : undefined}>
        {hasImg
          ? <MediaFrame media={operator.image} alt={operator.name} className="op-media" />
          : <span className="op-watermark" aria-hidden="true">{operator.attr || 'H'}</span>}
        <span className="op-portrait-scrim" aria-hidden="true" />
        {operator.stars && <span className="op-stars">{operator.stars}</span>}
      </div>

      <div className="op-body">
        <h3 className="op-name">{operator.name}</h3>
        {operator.typeLine && <div className="op-typeline">{operator.typeLine}</div>}
        {operator.description && <p className="op-desc">{operator.description}</p>}
        {operator.focuses && operator.focuses.length > 0 && (
          <div className="op-focuses">
            {operator.focuses.slice(0, 4).map((f, i) => <span className="op-focus" key={i}>{f}</span>)}
          </div>
        )}
      </div>

      {operator.stats && operator.stats.length > 0 && (
        <div className="op-stats">
          {operator.stats.map((s, i) => (
            <div className="op-stat" key={i}><b>{s.value}</b><span>{s.label}</span></div>
          ))}
        </div>
      )}
      {operator.serial && <div className="op-serial">{operator.serial}</div>}
    </motion.article>
  );
}
