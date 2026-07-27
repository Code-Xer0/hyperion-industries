import {
  Check,
  ChevronRight,
  CircleAlert,
  Eye,
  EyeOff,
  History,
  PanelTop,
  Redo2,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Smartphone,
  Undo2,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import {
  CARD_STUDIO_STORAGE_KEY,
  CARD_TEMPLATES,
  TYPE_OPTIONS,
  createCardDocument,
  evaluateCardPreflight,
  normalizeCardDocument,
  stableFingerprint,
  updateDocumentPath,
} from './cardStudioModel.js';
import { submitCardStudioBrief } from './cardStudioSubmission.js';
import './CardStudioEditor.css';

const CONTROL_SECTIONS = [
  { id: 'identity', label: 'Identity' },
  { id: 'contact', label: 'Contact' },
  { id: 'style', label: 'Style' },
  { id: 'sharing', label: 'Sharing' },
];

const HISTORY_LIMIT = 40;

function loadLocalDraft() {
  try {
    const raw = localStorage.getItem(CARD_STUDIO_STORAGE_KEY);
    if (!raw) return { document: createCardDocument(), recovered: false };
    return { document: normalizeCardDocument(JSON.parse(raw)), recovered: true };
  } catch {
    return { document: createCardDocument(), recovered: false };
  }
}

function editorReducer(state, action) {
  if (action.type === 'UNDO' && state.past.length) {
    const previous = state.past.at(-1);
    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future].slice(0, HISTORY_LIMIT),
      recovered: state.recovered,
    };
  }
  if (action.type === 'REDO' && state.future.length) {
    const [next, ...future] = state.future;
    return {
      past: [...state.past, state.present].slice(-HISTORY_LIMIT),
      present: next,
      future,
      recovered: state.recovered,
    };
  }
  if (action.type === 'RESET') {
    return {
      past: [...state.past, state.present].slice(-HISTORY_LIMIT),
      present: createCardDocument(),
      future: [],
      recovered: false,
    };
  }
  if (action.type === 'SET') {
    const next = updateDocumentPath(state.present, action.section, action.key, action.value);
    return {
      past: [...state.past, state.present].slice(-HISTORY_LIMIT),
      present: next,
      future: [],
      recovered: state.recovered,
    };
  }
  if (action.type === 'TEMPLATE') {
    const template = CARD_TEMPLATES.find((candidate) => candidate.id === action.value);
    if (!template || template.id === state.present.template_id) return state;
    const next = updateDocumentPath(state.present, 'template_id', null, template.id);
    next.style.accent = template.tone;
    return {
      past: [...state.past, state.present].slice(-HISTORY_LIMIT),
      present: next,
      future: [],
      recovered: state.recovered,
    };
  }
  return state;
}

function initialEditorState() {
  const loaded = loadLocalDraft();
  return { past: [], present: loaded.document, future: [], recovered: loaded.recovered };
}

function Field({ label, hint, children }) {
  return (
    <label className="hcs-field">
      <span className="hcs-field-label">{label}</span>
      {children}
      {hint && <span className="hcs-field-hint">{hint}</span>}
    </label>
  );
}

function TextInput({ label, value, onChange, maxLength = 80, type = 'text', hint }) {
  return (
    <Field label={label} hint={hint}>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function VisibilityToggle({ label, checked, onChange }) {
  return (
    <button
      className="hcs-visibility-toggle"
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      {checked ? <Eye size={15} /> : <EyeOff size={15} />}
      <span>{label}</span>
      <strong>{checked ? 'VISIBLE' : 'HIDDEN'}</strong>
    </button>
  );
}

function QrPattern({ seed }) {
  const cells = useMemo(() => {
    let hash = 17;
    for (let index = 0; index < seed.length; index += 1) hash = Math.imul(hash ^ seed.charCodeAt(index), 31);
    return Array.from({ length: 81 }, (_, index) => {
      const row = Math.floor(index / 9);
      const column = index % 9;
      const finder = (row < 3 && column < 3)
        || (row < 3 && column > 5)
        || (row > 5 && column < 3);
      if (finder) return row % 2 === 0 || column % 2 === 0;
      hash = Math.imul(hash ^ index, 1103515245) + 12345;
      return (hash & 4) === 4;
    });
  }, [seed]);

  return (
    <div className="hcs-qr" role="img" aria-label="Illustrative QR placement; production code is generated after review">
      {cells.map((active, index) => <i key={index} data-active={active ? 'true' : 'false'} />)}
    </div>
  );
}

function ContactRows({ document }) {
  return (
    <div className="hcs-card-contacts">
      {document.visibility.email && <span>{document.contact.email || 'EMAIL HIDDEN'}</span>}
      {document.visibility.phone && <span>{document.contact.phone || 'PHONE HIDDEN'}</span>}
      {document.visibility.website && <span>{document.contact.website || 'WEBSITE HIDDEN'}</span>}
    </div>
  );
}

function PhysicalCard({ document, overlays }) {
  const template = CARD_TEMPLATES.find((item) => item.id === document.template_id) || CARD_TEMPLATES[0];
  const typography = TYPE_OPTIONS.find((item) => item.id === document.style.typography) || TYPE_OPTIONS[0];
  const style = {
    '--hcs-card-accent': document.style.accent,
    '--hcs-card-surface': template.surface,
    '--hcs-card-ink': template.ink,
    '--hcs-card-font': typography.stack,
    '--hcs-card-space': `${Math.max(18, document.style.spacing) / 100}rem`,
  };
  const mode = document.active_mode === 'digital' ? 'front' : document.active_mode;

  return (
    <div
      className={`hcs-proof-card is-${mode}`}
      data-template={document.template_id}
      style={style}
      aria-label={`${template.name} card ${mode} proof`}
    >
      {overlays.bleed && <div className="hcs-bleed-guide" aria-hidden="true"><span>BLEED</span></div>}
      {overlays.safe && <div className="hcs-safe-guide" aria-hidden="true"><span>SAFE AREA</span></div>}
      <div className="hcs-card-topline">
        <span>{document.identity.organization || 'YOUR ORGANIZATION'}</span>
        <span>{document.template_id.toUpperCase()} · R{String(document.revision).padStart(2, '0')}</span>
      </div>

      {mode === 'front' ? (
        <>
          <div className="hcs-card-identity">
            <span className="hcs-card-initials">{document.identity.initials || 'ID'}</span>
            <h2>{document.identity.name || 'Your name'}</h2>
            <p>{document.identity.role || 'Your role'}</p>
            {document.visibility.tagline && <q>{document.identity.tagline || 'Your signal, made tangible.'}</q>}
          </div>
          <ContactRows document={document} />
          <div className="hcs-card-footer">
            <span className="hcs-card-mark">HYPERION</span>
            <span>NFC + QR · REVIEW REQUIRED</span>
          </div>
        </>
      ) : (
        <>
          <div className="hcs-card-back">
            <div>
              <span className="hcs-card-back-label">PUBLIC PROFILE</span>
              <h2>{document.identity.name || 'Your name'}</h2>
              <p>{document.sharing.destination || 'Add a destination'}</p>
            </div>
            <QrPattern seed={document.sharing.destination || document.identity.name} />
          </div>
          <div className="hcs-card-footer">
            <span className="hcs-card-mark">HYPERION</span>
            <span>PROOF · NOT PRODUCTION ART</span>
          </div>
        </>
      )}
    </div>
  );
}

function DigitalProfile({ document }) {
  return (
    <div className="hcs-phone" aria-label="Digital profile preview">
      <div className="hcs-phone-status"><span>9:41</span><span>PROFILE PREVIEW</span></div>
      <div className="hcs-profile-hero" style={{ '--hcs-card-accent': document.style.accent }}>
        <span className="hcs-profile-avatar">{document.identity.initials || 'ID'}</span>
        <p className="hcs-profile-eyebrow">{document.identity.organization || 'YOUR ORGANIZATION'}</p>
        <h2>{document.identity.name || 'Your name'}</h2>
        <p>{document.identity.role || 'Your role'}</p>
        {document.visibility.tagline && <q>{document.identity.tagline}</q>}
      </div>
      <div className="hcs-profile-actions">
        <button type="button" disabled>Save contact</button>
        <button type="button" disabled>Share profile</button>
      </div>
      <ContactRows document={document} />
      <div className="hcs-profile-truth">Preview only · profile publishing is operator reviewed</div>
    </div>
  );
}

function TemplateRail({ selected, onSelect }) {
  return (
    <div className="hcs-template-grid" role="list" aria-label="Card templates">
      {CARD_TEMPLATES.map((template) => (
        <button
          key={template.id}
          className="hcs-template"
          data-selected={selected === template.id ? 'true' : 'false'}
          type="button"
          role="listitem"
          onClick={() => onSelect(template.id)}
        >
          <span className="hcs-template-swatch" style={{ '--template-tone': template.tone, '--template-surface': template.surface }} />
          <span><strong>{template.name}</strong><small>{template.lane}</small></span>
          {selected === template.id && <Check size={14} aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}

function ControlPanel({ section, document, setField }) {
  if (section === 'identity') {
    return (
      <div className="hcs-control-stack">
        <TextInput label="Name" value={document.identity.name} maxLength={64} onChange={(value) => setField('identity', 'name', value)} />
        <TextInput label="Role / title" value={document.identity.role} maxLength={72} onChange={(value) => setField('identity', 'role', value)} />
        <TextInput label="Organization" value={document.identity.organization} maxLength={64} onChange={(value) => setField('identity', 'organization', value)} />
        <TextInput label="Initials" value={document.identity.initials} maxLength={4} onChange={(value) => setField('identity', 'initials', value.toUpperCase())} />
        <TextInput label="Signal line" value={document.identity.tagline} maxLength={96} onChange={(value) => setField('identity', 'tagline', value)} />
        <VisibilityToggle label="Show signal line" checked={document.visibility.tagline} onChange={(value) => setField('visibility', 'tagline', value)} />
      </div>
    );
  }

  if (section === 'contact') {
    return (
      <div className="hcs-control-stack">
        <TextInput label="Email" type="email" value={document.contact.email} maxLength={120} onChange={(value) => setField('contact', 'email', value)} />
        <VisibilityToggle label="Show email" checked={document.visibility.email} onChange={(value) => setField('visibility', 'email', value)} />
        <TextInput label="Phone" type="tel" value={document.contact.phone} maxLength={32} onChange={(value) => setField('contact', 'phone', value)} />
        <VisibilityToggle label="Show phone" checked={document.visibility.phone} onChange={(value) => setField('visibility', 'phone', value)} />
        <TextInput label="Website" value={document.contact.website} maxLength={120} onChange={(value) => setField('contact', 'website', value)} />
        <VisibilityToggle label="Show website" checked={document.visibility.website} onChange={(value) => setField('visibility', 'website', value)} />
      </div>
    );
  }

  if (section === 'style') {
    return (
      <div className="hcs-control-stack">
        <Field label="Accent color" hint="Used for proof emphasis; production gamut is reviewed later.">
          <div className="hcs-color-control">
            <input
              type="color"
              value={document.style.accent}
              onChange={(event) => setField('style', 'accent', event.target.value)}
              aria-label="Accent color picker"
            />
            <input
              type="text"
              value={document.style.accent}
              maxLength={7}
              pattern="#[0-9a-fA-F]{6}"
              onChange={(event) => setField('style', 'accent', event.target.value)}
              aria-label="Accent color hexadecimal value"
            />
          </div>
        </Field>
        <Field label="Typography">
          <select value={document.style.typography} onChange={(event) => setField('style', 'typography', event.target.value)}>
            {TYPE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </Field>
        <Field label={`Spacing · ${document.style.spacing}%`} hint="Dense layouts receive an additional preflight warning.">
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={document.style.spacing}
            onChange={(event) => setField('style', 'spacing', Number(event.target.value))}
          />
        </Field>
      </div>
    );
  }

  return (
    <div className="hcs-control-stack">
      <TextInput
        label="Profile handle"
        value={document.sharing.profile_path}
        maxLength={48}
        hint="Reserved only after operator review."
        onChange={(value) => setField('sharing', 'profile_path', value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
      />
      <TextInput
        label="Tap / scan destination"
        type="url"
        value={document.sharing.destination}
        maxLength={240}
        hint="Must use HTTPS. This preview does not program an NFC chip."
        onChange={(value) => setField('sharing', 'destination', value)}
      />
      <Field label="Review notes" hint="Describe finish, quantity, constraints, or requested changes.">
        <textarea
          value={document.notes}
          rows="6"
          maxLength={1200}
          onChange={(event) => setField('notes', null, event.target.value)}
        />
      </Field>
    </div>
  );
}

function ProofSummary({ document, preflight }) {
  const template = CARD_TEMPLATES.find((item) => item.id === document.template_id);
  const visibleChannels = ['email', 'phone', 'website'].filter((key) => document.visibility[key]);
  const fingerprint = stableFingerprint(document);
  return (
    <section className="hcs-proof-summary" aria-labelledby="proof-summary-title">
      <div className="hcs-panel-title">
        <div><p>Deterministic handoff</p><h2 id="proof-summary-title">Proof summary</h2></div>
        <span>{fingerprint}</span>
      </div>
      <dl>
        <div><dt>Template</dt><dd>{template?.name} / {template?.lane}</dd></div>
        <div><dt>Revision</dt><dd>{document.revision}</dd></div>
        <div><dt>Visible contact</dt><dd>{visibleChannels.length ? visibleChannels.join(', ') : 'None'}</dd></div>
        <div><dt>Destination</dt><dd>{document.sharing.destination || 'Unknown'}</dd></div>
        <div><dt>Preflight</dt><dd>{preflight.status}</dd></div>
        <div><dt>Commerce</dt><dd>NOT A QUOTE</dd></div>
      </dl>
      <p className="hcs-summary-note">
        This proof is a design brief. QR generation, NFC programming, material selection, pricing, and production geometry remain subject to operator review.
      </p>
    </section>
  );
}

export default function CardStudioEditor() {
  const [history, dispatch] = useReducer(editorReducer, undefined, initialEditorState);
  const [controlSection, setControlSection] = useState('identity');
  const [overlays, setOverlays] = useState({ safe: true, bleed: false });
  const [savedAt, setSavedAt] = useState(null);
  const [consent, setConsent] = useState(false);
  const [submission, setSubmission] = useState({ state: 'idle', message: '' });
  const document = history.present;
  const preflight = useMemo(() => evaluateCardPreflight(document), [document]);

  const setField = useCallback((section, key, value) => {
    dispatch({ type: 'SET', section, key, value });
    setSubmission({ state: 'idle', message: '' });
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(CARD_STUDIO_STORAGE_KEY, JSON.stringify(document));
        setSavedAt(new Date());
      } catch {
        setSavedAt(null);
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [document]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? 'REDO' : 'UNDO' });
      } else if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        dispatch({ type: 'REDO' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const submitBrief = async () => {
    if (!preflight.ready || !consent || submission.state === 'submitting') return;
    setSubmission({ state: 'submitting', message: 'Staging the design brief for review…' });
    try {
      const result = await submitCardStudioBrief(document, consent);
      setSubmission({
        state: 'submitted',
        message: `Brief staged for review${result.reference ? ` · ${result.reference}` : ''}. No checkout or payment was created.`,
      });
    } catch (error) {
      const staged = error.status === 404 || error.status === 501 || error.status === 503;
      setSubmission({
        state: 'error',
        message: staged
          ? 'Your draft is saved on this device. The Card Studio review lane is staged but not accepting submissions yet.'
          : 'The brief could not be staged. Your local draft is safe; retry when the review lane is available.',
      });
    }
  };

  return (
    <div className="hcs-editor">
      <section className="hcs-editor-header" aria-labelledby="card-studio-title">
        <div>
          <p className="hcs-kicker">HYPERION IDENTITY FABRICATION · PUBLIC PREVIEW</p>
          <h1 id="card-studio-title">Compose the signal.<br /><span>Keep authority visible.</span></h1>
          <p>
            Build a bounded operator-card brief with a production-aware proof. Your draft stays on this device until you explicitly stage it for review.
          </p>
        </div>
        <div className="hcs-status-stack" aria-label="Studio posture">
          <span data-tone={preflight.ready ? 'ready' : 'draft'}>{preflight.status}</span>
          <span data-tone="review">REVIEW REQUIRED</span>
          <span>NOT A QUOTE</span>
        </div>
      </section>

      {history.recovered && (
        <div className="hcs-recovery-banner" role="status">
          <History size={16} />
          Recovered revision {document.revision} from this device. Nothing was submitted.
        </div>
      )}

      <section className="hcs-template-panel" aria-labelledby="template-heading">
        <div className="hcs-panel-title">
          <div><p>01 · Visual system</p><h2 id="template-heading">Choose a guarded template</h2></div>
          <span>8 PUBLIC TEMPLATES</span>
        </div>
        <TemplateRail selected={document.template_id} onSelect={(value) => dispatch({ type: 'TEMPLATE', value })} />
      </section>

      <div className="hcs-workspace">
        <aside className="hcs-controls" aria-label="Card controls">
          <div className="hcs-control-tabs" role="tablist" aria-label="Editing controls">
            {CONTROL_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={controlSection === section.id}
                onClick={() => setControlSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>
          <div className="hcs-control-body" role="tabpanel">
            <ControlPanel section={controlSection} document={document} setField={setField} />
          </div>
        </aside>

        <section className="hcs-stage" aria-labelledby="proof-heading">
          <div className="hcs-stage-toolbar">
            <div className="hcs-mode-switch" role="tablist" aria-label="Proof mode">
              {[
                { id: 'front', label: 'Front', icon: PanelTop },
                { id: 'back', label: 'Back', icon: RotateCcw },
                { id: 'digital', label: 'Digital', icon: Smartphone },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={document.active_mode === id}
                  onClick={() => setField('active_mode', null, id)}
                >
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>
            <div className="hcs-history-controls">
              <button type="button" disabled={!history.past.length} onClick={() => dispatch({ type: 'UNDO' })} aria-label="Undo last edit" title="Undo (Ctrl+Z)"><Undo2 size={16} /></button>
              <button type="button" disabled={!history.future.length} onClick={() => dispatch({ type: 'REDO' })} aria-label="Redo edit" title="Redo (Ctrl+Y)"><Redo2 size={16} /></button>
            </div>
          </div>
          <div className="hcs-stage-heading">
            <div><p>02 · Live proof</p><h2 id="proof-heading">{document.active_mode === 'digital' ? 'Digital profile' : `${document.active_mode} face`}</h2></div>
            <div className="hcs-overlay-controls">
              <button type="button" aria-pressed={overlays.safe} onClick={() => setOverlays((value) => ({ ...value, safe: !value.safe }))}>Safe area</button>
              <button type="button" aria-pressed={overlays.bleed} onClick={() => setOverlays((value) => ({ ...value, bleed: !value.bleed }))}>Bleed</button>
            </div>
          </div>
          <div className="hcs-proof-deck">
            {document.active_mode === 'digital'
              ? <DigitalProfile document={document} />
              : <PhysicalCard document={document} overlays={overlays} />}
          </div>
          <div className="hcs-local-save" aria-live="polite">
            <Save size={14} />
            {savedAt ? `Saved locally ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Local save unavailable'}
          </div>
        </section>
      </div>

      <div className="hcs-review-grid">
        <section className="hcs-preflight" aria-labelledby="preflight-heading">
          <div className="hcs-panel-title">
            <div><p>03 · Guardrails</p><h2 id="preflight-heading">Preflight</h2></div>
            <span data-status={preflight.ready ? 'ready' : 'blocked'}>{preflight.status}</span>
          </div>
          {!preflight.blockers.length && !preflight.warnings.length && (
            <div className="hcs-preflight-item is-ready"><ShieldCheck size={17} /><span><strong>Brief is internally consistent.</strong> Production and commerce review are still required.</span></div>
          )}
          {preflight.blockers.map((item) => (
            <div className="hcs-preflight-item is-blocker" key={item}><CircleAlert size={17} /><span>{item}</span></div>
          ))}
          {preflight.warnings.map((item) => (
            <div className="hcs-preflight-item is-warning" key={item}><CircleAlert size={17} /><span>{item}</span></div>
          ))}
        </section>
        <ProofSummary document={document} preflight={preflight} />
      </div>

      <section className="hcs-submit-panel" aria-labelledby="submit-heading">
        <div>
          <p>04 · Operator handoff</p>
          <h2 id="submit-heading">Stage a design brief</h2>
          <p>
            This creates a review request only. It does not publish a profile, generate production artwork, program NFC, charge a card, reserve a price, or create checkout.
          </p>
        </div>
        <div className="hcs-submit-actions">
          <label className="hcs-consent">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>I understand the selected visible fields are intended for a public identity surface and require operator review before publication.</span>
          </label>
          <button
            className="hcs-submit-button"
            type="button"
            disabled={!preflight.ready || !consent || submission.state === 'submitting'}
            onClick={submitBrief}
          >
            {submission.state === 'submitting' ? 'Staging brief…' : 'Stage for review'}
            {submission.state === 'submitting' ? <span className="hcs-button-pulse" aria-hidden="true" /> : <Send size={16} />}
          </button>
          {submission.message && (
            <p className={`hcs-submit-message is-${submission.state}`} role={submission.state === 'error' ? 'alert' : 'status'}>
              {submission.message}
            </p>
          )}
          <button className="hcs-reset-button" type="button" onClick={() => dispatch({ type: 'RESET' })}>
            Start a clean draft <ChevronRight size={14} />
          </button>
        </div>
      </section>
    </div>
  );
}
