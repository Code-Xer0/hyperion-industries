import { CARD_TEMPLATES } from './cardStudioModel.js';
import './CardProductPreview.css';

const details = (source, template) => {
  if (source?.fields) {
    return {
      name: source.name,
      role: source.label,
      organization: source.fields.organization,
      email: source.fields.email,
      phone: source.fields.phone,
      website: source.fields.website,
      portrait: source.demo_assets?.portrait || '',
      demoLabel: source.operator_demo ? 'DEMO · PUBLIC OPERATOR' : 'DEMO · FICTIONAL',
    };
  }
  if (source?.identity) {
    return {
      name: source.identity.name,
      role: source.identity.role,
      organization: source.identity.organization,
      email: source.contact?.email,
      phone: source.contact?.phone,
      website: source.contact?.website,
      portrait: '',
      demoLabel: '',
    };
  }
  return {
    name: template.name,
    role: `${template.lane} identity system`,
    organization: 'Your organization',
    email: 'hello@company.example',
    phone: '+1 202-555-0100',
    website: 'company.example',
    portrait: '',
    demoLabel: '',
  };
};

export default function CardProductPreview({ templateId, source = null, compact = false }) {
  const template = CARD_TEMPLATES.find((item) => item.id === templateId) || CARD_TEMPLATES[0];
  const content = details(source, template);
  const initials = content.name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const style = {
    '--card-surface': template.surface,
    '--card-ink': template.ink,
    '--card-accent': template.tone,
  };
  return (
    <div className={`hcs-product-preview${compact ? ' is-compact' : ''}`} style={style} aria-label={`${content.name} front and back card preview`}>
      <div className="hcs-product-card is-front">
        {content.portrait ? <img src={content.portrait} alt="" loading="lazy" decoding="async" /> : <span className="hcs-product-monogram">{initials}</span>}
        <div className="hcs-product-card-copy">
          <small>{content.demoLabel || template.lane}</small>
          <strong>{content.name}</strong>
          <span>{content.role}</span>
          <b>{content.organization}</b>
        </div>
        <i>{template.name.toUpperCase()}</i>
      </div>
      <div className="hcs-product-card is-back" aria-hidden="true">
        <span className="hcs-product-brandmark">{initials || 'H'}</span>
        <div>
          <strong>{content.organization}</strong>
          <span>{content.email}</span>
          <span>{content.phone}</span>
          <span>{content.website}</span>
        </div>
        <span className="hcs-product-nfc">)))</span>
        <small>QR / NFC FRAME</small>
      </div>
      <span className="hcs-product-material">PVC · METAL · DIGITAL</span>
    </div>
  );
}
