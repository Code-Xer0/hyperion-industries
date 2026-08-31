import {
  ArrowLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  EyeOff,
  Grip,
  Layers3,
  Lock,
  Maximize2,
  Redo2,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
  Undo2,
  Unlock,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CARD_CATALOG } from '../../../shared/card-studio/catalog.ts';
import {
  CARD_ARTIFACT_CATALOG,
  CARD_ARTIFACT_BY_ID,
} from '../../../shared/card-studio/studio-catalog.js';
import {
  CARD_TEMPLATES,
  TYPE_OPTIONS,
  addArtifactLayer,
  alignLayer,
  applyCardTemplate,
  createCardDocument,
  evaluateCardPreflight,
  normalizeCardDocument,
  removeLayer,
  reorderLayer,
  stableFingerprint,
  updateDocumentPath,
  updateLayer,
} from './cardStudioModel.js';
import ConciergeNarration from '../../components/ui/ConciergeNarration';
import {
  createDraft,
  getActiveDraft,
  readDraftShelf,
  saveDraft,
  writeDraftShelf,
} from './cardStudioDrafts.js';
import { getCardStudioOrderStatus, submitCardStudioBrief } from './cardStudioSubmission.js';
import './CardStudioEditor.css';

const CONTROL_SECTIONS = [
  { id: 'identity', label: 'Identity' },
  { id: 'contact', label: 'Contact' },
  { id: 'style', label: 'Style' },
  { id: 'sharing', label: 'Sharing' },
];
const HISTORY_LIMIT = 60;

function initialDocument(starterId, requestedDraftId) {
  let shelf = readDraftShelf();
  let document = shelf.drafts.find((draft) => draft.draft_id === requestedDraftId);
  if (!document && requestedDraftId) document = getActiveDraft(shelf);
  if (!document && !requestedDraftId && shelf.active_draft_id) document = getActiveDraft(shelf);
  if (!document || (starterId && document.starter_id !== starterId)) {
    try {
      const result = createDraft(shelf, starterId || 'ivory');
      shelf = result.shelf;
      document = result.draft;
      writeDraftShelf(shelf);
    } catch {
      document = getActiveDraft(shelf) || createCardDocument(starterId || 'ivory');
    }
  }
  return { shelf, document: normalizeCardDocument(document), recovered: Boolean(document) };
}

function editorReducer(state, action) {
  if (action.type === 'UNDO' && state.past.length) {
    return {
      ...state,
      past: state.past.slice(0, -1),
      present: state.past.at(-1),
      future: [state.present, ...state.future].slice(0, HISTORY_LIMIT),
    };
  }
  if (action.type === 'REDO' && state.future.length) {
    return {
      ...state,
      past: [...state.past, state.present].slice(-HISTORY_LIMIT),
      present: state.future[0],
      future: state.future.slice(1),
    };
  }
  if (action.type === 'APPLY') {
    if (action.document === state.present) return state;
    return {
      ...state,
      past: [...state.past, state.present].slice(-HISTORY_LIMIT),
      present: normalizeCardDocument(action.document),
      future: [],
    };
  }
  if (action.type === 'RESET') {
    return {
      ...state,
      past: [...state.past, state.present].slice(-HISTORY_LIMIT),
      present: createCardDocument(state.present.starter_id),
      future: [],
    };
  }
  return state;
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
      <input type={type} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function VisibilityToggle({ label, checked, onChange }) {
  return (
    <button className="hcs-visibility-toggle" type="button" aria-pressed={checked} onClick={() => onChange(!checked)}>
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
      const finder = (row < 3 && column < 3) || (row < 3 && column > 5) || (row > 5 && column < 3);
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
      {document.visibility.email && <span>{document.contact.email}</span>}
      {document.visibility.phone && <span>{document.contact.phone}</span>}
      {document.visibility.website && <span>{document.contact.website}</span>}
    </div>
  );
}

function ArtifactVisual({ layer }) {
  const artifact = CARD_ARTIFACT_BY_ID.get(layer.artifact_id);
  if (!artifact) return <span className="hcs-artifact-unknown">UNKNOWN</span>;
  if (artifact.kind === 'surface') return <span className={`hcs-artifact-surface is-${artifact.renderer_token.split('.')[1]}`} />;
  if (artifact.kind === 'divider') return <span className={`hcs-artifact-divider is-${artifact.renderer_token.split('.')[1]}`} />;
  if (artifact.kind === 'mark') return <span className={`hcs-artifact-mark is-${artifact.renderer_token.split('.')[1]}`}>H</span>;
  if (artifact.kind === 'badge') return <span className="hcs-artifact-badge">{artifact.name}</span>;
  if (artifact.kind === 'qr-frame') return <span className="hcs-artifact-frame">QR</span>;
  if (artifact.kind === 'nfc-frame') return <span className="hcs-artifact-nfc">)))</span>;
  return <span className="hcs-artifact-layout">{artifact.name}</span>;
}

function SemanticVisual({ layer, document }) {
  if (layer.kind === 'identity') {
    return (
      <div className="hcs-canvas-identity">
        <span>{document.identity.initials}</span>
        <strong>{document.identity.name}</strong>
        <small>{document.identity.role}</small>
        {document.visibility.tagline && <q>{document.identity.tagline}</q>}
      </div>
    );
  }
  if (layer.kind === 'contact') return <ContactRows document={document} />;
  if (layer.kind === 'profile') {
    return <div className="hcs-canvas-profile"><small>PUBLIC PROFILE</small><strong>{document.identity.name}</strong><span>{document.sharing.destination}</span></div>;
  }
  if (layer.kind === 'qr') return <QrPattern seed={document.sharing.destination || document.identity.name} />;
  return null;
}

function CanvasLayer({ layer, document, selected, disabled, gestureBounds, onSelect, onCommit }) {
  const [gesture, setGesture] = useState(null);
  const gestureRef = useRef(null);
  const writeGesture = (nextGesture) => {
    gestureRef.current = nextGesture;
    setGesture(nextGesture);
  };
  const live = gesture?.bounds || gestureBounds || layer;
  const pointerStart = (event, mode) => {
    if (disabled || layer.locked) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(layer.id);
    const parent = event.currentTarget.closest('.hcs-artboard');
    const rect = parent?.getBoundingClientRect();
    if (!rect) return;
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Some embedded/touch runtimes reject capture even though pointer events
      // continue. Geometry state must still start so the bounded drag works.
    }
    writeGesture({
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: { x: layer.x, y: layer.y, width: layer.width, height: layer.height },
      rect,
      bounds: { x: layer.x, y: layer.y, width: layer.width, height: layer.height },
    });
  };
  const pointerMove = (event) => {
    const currentGesture = gestureRef.current;
    if (!currentGesture || event.pointerId !== currentGesture.pointerId) return;
    const dx = (event.clientX - currentGesture.startX) / currentGesture.rect.width;
    const dy = (event.clientY - currentGesture.startY) / currentGesture.rect.height;
    const bounds = currentGesture.mode === 'resize'
      ? {
        ...currentGesture.origin,
        width: Math.min(1 - currentGesture.origin.x, Math.max(0.04, currentGesture.origin.width + dx)),
        height: Math.min(1 - currentGesture.origin.y, Math.max(0.04, currentGesture.origin.height + dy)),
      }
      : {
        ...currentGesture.origin,
        x: Math.min(1 - currentGesture.origin.width, Math.max(0, currentGesture.origin.x + dx)),
        y: Math.min(1 - currentGesture.origin.height, Math.max(0, currentGesture.origin.y + dy)),
      };
    writeGesture({ ...currentGesture, bounds });
  };
  const pointerEnd = (event) => {
    const currentGesture = gestureRef.current;
    if (!currentGesture || event.pointerId !== currentGesture.pointerId) return;
    onCommit(layer.id, currentGesture.bounds);
    writeGesture(null);
  };
  const keyboardNudge = (event) => {
    if (disabled || layer.locked || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const amount = event.shiftKey ? 0.05 : 0.01;
    const patch = {};
    if (event.key === 'ArrowLeft') patch.x = Math.max(0, layer.x - amount);
    if (event.key === 'ArrowRight') patch.x = Math.min(1 - layer.width, layer.x + amount);
    if (event.key === 'ArrowUp') patch.y = Math.max(0, layer.y - amount);
    if (event.key === 'ArrowDown') patch.y = Math.min(1 - layer.height, layer.y + amount);
    onCommit(layer.id, patch);
  };

  return (
    <div
      className={`hcs-canvas-layer is-${layer.kind}${selected ? ' is-selected' : ''}${layer.locked ? ' is-locked' : ''}`}
      data-artifact-kind={layer.kind === 'artifact' ? CARD_ARTIFACT_BY_ID.get(layer.artifact_id)?.kind : undefined}
      style={{ left: `${live.x * 100}%`, top: `${live.y * 100}%`, width: `${live.width * 100}%`, height: `${live.height * 100}%` }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${layer.label} layer${layer.locked ? ', locked' : ''}. Use arrow keys to move.`}
      aria-pressed={selected}
      onFocus={() => onSelect(layer.id)}
      onPointerDown={(event) => pointerStart(event, 'move')}
      onPointerMove={pointerMove}
      onPointerUp={pointerEnd}
      onPointerCancel={pointerEnd}
      onKeyDown={keyboardNudge}
    >
      {layer.kind === 'artifact' ? <ArtifactVisual layer={layer} /> : <SemanticVisual layer={layer} document={document} />}
      {selected && !disabled && !layer.locked && (
        <span
          className="hcs-resize-handle"
          aria-hidden="true"
          onPointerDown={(event) => pointerStart(event, 'resize')}
          onPointerMove={pointerMove}
          onPointerUp={pointerEnd}
          onPointerCancel={pointerEnd}
        />
      )}
    </div>
  );
}

function Artboard({ document, side, selectedLayerId, editing, overlays, onSelect, onCommit }) {
  const layers = document.layers.filter((layer) => layer.side === side && layer.visible);
  return (
    <div
      className={`hcs-artboard is-${side}`}
      style={{
        '--hcs-card-accent': document.style.accent,
        '--hcs-card-surface': document.style.surface,
        '--hcs-card-ink': document.style.ink,
        '--hcs-card-font': TYPE_OPTIONS.find((item) => item.id === document.style.typography)?.stack,
      }}
      aria-label={`${side} card artboard`}
    >
      {overlays.bleed && <div className="hcs-bleed-guide"><span>BLEED</span></div>}
      {overlays.safe && <div className="hcs-safe-guide"><span>SAFE</span></div>}
      {layers.map((layer) => (
        <CanvasLayer
          key={layer.id}
          layer={layer}
          document={document}
          selected={selectedLayerId === layer.id}
          disabled={!editing}
          onSelect={onSelect}
          onCommit={onCommit}
        />
      ))}
      <div className="hcs-card-signature">HYPERION · {side.toUpperCase()} · NOT PRODUCTION ART</div>
    </div>
  );
}

function DigitalProfile({ document }) {
  return (
    <div className="hcs-phone" aria-label="Digital profile preview">
      <div className="hcs-phone-status"><span>9:41</span><span>PROFILE PREVIEW</span></div>
      <div className="hcs-profile-hero" style={{ '--hcs-card-accent': document.style.accent }}>
        <span className="hcs-profile-avatar">{document.identity.initials}</span>
        <p>{document.identity.organization}</p>
        <h2>{document.identity.name}</h2>
        <p>{document.identity.role}</p>
        {document.visibility.tagline && <q>{document.identity.tagline}</q>}
      </div>
      <div className="hcs-profile-actions"><button type="button" disabled>Save contact</button><button type="button" disabled>Share profile</button></div>
      <ContactRows document={document} />
      <div className="hcs-profile-truth">Preview only · publishing requires operator review</div>
    </div>
  );
}

function BasicControls({ section, document, setField, setTemplate }) {
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
        <Field label="Template">
          <select value={document.template_id} onChange={(event) => setTemplate(event.target.value)}>
            {CARD_TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.lane}</option>)}
          </select>
        </Field>
        <Field label="Typography">
          <select value={document.style.typography} onChange={(event) => setField('style', 'typography', event.target.value)}>
            {TYPE_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Accent">
          <input type="color" value={document.style.accent} onChange={(event) => setField('style', 'accent', event.target.value.toUpperCase())} />
        </Field>
        <Field label={`Spacing · ${document.style.spacing}`}>
          <input type="range" min="18" max="82" value={document.style.spacing} onChange={(event) => setField('style', 'spacing', Number(event.target.value))} />
        </Field>
      </div>
    );
  }
  return (
    <div className="hcs-control-stack">
      <TextInput label="Profile path" value={document.sharing.profile_path} maxLength={80} onChange={(value) => setField('sharing', 'profile_path', value)} />
      <TextInput label="Destination" type="url" value={document.sharing.destination} maxLength={240} onChange={(value) => setField('sharing', 'destination', value)} />
      <Field label="Production notes" hint="No secrets, passwords, payment data, or medical records.">
        <textarea value={document.notes} maxLength={1200} onChange={(event) => setField('notes', null, event.target.value)} />
      </Field>
    </div>
  );
}

function LayerPanel({ document, apply, setSelected }) {
  const side = document.active_mode === 'back' ? 'back' : 'front';
  const layers = document.layers.filter((layer) => layer.side === side);
  const selected = document.layers.find((layer) => layer.id === document.selected_layer_id);
  const firstPlaceablePack = CARD_ARTIFACT_CATALOG.packs.find((candidate) => (
    CARD_ARTIFACT_CATALOG.items.some((item) => item.pack === candidate.id && item.kind !== 'palette')
  ));
  const [pack, setPack] = useState(firstPlaceablePack?.id ?? CARD_ARTIFACT_CATALOG.packs[0].id);
  const compatible = CARD_ARTIFACT_CATALOG.items.filter((item) => (
    item.pack === pack && item.kind !== 'palette' && item.compatible_sides.includes(side)
  ));
  const mutateSelected = (callback) => selected && apply(callback(document, selected.id));

  return (
    <div className="hcs-advanced-panel">
      <div className="hcs-layer-head"><span>Layers · {side}</span><small>{layers.length}/64</small></div>
      <div className="hcs-layer-list" role="list" aria-label={`${side} artboard layers`}>
        {[...layers].reverse().map((layer) => (
          <button
            key={layer.id}
            type="button"
            role="listitem"
            className={document.selected_layer_id === layer.id ? 'is-selected' : ''}
            onClick={() => setSelected(layer.id)}
          >
            <Grip size={13} />
            <span>{layer.label}</span>
            {layer.locked ? <Lock size={12} /> : null}
            {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        ))}
      </div>
      {selected && selected.side === side && (
        <div className="hcs-layer-tools" aria-label="Selected layer controls">
          <div>
            {['left', 'center', 'right', 'top', 'middle', 'bottom'].map((alignment) => (
              <button key={alignment} type="button" disabled={selected.locked} onClick={() => apply(alignLayer(document, selected.id, alignment))}>{alignment}</button>
            ))}
          </div>
          <div>
            <button type="button" onClick={() => apply(updateLayer(document, selected.id, { locked: !selected.locked }))}>
              {selected.locked ? <Unlock size={13} /> : <Lock size={13} />}{selected.locked ? 'Unlock' : 'Lock'}
            </button>
            <button type="button" onClick={() => apply(updateLayer(document, selected.id, { visible: !selected.visible }))}>
              {selected.visible ? <EyeOff size={13} /> : <Eye size={13} />}{selected.visible ? 'Hide' : 'Show'}
            </button>
            <button type="button" onClick={() => mutateSelected((doc, id) => reorderLayer(doc, id, 1))}>Forward</button>
            <button type="button" onClick={() => mutateSelected((doc, id) => reorderLayer(doc, id, -1))}>Back</button>
            {selected.kind === 'artifact' && (
              <button className="is-danger" type="button" onClick={() => apply(removeLayer(document, selected.id))}><Trash2 size={13} />Remove</button>
            )}
          </div>
          <dl>
            <div><dt>X</dt><dd>{selected.x.toFixed(2)}</dd></div>
            <div><dt>Y</dt><dd>{selected.y.toFixed(2)}</dd></div>
            <div><dt>W</dt><dd>{selected.width.toFixed(2)}</dd></div>
            <div><dt>H</dt><dd>{selected.height.toFixed(2)}</dd></div>
          </dl>
        </div>
      )}
      <div className="hcs-artifact-picker">
        <label>
          <span>Artifact pack</span>
          <select value={pack} onChange={(event) => setPack(event.target.value)}>
            {CARD_ARTIFACT_CATALOG.packs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <div>
          {compatible.map((item) => (
            <button key={item.id} type="button" onClick={() => apply(addArtifactLayer(document, item.id, side))}>
              <ArtifactVisual layer={{ artifact_id: item.id }} />
              <span>{item.name}</span>
              <PlusGlyph />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlusGlyph() {
  return <span className="hcs-plus-glyph" aria-hidden="true">+</span>;
}

function ProofSummary({ document, preflight, product, quantity }) {
  return (
    <section className="hcs-proof-summary" aria-labelledby="proof-summary-title">
      <div><span>Build profile</span><strong id="proof-summary-title">{stableFingerprint(document)}</strong></div>
      <dl>
        <div><dt>Draft</dt><dd>{document.draft_name}</dd></div>
        <div><dt>Template</dt><dd>{document.template_id}</dd></div>
        <div><dt>Revision</dt><dd>{document.revision}</dd></div>
        <div><dt>Layers</dt><dd>{document.layers.length}</dd></div>
        <div><dt>Status</dt><dd>{preflight.status}</dd></div>
        <div><dt>Product</dt><dd>{product.name} × {quantity}</dd></div>
        <div><dt>Commerce</dt><dd>NOT A QUOTE</dd></div>
      </dl>
    </section>
  );
}

export default function CardStudioEditor({ starterId = '' }) {
  const [searchParams] = useSearchParams();
  const requestedDraftId = searchParams.get('draft') || '';
  const initial = useMemo(() => initialDocument(starterId, requestedDraftId), [requestedDraftId, starterId]);
  const [history, dispatch] = useReducer(editorReducer, {
    past: [],
    present: initial.document,
    future: [],
  });
  const [, setShelf] = useState(initial.shelf);
  const [savedAt, setSavedAt] = useState(null);
  const [storageError, setStorageError] = useState(false);
  const [controlSection, setControlSection] = useState('identity');
  const [overlays, setOverlays] = useState({ safe: true, bleed: false });
  const [consent, setConsent] = useState(false);
  const [proofApproved, setProofApproved] = useState(false);
  const [productSku, setProductSku] = useState(CARD_CATALOG.items[0].sku);
  const [quantity, setQuantity] = useState(CARD_CATALOG.items[0].minimum_quantity);
  const [submission, setSubmission] = useState({ state: 'idle', message: '', checkoutUrl: '' });
  const document = history.present;
  const preflight = useMemo(() => evaluateCardPreflight(document), [document]);
  const selectedProduct = CARD_CATALOG.items.find((item) => item.sku === productSku) || CARD_CATALOG.items[0];
  const boundedQuantity = Math.min(selectedProduct.maximum_quantity, Math.max(selectedProduct.minimum_quantity, Number(quantity) || selectedProduct.minimum_quantity));

  const apply = useCallback((next) => dispatch({ type: 'APPLY', document: next }), []);
  const setField = useCallback((section, key, value) => apply(updateDocumentPath(document, section, key, value)), [apply, document]);
  const setSelected = useCallback((layerId) => {
    if (document.selected_layer_id !== layerId) apply(updateDocumentPath(document, 'selected_layer_id', null, layerId));
  }, [apply, document]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setShelf((current) => {
        const next = saveDraft(current, document);
        if (writeDraftShelf(next)) {
          setSavedAt(new Date());
          setStorageError(false);
        } else {
          setStorageError(true);
        }
        return next;
      });
    }, 260);
    return () => window.clearTimeout(timeout);
  }, [document]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? 'REDO' : 'UNDO' });
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        dispatch({ type: 'REDO' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const setCanvasSide = (side) => {
    const first = document.layers.find((layer) => layer.side === side && layer.visible);
    let next = updateDocumentPath(document, 'active_mode', null, side);
    if (first) next.selected_layer_id = first.id;
    apply(next);
  };

  const submitBrief = async () => {
    setSubmission({ state: 'submitting', message: 'Creating an immutable review proposal…', checkoutUrl: '' });
    try {
      const result = await submitCardStudioBrief(document, {
        consent,
        proofApproved,
        productSku,
        quantity: boundedQuantity,
      });
      setSubmission({
        state: 'submitted',
        checkoutUrl: result.checkout?.url || '',
        message: `Proposal ${result.reference} is held for review. ${result.receipt?.eligibility === 'instant_checkout_eligible' ? 'An operator may release checkout later.' : 'No checkout or payment was created.'}`,
      });
    } catch (error) {
      const staged = error.status === 404 || error.status === 501 || error.status === 503;
      setSubmission({
        state: 'error',
        checkoutUrl: '',
        message: staged
          ? 'Your draft is saved on this device. The review lane is not accepting submissions right now.'
          : error.message || 'The brief could not be staged. Your local draft is safe.',
      });
    }
  };

  const refreshOrderStatus = async () => {
    setSubmission((value) => ({ ...value, state: 'submitting', message: 'Refreshing the durable order projection…' }));
    try {
      const result = await getCardStudioOrderStatus();
      const checkoutUrl = result.order?.checkout_projection?.checkout_url || '';
      setSubmission({
        state: 'submitted',
        message: `Proposal status: ${String(result.order?.status || 'pending').replaceAll('_', ' ')}. ${checkoutUrl ? 'Operator-released checkout is ready.' : 'No checkout or payment has been created.'}`,
        checkoutUrl,
      });
    } catch {
      setSubmission({ state: 'error', message: 'Order status is unavailable in this tab. The durable proposal remains in operator review.', checkoutUrl: '' });
    }
  };

  return (
    <div className="hcs-editor">
      <section className="hcs-editor-header" aria-labelledby="card-studio-title">
        <div>
          <Link to="/card-studio" className="hcs-back-link"><ArrowLeft size={15} /> Card Studio library</Link>
          <p className="hcs-kicker">HYPERION IDENTITY FABRICATION · PUBLIC DESIGN HANDOFF</p>
          <h1 id="card-studio-title">Compose the signal.<br /><span>Keep authority visible.</span></h1>
          <p>Design freely on this device. Submission is public, immutable, held for operator review, and never a quote.</p>
        </div>
        <div className="hcs-status-stack" aria-label="Studio posture">
          <span data-tone={preflight.ready ? 'ready' : 'draft'}>{preflight.status}</span>
          <span data-tone="review">HELD FOR REVIEW</span>
          <span>NOT A QUOTE</span>
        </div>
      </section>

      <div className="hcs-recovery-banner" role="status">
        <Save size={16} />
        {storageError
          ? 'Local autosave is unavailable in this browser. Keep this tab open or copy your details before leaving; nothing has been submitted.'
          : `Editing “${document.draft_name}” · revision ${document.revision}. Autosave is device-local; nothing is submitted.`}
      </div>

      <section className="hcs-mode-panel">
        <div>
          <p>01 · Workspace</p>
          <h2>{document.editor_mode === 'basic' ? 'Guided field editor' : 'Bounded layout designer'}</h2>
        </div>
        <div className="hcs-editor-mode-switch" role="tablist" aria-label="Editor complexity">
          {['basic', 'advanced'].map((mode) => (
            <button key={mode} type="button" role="tab" aria-selected={document.editor_mode === mode} onClick={() => setField('editor_mode', null, mode)}>
              {mode === 'basic' ? 'Basic' : 'Advanced'}
            </button>
          ))}
        </div>
      </section>

      <div className={`hcs-workspace is-${document.editor_mode}`}>
        <aside className="hcs-controls" aria-label={document.editor_mode === 'basic' ? 'Card controls' : 'Layers and artifacts'}>
          {document.editor_mode === 'basic' ? (
            <>
              <div className="hcs-control-tabs" role="tablist" aria-label="Editing controls">
                {CONTROL_SECTIONS.map((section) => (
                  <button key={section.id} type="button" role="tab" aria-selected={controlSection === section.id} onClick={() => setControlSection(section.id)}>
                    {section.label}
                  </button>
                ))}
              </div>
              <div className="hcs-control-body" role="tabpanel">
                <BasicControls
                  section={controlSection}
                  document={document}
                  setField={setField}
                  setTemplate={(id) => apply(applyCardTemplate(document, id))}
                />
              </div>
            </>
          ) : <LayerPanel document={document} apply={apply} setSelected={setSelected} />}
        </aside>

        <section className="hcs-stage" aria-labelledby="proof-heading">
          <div className="hcs-stage-toolbar">
            <div className="hcs-mode-switch" role="tablist" aria-label="Proof mode">
              <button type="button" role="tab" aria-selected={document.active_mode === 'front'} onClick={() => setCanvasSide('front')}><Layers3 size={14} />Front</button>
              <button type="button" role="tab" aria-selected={document.active_mode === 'back'} onClick={() => setCanvasSide('back')}><RotateCcw size={14} />Back</button>
              <button type="button" role="tab" aria-selected={document.active_mode === 'digital'} onClick={() => setField('active_mode', null, 'digital')}><Smartphone size={14} />Digital</button>
            </div>
            <div className="hcs-history-controls">
              <button type="button" disabled={!history.past.length} onClick={() => dispatch({ type: 'UNDO' })} aria-label="Undo last edit"><Undo2 size={16} /></button>
              <button type="button" disabled={!history.future.length} onClick={() => dispatch({ type: 'REDO' })} aria-label="Redo edit"><Redo2 size={16} /></button>
            </div>
            <div className="hcs-order-chip"><span>{selectedProduct.name}</span><strong>× {boundedQuantity}</strong><small>NOT A QUOTE</small></div>
          </div>
          <div className="hcs-stage-heading">
            <div><p>02 · Live proof</p><h2 id="proof-heading">{document.active_mode === 'digital' ? 'Digital profile' : `${document.active_mode} artboard`}</h2></div>
            <div className="hcs-overlay-controls">
              <button type="button" aria-pressed={overlays.safe} onClick={() => setOverlays((value) => ({ ...value, safe: !value.safe }))}>Safe area</button>
              <button type="button" aria-pressed={overlays.bleed} onClick={() => setOverlays((value) => ({ ...value, bleed: !value.bleed }))}>Bleed</button>
            </div>
          </div>
          <div className="hcs-proof-deck" data-material={selectedProduct.production_profile}>
            {document.active_mode === 'digital' ? <DigitalProfile document={document} /> : (
              <Artboard
                document={document}
                side={document.active_mode}
                selectedLayerId={document.selected_layer_id}
                editing={document.editor_mode === 'advanced'}
                overlays={overlays}
                onSelect={setSelected}
                onCommit={(id, patch) => apply(updateLayer(document, id, patch))}
              />
            )}
          </div>
          {document.editor_mode === 'advanced' && document.active_mode !== 'digital' && (
            <p className="hcs-canvas-help"><Maximize2 size={13} /> Drag to move, use the corner handle to resize, or nudge with Arrow keys. Hold Shift for larger keyboard steps.</p>
          )}
          <div className="hcs-local-save" aria-live="polite">
            <Save size={14} />{storageError
              ? 'Local autosave unavailable'
              : savedAt
                ? `Saved locally ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Preparing local save'}
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
          {preflight.blockers.map((item) => <div className="hcs-preflight-item is-blocker" key={item}><CircleAlert size={17} /><span>{item}</span></div>)}
          {preflight.warnings.map((item) => <div className="hcs-preflight-item is-warning" key={item}><CircleAlert size={17} /><span>{item}</span></div>)}
        </section>
        <ProofSummary document={document} preflight={preflight} product={selectedProduct} quantity={boundedQuantity} />
      </div>

      <section className="hcs-submit-panel" aria-labelledby="submit-heading">
        <div>
          <p>04 · Operator handoff</p>
          <h2 id="submit-heading">Stage the design and order intent</h2>
          <p>This creates an immutable review proposal. It does not publish a profile, generate production artwork, charge a card, reserve a price, or create checkout.</p>
          <ConciergeNarration cue="card-checkout" compact />
        </div>
        <div className="hcs-submit-actions">
          <div className="hcs-order-fields">
            <Field label="Product">
              <select value={productSku} onChange={(event) => {
                const nextSku = event.target.value;
                const nextProduct = CARD_CATALOG.items.find((item) => item.sku === nextSku);
                setProductSku(nextSku);
                setQuantity(nextProduct?.minimum_quantity || 1);
                setSubmission({ state: 'idle', message: '', checkoutUrl: '' });
              }}>
                {CARD_CATALOG.items.map((item) => <option key={item.sku} value={item.sku}>{item.name}{item.unit_amount == null ? ' · REVIEW' : ` · $${(item.unit_amount / 100).toFixed(0)}`}</option>)}
              </select>
            </Field>
            <Field label="Quantity" hint={`${selectedProduct.minimum_quantity}–${selectedProduct.maximum_quantity} in this lane`}>
              <input type="number" min={selectedProduct.minimum_quantity} max={selectedProduct.maximum_quantity} value={quantity} onChange={(event) => setQuantity(event.target.value)} onBlur={() => setQuantity(boundedQuantity)} />
            </Field>
          </div>
          <div className="hcs-commerce-posture" role="note">
            <span>{selectedProduct.checkout_mode === 'fixed_checkout' ? 'FIXED-SKU LANE' : 'REVIEW LANE'}</span>
            <strong>{selectedProduct.unit_amount == null ? 'CUSTOM ESTIMATE' : `$${(selectedProduct.unit_amount / 100).toFixed(2)} CATALOG ESTIMATE`}</strong>
            <small>NOT A QUOTE · CHECKOUT REQUIRES OPERATOR RELEASE</small>
          </div>
          <label className="hcs-consent"><input type="checkbox" checked={proofApproved} onChange={(event) => setProofApproved(event.target.checked)} /><span>I reviewed the front, back, and digital proof and approve this revision for production review. This is not approval of a charge.</span></label>
          <label className="hcs-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I understand the selected visible fields are intended for a public identity surface and require operator review before publication.</span></label>
          <button className="hcs-submit-button" type="button" disabled={!preflight.ready || !consent || !proofApproved || submission.state === 'submitting'} onClick={submitBrief}>
            {submission.state === 'submitting' ? 'Staging brief…' : 'Stage for review'} <Send size={16} />
          </button>
          {submission.message && <p className={`hcs-submit-message is-${submission.state}`} role={submission.state === 'error' ? 'alert' : 'status'}>{submission.message}</p>}
          {submission.checkoutUrl && <a className="hcs-checkout-link" href={submission.checkoutUrl} rel="nofollow noopener">Continue to secure provider checkout <ChevronRight size={14} /></a>}
          {submission.state === 'submitted' && <button className="hcs-status-button" type="button" onClick={refreshOrderStatus}>Refresh proposal status</button>}
          <button className="hcs-reset-button" type="button" onClick={() => dispatch({ type: 'RESET' })}>Reset from starter <ChevronRight size={14} /></button>
        </div>
      </section>
    </div>
  );
}
