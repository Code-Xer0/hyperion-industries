import './SectionHero.css';

export default function SectionHero({ eyebrow, title, lead, children }) {
  return (
    <section className="section-hero">
      <div className="shell">
        {eyebrow && <div className="sh-eyebrow"><span />{eyebrow}</div>}
        <h1 className="sh-title">{title}</h1>
        {lead && <p className="sh-lead">{lead}</p>}
        {children && <div className="sh-actions">{children}</div>}
      </div>
    </section>
  );
}
