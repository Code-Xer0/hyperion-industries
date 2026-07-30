import {
  Archive,
  ArrowRight,
  Copy,
  Layers3,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  CARD_ARTIFACT_CATALOG,
  CARD_EXAMPLE_CATALOG,
  CARD_TEMPLATE_CATALOG,
} from '../../shared/card-studio/studio-catalog.js';
import {
  archiveDraft,
  createDraft,
  deleteDraft,
  duplicateDraft,
  readDraftShelf,
  renameDraft,
  writeDraftShelf,
} from '../features/card-studio/cardStudioDrafts.js';
import { CARD_TEMPLATES } from '../features/card-studio/cardStudioModel.js';
import './CardStudioPage.css';

const VIEWS = [
  { id: 'templates', label: 'Templates', count: CARD_TEMPLATE_CATALOG.items.length },
  { id: 'examples', label: 'Examples', count: CARD_EXAMPLE_CATALOG.items.length },
  { id: 'drafts', label: 'My Drafts', count: null },
];

function MiniCard({ templateId, name, role, demo = false }) {
  const template = CARD_TEMPLATES.find((item) => item.id === templateId) || CARD_TEMPLATES[0];
  return (
    <div
      className="hcs-library-proof"
      style={{ '--proof-surface': template.surface, '--proof-ink': template.ink, '--proof-accent': template.tone }}
      aria-hidden="true"
    >
      <span className="hcs-library-proof-line" />
      <small>{demo ? 'DEMO' : template.lane}</small>
      <strong>{name || template.name}</strong>
      <p>{role || `${template.lane} identity system`}</p>
      <i>{template.name.toUpperCase()}</i>
    </div>
  );
}

function ConfirmDelete({ draft, onCancel, onConfirm }) {
  const cancelRef = useRef(null);
  const dialogRef = useRef(null);
  useEffect(() => {
    const returnTarget = document.activeElement;
    cancelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
      if (event.key !== 'Tab') return;
      const focusable = [...(dialogRef.current?.querySelectorAll('button:not([disabled])') ?? [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      returnTarget?.focus?.();
    };
  }, [onCancel]);
  return (
    <div className="hcs-confirm-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section ref={dialogRef} className="hcs-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-draft-title">
        <span>DRAFT DELETION</span>
        <h2 id="delete-draft-title">Delete “{draft.draft_name}”?</h2>
        <p>This removes the device-local copy. Nothing has been submitted, and this cannot be undone.</p>
        <div>
          <button ref={cancelRef} type="button" onClick={onCancel}>Keep draft</button>
          <button className="is-danger" type="button" onClick={onConfirm}>Delete draft</button>
        </div>
      </section>
    </div>
  );
}

export default function CardStudioPage() {
  const navigate = useNavigate();
  const [view, setView] = useState('templates');
  const [query, setQuery] = useState('');
  const [shelf, setShelf] = useState(() => readDraftShelf());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    writeDraftShelf(shelf);
  }, [shelf]);

  const startDraft = (starterId) => {
    try {
      const result = createDraft(shelf, starterId);
      writeDraftShelf(result.shelf);
      setShelf(result.shelf);
      setNotice('');
      navigate(`/card-studio/design/${starterId}?draft=${result.draft.draft_id}`);
    } catch {
      setView('drafts');
      setNotice('The device-local shelf is full. Archive or delete a draft before creating another.');
    }
  };

  const duplicateLocalDraft = (draft) => {
    try {
      setShelf(duplicateDraft(shelf, draft.draft_id));
      setNotice('');
    } catch {
      setView('drafts');
      setNotice('The device-local shelf is full. Archive or delete a draft before duplicating another.');
    }
  };

  const resumeDraft = (draftId) => {
    const next = { ...shelf, active_draft_id: draftId };
    writeDraftShelf(next);
    setShelf(next);
    navigate(`/card-studio/design?draft=${draftId}`);
  };

  const matches = (value) => JSON.stringify(value).toLowerCase().includes(query.trim().toLowerCase());
  const templates = CARD_TEMPLATE_CATALOG.items.filter(matches);
  const examples = CARD_EXAMPLE_CATALOG.items.filter(matches);
  const drafts = shelf.drafts.filter((draft) => !draft.archived && matches(draft));
  const archived = shelf.drafts.filter((draft) => draft.archived && matches(draft));

  return (
    <main className="page-active card-studio-page">
      <Helmet>
        <title>Card Studio Library | Hyperion Industries</title>
        <meta
          name="description"
          content="Explore 20 guarded card templates, 12 privacy-safe demonstrations, and device-local Card Studio drafts."
        />
        <link rel="canonical" href="https://hyperion-industries.dev/card-studio" />
      </Helmet>

      <section className="hcs-library-hero">
        <div>
          <p><ShieldCheck size={15} /> HYPERION IDENTITY FABRICATION // PUBLIC DESIGN ROOM</p>
          <h1>Choose the signal.<br /><em>Shape it locally.</em></h1>
          <p className="hcs-library-intro">
            Start from a bounded system, explore fictional demonstrations, or resume a private device-local draft.
            Designing is public. Submission remains invitation-bound and held for operator review.
          </p>
        </div>
        <div className="hcs-library-posture" aria-label="Card Studio posture">
          <span><strong>20</strong> templates</span>
          <span><strong>48</strong> artifacts</span>
          <span><strong>LOCAL</strong> drafts</span>
          <small>NOT A QUOTE · NO CHECKOUT CREATED</small>
        </div>
      </section>

      <section className="hcs-library-command">
        <div className="hcs-library-tabs" role="tablist" aria-label="Card Studio library views">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={view === item.id}
              onClick={() => setView(item.id)}
            >
              {item.label}
              <span>{item.id === 'drafts' ? shelf.drafts.filter((draft) => !draft.archived).length : item.count}</span>
            </button>
          ))}
        </div>
        <label className="hcs-library-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search Card Studio library</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search templates, lanes, or demos" />
        </label>
        <button className="hcs-library-new" type="button" onClick={() => startDraft('ivory')}>
          <Plus size={16} /> New blank draft
        </button>
      </section>
      {notice && <p className="hcs-library-notice" role="status">{notice}</p>}

      {view === 'templates' && (
        <section className="hcs-library-section" role="tabpanel" aria-labelledby="hcs-templates-title">
          <div className="hcs-library-section-head">
            <div><span>01 · GUARDED STARTERS</span><h2 id="hcs-templates-title">Twenty systems, one bounded renderer.</h2></div>
            <p>Every starter supports front, back, and digital proof. Type, geometry, and artifacts stay within the production-aware vocabulary.</p>
          </div>
          <div className="hcs-library-grid">
            {templates.map((template) => (
              <article className="hcs-library-card" key={template.id}>
                <MiniCard templateId={template.id} />
                <div>
                  <span>{template.status}</span>
                  <h3>{template.name}</h3>
                  <p>{template.lane}</p>
                  <small>{template.starter_artifacts.length} starter artifacts · {template.typography} type</small>
                </div>
                <button type="button" onClick={() => startDraft(template.id)}>
                  Use {template.name} <ArrowRight size={15} />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {view === 'examples' && (
        <section className="hcs-library-section" role="tabpanel" aria-labelledby="hcs-examples-title">
          <div className="hcs-library-section-head">
            <div><span>02 · PRIVACY-SAFE DEMONSTRATIONS</span><h2 id="hcs-examples-title">Examples, never implied client work.</h2></div>
            <p>Ten profiles are explicitly fictional and use reserved <code>.example</code> contact data. Two Hyperion demos use only existing public operator profile fields.</p>
          </div>
          <div className="hcs-library-grid">
            {examples.map((example) => (
              <article className="hcs-library-card is-demo" key={example.id}>
                <MiniCard templateId={example.template_id} name={example.name} role={example.label} demo />
                <div>
                  <span>DEMO · {example.operator_demo ? 'PUBLIC OPERATOR' : 'FICTIONAL'}</span>
                  <h3>{example.name}</h3>
                  <p>{example.label}</p>
                  <small>{example.fields.organization} · {example.fields.website}</small>
                </div>
                <button type="button" onClick={() => startDraft(example.id)}>
                  Remix demo <ArrowRight size={15} />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {view === 'drafts' && (
        <section className="hcs-library-section" role="tabpanel" aria-labelledby="hcs-drafts-title">
          <div className="hcs-library-section-head">
            <div><span>03 · DEVICE-LOCAL SHELF</span><h2 id="hcs-drafts-title">Private until you stage a revision.</h2></div>
            <p>{shelf.drafts.length} of 24 slots used. Drafts remain in this browser and are never sent during autosave.</p>
          </div>
          {!drafts.length && (
            <div className="hcs-library-empty">
              <Layers3 size={28} />
              <h3>No active drafts match this view.</h3>
              <p>Start from a template or example. The studio will save your work locally.</p>
              <button type="button" onClick={() => setView('templates')}>Browse templates</button>
            </div>
          )}
          <div className="hcs-draft-grid">
            {drafts.map((draft) => (
              <article className="hcs-draft-card" key={draft.draft_id}>
                <MiniCard templateId={draft.template_id} name={draft.identity.name} role={draft.identity.role} />
                <label>
                  <span>Draft name</span>
                  <input value={draft.draft_name} onChange={(event) => setShelf(renameDraft(shelf, draft.draft_id, event.target.value))} />
                </label>
                <div className="hcs-draft-meta">
                  <span>R{draft.revision}</span>
                  <span>{draft.updated_at ? new Date(draft.updated_at).toLocaleDateString() : 'LOCAL'}</span>
                </div>
                <div className="hcs-draft-actions">
                  <button type="button" onClick={() => resumeDraft(draft.draft_id)}><Pencil size={15} /> Resume</button>
                  <button type="button" aria-label={`Duplicate ${draft.draft_name}`} onClick={() => duplicateLocalDraft(draft)}><Copy size={15} /></button>
                  <button type="button" aria-label={`Archive ${draft.draft_name}`} onClick={() => setShelf(archiveDraft(shelf, draft.draft_id))}><Archive size={15} /></button>
                  <button type="button" aria-label={`Delete ${draft.draft_name}`} onClick={() => setDeleteTarget(draft)}><Trash2 size={15} /></button>
                </div>
              </article>
            ))}
          </div>
          {archived.length > 0 && (
            <details className="hcs-archive-shelf">
              <summary>Archived drafts <span>{archived.length}</span></summary>
              {archived.map((draft) => (
                <div key={draft.draft_id}>
                  <span>{draft.draft_name}</span>
                  <button type="button" onClick={() => setShelf(archiveDraft(shelf, draft.draft_id, false))}>Restore</button>
                  <button type="button" onClick={() => setDeleteTarget(draft)}>Delete</button>
                </div>
              ))}
            </details>
          )}
        </section>
      )}

      <section className="hcs-artifact-note">
        <div><Layers3 size={23} /><span>Six bundled artifact packs</span><strong>{CARD_ARTIFACT_CATALOG.items.length} reusable primitives</strong></div>
        <p>Accessible palettes, surfaces, marks, layouts, signal badges, and QR/NFC frames are available inside Advanced mode. No uploads or external asset URLs are accepted in this release.</p>
      </section>

      {deleteTarget && (
        <ConfirmDelete
          draft={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            setShelf(deleteDraft(shelf, deleteTarget.draft_id));
            setDeleteTarget(null);
          }}
        />
      )}
    </main>
  );
}
