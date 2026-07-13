import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import RoomShell from '../components/portal/RoomShell';
import Carousel3D from '../components/ui/Carousel3D';
import HoverEditor from '../components/ui/HoverEditor';
import MediaFrame from '../components/ui/MediaFrame';
import { mediaSource } from '../utils/media';
import content from '../data/content.json';
import showcaseData from '../data/showcase.json';
import './SubPage.css';

const isDev = import.meta.env.DEV;

/* ── Inline Build Manager (dev-only) ─────────────────────────── */
function BuildManager({ onItemsChange }) {
  const [items, setItems] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploadingField, setUploadingField] = useState(null);
  const [specsStr, setSpecsStr] = useState('');

  const reload = useCallback(() => {
    fetch('/api/data/showcase')
      .then(r => r.json())
      .then((data) => {
        setItems(data);
        onItemsChange?.(data);
      })
      .catch(() => setItems([]));
  }, [onItemsChange]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (selected !== null && items && items[selected]) {
      setSpecsStr(items[selected].specs.join(', '));
    }
  }, [selected, items]);

  if (!items) return <div style={{ color: 'rgba(255,255,255,0.3)', padding: '60px', textAlign: 'center' }}>Loading build data…</div>;

  const flash = (text, ms = 3500) => { setMsg(text); setTimeout(() => setMsg(''), ms); };

  /* — persist helpers — */
  const saveAndPublish = async (updatedItems) => {
    setSaving(true);
    setMsg('');
    try {
      const saveRes = await fetch('/api/data/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItems, null, 2),
      });
      if (!saveRes.ok) throw new Error('Local save failed.');

      const commitRes = await fetch('/api/commit', { method: 'POST' });
      const commitResult = await commitRes.json();
      if (!commitResult.success) throw new Error(commitResult.error || 'Git push failed.');

      flash('✓ Published to live site.');
      reload();
    } catch (err) {
      flash(`⚠️ ${err.message}`);
    }
    setSaving(false);
  };

  const saveDraft = async (updatedItems) => {
    try {
      await fetch('/api/data/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItems, null, 2),
      });
      flash('Draft saved locally.');
    } catch { flash('⚠️ Draft save failed.'); }
  };

  /* — item CRUD — */
  const addItem = () => {
    const newItem = {
      codename: 'NEW BUILD',
      generation: 'Gen 2026',
      hardwareClass: 'Uncategorized',
      status: 'Draft',
      image: '',
      focalX: '50%',
      focalY: '50%',
      fit: 'cover',
      specs: ['Spec 1', 'Spec 2', 'Spec 3'],
      description: 'Describe this build…',
    };
    const updated = [newItem, ...items];
    setItems(updated);
    onItemsChange?.(updated);
    setSelected(0);
    saveDraft(updated);
  };

  const deleteItem = (idx) => {
    if (!window.confirm(`Delete "${items[idx].codename}"?`)) return;
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    onItemsChange?.(updated);
    setSelected(null);
    saveDraft(updated);
  };

  const moveItem = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const updated = [...items];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    setItems(updated);
    onItemsChange?.(updated);
    setSelected(target);
    saveDraft(updated);
  };

  const updateField = (idx, key, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [key]: value };
    setItems(updated);
    onItemsChange?.(updated);
  };

  const handleImageUpload = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingField(idx);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, data: reader.result }),
        });
        if (res.ok) {
          const result = await res.json();
          updateField(idx, 'image', result.path);
        }
      } catch (err) { console.error(err); }
      setUploadingField(null);
    };
    reader.readAsDataURL(file);
  };

  const current = selected !== null ? items[selected] : null;

  /* ── field styling tokens ── */
  const labelSt = { display: 'block', fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '6px', fontWeight: 700 };
  const inputSt = { width: '100%', background: 'var(--chip-bg)', border: '1px solid var(--border-soft)', borderRadius: '6px', color: 'var(--text)', padding: '9px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
  const textareaSt = { ...inputSt, lineHeight: '1.5', resize: 'vertical' };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gap: 0,
      background: 'var(--surface-up)',
      border: '1px solid var(--border-gold)',
      borderRadius: '14px',
      overflow: 'hidden',
      maxHeight: '72vh',
      boxShadow: 'var(--shadow-card)',
    }}>
      {/* — sidebar list — */}
      <div style={{ borderRight: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Builds ({items.length})</span>
          <button onClick={addItem} style={{ background: 'rgba(33,214,232,0.12)', color: '#21d6e8', border: '1px solid rgba(33,214,232,0.25)', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>+ Add</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
          {items.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setSelected(idx)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: selected === idx ? 'rgba(255,199,44,0.08)' : 'transparent',
                borderLeft: selected === idx ? '3px solid #ffc72c' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {mediaSource(item.image) && <MediaFrame media={item.image} alt="" compact className="ed-thumb-frame" />}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.codename}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.generation} · {item.hardwareClass}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* footer actions */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => saveAndPublish(items)}
            disabled={saving}
            style={{ width: '100%', padding: '10px', background: '#ffc72c', border: 'none', color: '#000', borderRadius: '6px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' }}
          >
            {saving ? 'Publishing…' : 'Save & Publish All →'}
          </button>
          {msg && <div style={{ fontSize: '10px', color: msg.startsWith('⚠') ? '#ff5555' : '#21d6e8', fontFamily: 'monospace', textAlign: 'center' }}>{msg}</div>}
        </div>
      </div>

      {/* — detail editor — */}
      <div style={{ padding: '28px 32px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {current ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.04em' }}>
                <span style={{ color: 'var(--gold)' }}>#{selected + 1}</span> {current.codename}
              </h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => saveAndPublish(items)} disabled={saving} title="Save & Publish" style={{ background: 'var(--gold)', border: 'none', color: '#000', borderRadius: '4px', padding: '0 12px', cursor: 'pointer', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>{saving ? '...' : 'Save'}</button>
                <button onClick={() => moveItem(selected, -1)} disabled={selected === 0} title="Move up" style={{ background: 'var(--chip-bg)', border: '1px solid var(--border-soft)', color: 'var(--text)', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '12px' }}>↑</button>
                <button onClick={() => moveItem(selected, 1)} disabled={selected === items.length - 1} title="Move down" style={{ background: 'var(--chip-bg)', border: '1px solid var(--border-soft)', color: 'var(--text)', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '12px' }}>↓</button>
                <button onClick={() => deleteItem(selected)} title="Delete" style={{ background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.25)', color: '#ff5555', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px' }}>×</button>
              </div>
            </div>

            {/* image section */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelSt}>Build Photo</label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '160px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', flexShrink: 0 }}>
                  {current.image ? (
                    <MediaFrame media={current.image} alt="" compact />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '11px' }}>No image</div>
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" value={mediaSource(current.image)} onChange={(e) => updateField(selected, 'image', e.target.value)} placeholder="/assets/builds/photo.jpg" style={inputSt} />
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: 'rgba(255,199,44,0.1)', border: '1px solid rgba(255,199,44,0.2)', color: '#ffc72c', borderRadius: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', alignSelf: 'flex-start' }}>
                    {uploadingField === selected ? 'Uploading…' : '↑ Upload Media'}
                    <input type="file" accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, selected)} disabled={uploadingField === selected} />
                  </label>
                  {/* focal point controls */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    <div><label style={labelSt}>Focal X</label><input type="text" value={current.focalX} onChange={(e) => updateField(selected, 'focalX', e.target.value)} style={inputSt} /></div>
                    <div><label style={labelSt}>Focal Y</label><input type="text" value={current.focalY} onChange={(e) => updateField(selected, 'focalY', e.target.value)} style={inputSt} /></div>
                    <div><label style={labelSt}>Fit</label>
                      <select value={current.fit} onChange={(e) => updateField(selected, 'fit', e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                        <option value="cover">cover</option>
                        <option value="contain">contain</option>
                        <option value="fill">fill</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* text fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div><label style={labelSt}>Codename</label><input type="text" value={current.codename} onChange={(e) => updateField(selected, 'codename', e.target.value)} style={inputSt} /></div>
              <div><label style={labelSt}>Generation</label><input type="text" value={current.generation} onChange={(e) => updateField(selected, 'generation', e.target.value)} style={inputSt} /></div>
              <div><label style={labelSt}>Hardware Class</label><input type="text" value={current.hardwareClass} onChange={(e) => updateField(selected, 'hardwareClass', e.target.value)} style={inputSt} /></div>
              <div><label style={labelSt}>Status</label><input type="text" value={current.status} onChange={(e) => updateField(selected, 'status', e.target.value)} style={inputSt} /></div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelSt}>Spec Tags (comma separated)</label>
              <input type="text" value={specsStr} onChange={(e) => setSpecsStr(e.target.value)} onBlur={() => updateField(selected, 'specs', specsStr.split(',').map(s => s.trim()).filter(Boolean))} style={inputSt} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelSt}>Description</label>
              <textarea value={current.description} onChange={(e) => updateField(selected, 'description', e.target.value)} rows={3} style={textareaSt} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.4 }}>⚙</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Select a build to edit</div>
            <div style={{ fontSize: '11px', marginTop: '6px', opacity: 0.5 }}>or click "+ Add" to create a new entry</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function BuildArchivePage() {
  const [showcaseItems, setShowcaseItems] = useState(showcaseData);

  useEffect(() => {
    if (!isDev) return;
    fetch('/api/data/showcase')
      .then((response) => response.json())
      .then(setShowcaseItems)
      .catch(() => setShowcaseItems(showcaseData));
  }, []);

  const panels = {
    browse: <div className="archive-room-carousel"><Carousel3D items={showcaseItems} /></div>,
    posture: (
      <div className="room-panel-grid"><div className="room-panel-copy"><span className="sp-label">Public build record</span><h2>{content.buildarchive.footer.title}</h2><p>{content.buildarchive.footer.desc}</p></div><div className="room-note-grid archive-posture-notes"><article className="room-note"><span>01</span><h3>Artifact</h3><p>Completed builds remain visible as proof of fabrication and handoff.</p></article><article className="room-note"><span>02</span><h3>Boundary</h3><p>Client records, private specifications, and internal work state remain excluded.</p></article></div></div>
    ),
    inquiry: (
      <div className="room-panel-grid"><div className="room-panel-copy"><h2>Build around the workload.</h2><p>Share what the machine has to do, where it will live, the timing, and the support reality.</p><div className="room-action-row"><Link to="/forge" className="btn btn-ghost">Enter the Forge</Link><a href="mailto:forge@hyperion-industries.dev?subject=Build%20Inquiry" className="btn btn-gold">Start Inquiry</a></div></div></div>
    ),
  };

  return (
    <PageShell>
      <HoverEditor model="content">
        <RoomShell eyebrow="Public Record / Forge" title="Build Archive" summary={content.buildarchive.hero.lead} status="PUBLIC ARCHIVE" tone="inquiry" stations={[{ id: 'browse', label: 'Browse' }, { id: 'posture', label: 'Posture' }, { id: 'inquiry', label: 'Inquiry' }]} panels={panels} defaultStation="browse" className="archive-room-shell" />
      </HoverEditor>

      {/* Dev-only inline build manager */}
      {isDev && (
        <section className="section dev-room-manager">
          <div className="shell">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-display)' }}>Build Manager</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-gold)' }} />
            </div>
            <BuildManager onItemsChange={setShowcaseItems} />
          </div>
        </section>
      )}

    </PageShell>
  );
}
