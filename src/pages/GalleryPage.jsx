import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import RoomShell from '../components/portal/RoomShell';
import './SubPage.css';
import './GalleryPage.css';

import HoverEditor from '../components/ui/HoverEditor';
import galleryAssets from '../../site-content/collections/gallery.json';
import content from '../../site-content/collections/content.json';
import MediaFrame from '../components/ui/MediaFrame';
import { mediaSource } from '../utils/media';

const isDev = import.meta.env.DEV;

/* ── Inline Gallery Manager (dev-only) ─────────────────────────── */
function GalleryManager({ onItemsChange }) {
  const [items, setItems] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploadingField, setUploadingField] = useState(null);

  const reload = useCallback(() => {
    fetch('/api/data/gallery')
      .then(r => r.json())
      .then((data) => {
        setItems(data);
        onItemsChange?.(data);
      })
      .catch(() => setItems([]));
  }, [onItemsChange]);

  useEffect(() => { reload(); }, [reload]);

  if (!items) return <div style={{ color: 'rgba(255,255,255,0.3)', padding: '60px', textAlign: 'center' }}>Loading gallery data…</div>;

  const flash = (text, ms = 3500) => { setMsg(text); setTimeout(() => setMsg(''), ms); };

  const saveAndPublish = async (updatedItems) => {
    setSaving(true);
    setMsg('');
    try {
      const saveRes = await fetch('/api/data/gallery', {
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
      await fetch('/api/data/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItems, null, 2),
      });
      flash('Draft saved locally.');
    } catch { flash('⚠️ Draft save failed.'); }
  };

  const addItem = () => {
    const newItem = { src: '', label: 'New Asset', desc: 'Description…', type: 'Portraits' };
    const updated = [newItem, ...items];
    setItems(updated);
    onItemsChange?.(updated);
    setSelected(0);
    saveDraft(updated);
  };

  const deleteItem = (idx) => {
    if (!window.confirm(`Delete "${items[idx].label}"?`)) return;
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
          updateField(idx, 'src', result.path);
        }
      } catch (err) { console.error(err); }
      setUploadingField(null);
    };
    reader.readAsDataURL(file);
  };

  const current = selected !== null ? items[selected] : null;

  const labelSt = { display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '6px', fontWeight: 700 };
  const inputSt = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', padding: '9px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0,
      background: '#0a0c10', border: '1px solid rgba(255,199,44,0.12)', borderRadius: '14px',
      overflow: 'hidden', maxHeight: '72vh', boxShadow: '0 32px 80px rgba(0,0,0,0.6)'
    }}>
      <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffc72c', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Gallery ({items.length})</span>
          <button onClick={addItem} style={{ background: 'rgba(33,214,232,0.12)', color: '#21d6e8', border: '1px solid rgba(33,214,232,0.25)', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}>+ Add</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
          {items.map((item, idx) => (
            <div key={idx} onClick={() => setSelected(idx)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', background: selected === idx ? 'rgba(255,199,44,0.08)' : 'transparent', borderLeft: selected === idx ? '3px solid #ffc72c' : '3px solid transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {mediaSource(item.src || item) && <MediaFrame media={item.src || item} compact alt="" className="ed-thumb-frame" />}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{item.type}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => saveAndPublish(items)} disabled={saving} style={{ width: '100%', padding: '10px', background: '#ffc72c', border: 'none', color: '#000', borderRadius: '6px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>{saving ? 'Publishing…' : 'Save & Publish All →'}</button>
          {msg && <div style={{ fontSize: '10px', color: msg.startsWith('⚠') ? '#ff5555' : '#21d6e8', fontFamily: 'monospace', textAlign: 'center' }}>{msg}</div>}
        </div>
      </div>
      <div style={{ padding: '28px 32px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {current ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#fff' }}><span style={{ color: '#ffc72c' }}>#{selected + 1}</span> {current.label}</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => moveItem(selected, -1)} disabled={selected === 0} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer' }}>↑</button>
                <button onClick={() => moveItem(selected, 1)} disabled={selected === items.length - 1} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer' }}>↓</button>
                <button onClick={() => deleteItem(selected)} style={{ background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.25)', color: '#ff5555', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer' }}>×</button>
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelSt}>Asset File</label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', flexShrink: 0 }}>
                  {current.src ? <MediaFrame media={current.src} compact alt="" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '11px' }}>No media</div>}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" value={mediaSource(current.src)} onChange={(e) => updateField(selected, 'src', e.target.value)} style={inputSt} />
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: 'rgba(255,199,44,0.1)', border: '1px solid rgba(255,199,44,0.2)', color: '#ffc72c', borderRadius: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', alignSelf: 'flex-start' }}>
                    {uploadingField === selected ? 'Uploading…' : '↑ Upload Media'}
                    <input type="file" accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, selected)} disabled={uploadingField === selected} />
                  </label>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div><label style={labelSt}>Label</label><input type="text" value={current.label} onChange={(e) => updateField(selected, 'label', e.target.value)} style={inputSt} /></div>
              <div><label style={labelSt}>Type</label>
                <select value={current.type} onChange={(e) => updateField(selected, 'type', e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                  <option value="Portraits">Portraits</option>
                  <option value="Cards">Cards</option>
                  <option value="References">References</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelSt}>Description</label>
              <textarea value={current.desc} onChange={(e) => updateField(selected, 'desc', e.target.value)} rows={3} style={{ ...inputSt, lineHeight: '1.5', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" checked={current.reference || false} onChange={(e) => updateField(selected, 'reference', e.target.checked)} id="isRef" />
              <label htmlFor="isRef" style={{ fontSize: '13px', color: '#fff', cursor: 'pointer' }}>Treat as Reference Sheet</label>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.4 }}>⚙</div><div style={{ fontSize: '13px', fontWeight: 600 }}>Select an asset</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function GalleryPage() {
  const [filter, setFilter] = useState('All');
  const [assets, setAssets] = useState(galleryAssets);

  useEffect(() => {
    if (!isDev) return;
    fetch('/api/data/gallery')
      .then((response) => response.json())
      .then(setAssets)
      .catch(() => setAssets(galleryAssets));
  }, []);

  const filteredAssets = filter === 'All' ? assets : assets.filter(a => a.type === filter);

  const panels = {
    featured: (
      <div className="gallery-room-featured">
        <MediaFrame media={content.gallery.operatorHero.image} alt="Hyperion operator visual" className="gallery-operator-media" />
        <div className="gallery-room-caption"><span className="sp-label">Completed asset</span><h2>{content.gallery.operatorHero.title}</h2><p>{content.gallery.operatorHero.desc}</p></div>
      </div>
    ),
    browse: (
      <div className="gallery-room-browser">
        <div className="gallery-room-filter" role="group" aria-label="Filter gallery assets">
          {['All', 'Portraits', 'Cards', 'References'].map((value) => <button key={value} type="button" className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>{value}</button>)}
        </div>
        <div className="gallery-asset-grid">
          {filteredAssets.map((asset, index) => (
            <article key={`${asset.label}-${index}`} className={`gallery-asset-card${asset.reference ? ' reference' : ''}`}>
              <MediaFrame media={asset.src || asset} alt={asset.label} />
              <div className="gallery-asset-overlay" />
              <div className="gallery-asset-label"><strong>{asset.label}</strong><span>{asset.desc}</span></div>
            </article>
          ))}
        </div>
      </div>
    ),
    proof: (
      <div className="gallery-room-proof"><div className="sp-media-strip"><MediaFrame media={content.gallery.mediaStrip.image1} alt="Wide Hyperion brand plate" /><MediaFrame media={content.gallery.mediaStrip.image2} alt="Circular Hyperion avatar asset" /></div><div className="room-panel-copy"><h2>Public-safe artifacts only.</h2><p>Images in this room are approved public assets. Internal screenshots, client state, and private product surfaces stay outside the gallery.</p></div></div>
    ),
    next: (
      <div className="room-panel-grid"><div className="room-panel-copy"><h2>Follow the artifact to the work.</h2><p>Build proof lives in the Archive. Fabrication requests route through the Forge.</p><div className="room-action-row"><Link to="/build-archive" className="btn btn-gold">Open Build Archive</Link><Link to="/forge" className="btn btn-ghost">Enter the Forge</Link></div></div></div>
    ),
  };

  return (
    <PageShell>
      <HoverEditor model="content">
        <RoomShell eyebrow="Public Record / Gallery" title="Gallery" summary={content.gallery.hero.lead} status="PUBLIC ARCHIVE" tone="map" stations={[{ id: 'featured', label: 'Featured' }, { id: 'browse', label: 'Browse' }, { id: 'proof', label: 'Proof' }, { id: 'next', label: 'Next' }]} panels={panels} defaultStation="featured" className="gallery-room-shell" />
      </HoverEditor>

      {/* Dev-only inline gallery manager */}
      {isDev && (
        <section className="section dev-room-manager">
          <div className="shell">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffc72c', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-display)' }}>Gallery Manager</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,199,44,0.15)' }} />
            </div>
            <GalleryManager onItemsChange={setAssets} />
          </div>
        </section>
      )}
    </PageShell>
  );
}
