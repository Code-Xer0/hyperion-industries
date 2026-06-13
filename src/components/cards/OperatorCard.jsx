import './OperatorCard.css';
import MediaFrame from '../ui/MediaFrame';
import { mediaSource } from '../../utils/media';

const THEME_BY_ID = { 'HYP-OP-002': 'operator-navy' };

/**
 * OperatorCard — operator-dossier card (homepage roster + founders index).
 * Frosted glass, persona-accented by `operator.theme`. Idle float; on hover/
 * focus the card blurs and surfaces an "Open profile" interface. Display-only:
 * it lives inside a <Link> on both pages, so no nested controls.
 */
export default function OperatorCard({ operator }) {
  const theme = operator.theme || THEME_BY_ID[operator.id] || 'operator-red';
  const hasImg = !!mediaSource(operator.image);

  return (
    <article className="op-card" data-theme={theme}>
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

      {operator.serial && <div className="op-serial">{operator.serial}</div>}

      {/* hover/focus interface — blurs the card, surfaces the open-profile hint */}
      <div className="op-hover" aria-hidden="true">
        <div className="op-hover-inner">
          <span className="op-hover-glyph">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3h7v7M21 3l-9 9M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
            </svg>
          </span>
          <span className="op-hover-label">Open profile</span>
          <span className="op-hover-sub">{operator.name} · dossier →</span>
        </div>
      </div>

      {/* touch devices have no hover — a persistent cue keeps the affordance */}
      <div className="op-cue" aria-hidden="true">Open profile <span className="ar">→</span></div>
    </article>
  );
}
