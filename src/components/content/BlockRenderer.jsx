import { Link } from 'react-router-dom';
import './content-page.css';

function asItems(value) {
  return Array.isArray(value) ? value : [];
}

function Action({ action }) {
  if (!action?.href || !action?.label) return null;
  const className = action.kind === 'primary' ? 'btn btn-gold' : 'btn btn-ghost';
  if (/^https:\/\//.test(action.href)) {
    return <a className={className} href={action.href} rel="noreferrer" target="_blank">{action.label}</a>;
  }
  return <Link className={className} to={action.href}>{action.label}</Link>;
}

function SafeMedia({ item, className = '' }) {
  if (!item?.src || !item.src.startsWith('/assets/')) return null;
  if (item.type === 'video') {
    return <video className={className} controls={Boolean(item.controls)} muted={Boolean(item.muted)} poster={item.poster} src={item.src} />;
  }
  return <img className={className} alt={item.alt || ''} loading="lazy" src={item.src} />;
}

function Hero({ data }) {
  return (
    <section className="builder-hero">
      {data.media && <SafeMedia className="builder-hero__media" item={data.media} />}
      <div className="builder-hero__scrim" />
      <div className="shell builder-hero__content">
        {data.eyebrow && <p className="eyebrow">{data.eyebrow}</p>}
        <h1>{data.title}</h1>
        {data.lead && <p className="builder-lede">{data.lead}</p>}
        <div className="room-action-row">{asItems(data.actions).map((action) => <Action action={action} key={`${action.href}-${action.label}`} />)}</div>
      </div>
    </section>
  );
}

function RichText({ data }) {
  const paragraphs = asItems(data.paragraphs).length ? data.paragraphs : (data.body ? [data.body] : []);
  return (
    <section className="shell builder-section builder-copy">
      {data.eyebrow && <p className="eyebrow">{data.eyebrow}</p>}
      {data.title && <h2>{data.title}</h2>}
      {paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice?.(0, 24)}`}>{String(paragraph)}</p>)}
    </section>
  );
}

function Media({ data }) {
  return (
    <section className="shell builder-section builder-media">
      <SafeMedia item={data} />
      {(data.caption || data.credit) && <p className="builder-caption">{data.caption}{data.credit ? ` · ${data.credit}` : ''}</p>}
    </section>
  );
}

function MediaStrip({ data }) {
  return (
    <section className="shell builder-section builder-media-strip">
      {asItems(data.items).map((item) => <SafeMedia item={item} key={item.src} />)}
    </section>
  );
}

function CardGrid({ data }) {
  return (
    <section className="shell builder-section">
      {data.eyebrow && <p className="eyebrow">{data.eyebrow}</p>}
      {data.title && <h2>{data.title}</h2>}
      <div className="builder-card-grid">
        {asItems(data.cards).map((card, index) => (
          <article className="builder-card" key={card.id || `${card.title}-${index}`}>
            {card.media && <SafeMedia item={card.media} />}
            {card.eyebrow && <p className="eyebrow">{card.eyebrow}</p>}
            <h3>{card.title}</h3>
            {card.body && <p>{card.body}</p>}
            {card.action && <Action action={card.action} />}
          </article>
        ))}
      </div>
    </section>
  );
}

function CtaGroup({ data }) {
  return (
    <section className="shell builder-section builder-cta">
      <div>
        {data.eyebrow && <p className="eyebrow">{data.eyebrow}</p>}
        {data.title && <h2>{data.title}</h2>}
        {data.body && <p>{data.body}</p>}
      </div>
      <div className="room-action-row">{asItems(data.actions).map((action) => <Action action={action} key={`${action.href}-${action.label}`} />)}</div>
    </section>
  );
}

function Stats({ data }) {
  return (
    <section className="shell builder-section builder-stats">
      {asItems(data.items).map((item) => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}
    </section>
  );
}

function Timeline({ data }) {
  return (
    <section className="shell builder-section">
      {data.title && <h2>{data.title}</h2>}
      <ol className="builder-timeline">{asItems(data.items).map((item) => <li key={`${item.label}-${item.title}`}><span>{item.label}</span><h3>{item.title}</h3><p>{item.body}</p></li>)}</ol>
    </section>
  );
}

function Faq({ data }) {
  return (
    <section className="shell builder-section">
      {data.title && <h2>{data.title}</h2>}
      <div className="builder-faq">{asItems(data.items).map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
    </section>
  );
}

function Quote({ data }) {
  return <figure className="shell builder-section builder-quote"><blockquote>{data.quote}</blockquote>{data.attribution && <figcaption>— {data.attribution}</figcaption>}</figure>;
}

function Gallery({ data }) {
  return <section className="shell builder-section builder-gallery">{asItems(data.items).map((item) => <SafeMedia item={item} key={item.src} />)}</section>;
}

const RENDERERS = {
  hero: Hero,
  rich_text: RichText,
  media: Media,
  media_strip: MediaStrip,
  card_grid: CardGrid,
  cta_group: CtaGroup,
  stats: Stats,
  timeline: Timeline,
  faq: Faq,
  quote: Quote,
  gallery: Gallery,
  divider: () => <div className="shell builder-divider" aria-hidden="true" />,
};

export default function BlockRenderer({ blocks }) {
  return asItems(blocks).map((block) => {
    const Renderer = RENDERERS[block.type];
    if (!Renderer) return null;
    const visibility = Object.entries(block.visibility || {})
      .filter(([, visible]) => visible === false)
      .map(([breakpoint]) => `builder-hide-${breakpoint}`)
      .join(' ');
    return <div className={visibility} data-builder-block={block.type} data-builder-block-id={block.id} key={block.id}><Renderer data={block.data} variant={block.variant} /></div>;
  });
}
