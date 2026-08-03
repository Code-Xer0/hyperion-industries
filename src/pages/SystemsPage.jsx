import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import RoomShell from '../components/portal/RoomShell';
import systems from '../../site-content/collections/systems.json';
import content from '../../site-content/collections/content.json';
import './SubPage.css';
import HoverEditor from '../components/ui/HoverEditor';
import { useState, useEffect, useCallback } from 'react';
import { PUBLIC_DOCTRINE } from '../data/publicDoctrine';

const isDev = import.meta.env.DEV;

/* ── Inline Systems Manager (dev-only) ─────────────────────────── */
function SystemsManager() {
  const [items, setItems] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploadingField, setUploadingField] = useState(null);

  const reload = useCallback(() => {
    fetch('/api/data/systems')
      .then(r => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  if (!items) return <div style={{ color: 'rgba(255,255,255,0.3)', padding: '60px', textAlign: 'center' }}>Loading systems data…</div>;

  const flash = (text, ms = 3500) => { setMsg(text); setTimeout(() => setMsg(''), ms); };

  const saveAndPublish = async (updatedItems) => {
    setSaving(true);
    setMsg('');
    try {
      const saveRes = await fetch('/api/data/systems', {
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
      await fetch('/api/data/systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItems, null, 2),
      });
      flash('Draft saved locally.');
    } catch { flash('⚠️ Draft save failed.'); }
  };

  const addItem = () => {
    const newItem = { id: `sys-${Date.now()}`, code: 'OS — XX', name: 'New System', tagline: 'Engine', description: 'Describe system...', status: 'concept', statusLabel: 'Research', link: null, linkLabel: null, icon: '', color: 'gray', chips: [] };
    const updated = [newItem, ...items];
    setItems(updated);
    setSelected(0);
    saveDraft(updated);
  };

  const deleteItem = (idx) => {
    if (!window.confirm(`Delete "${items[idx].name}"?`)) return;
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    setSelected(null);
    saveDraft(updated);
  };

  const moveItem = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const updated = [...items];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    setItems(updated);
    setSelected(target);
    saveDraft(updated);
  };

  const updateField = (idx, key, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [key]: value };
    setItems(updated);
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
          updateField(idx, 'icon', result.path);
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
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffc72c', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Systems ({items.length})</span>
          <button onClick={addItem} style={{ background: 'rgba(33,214,232,0.12)', color: '#21d6e8', border: '1px solid rgba(33,214,232,0.25)', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}>+ Add</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
          {items.map((item, idx) => (
            <div key={idx} onClick={() => setSelected(idx)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', background: selected === idx ? 'rgba(255,199,44,0.08)' : 'transparent', borderLeft: selected === idx ? '3px solid #ffc72c' : '3px solid transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.icon && <img src={item.icon} alt="" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }} />}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{item.tagline}</div>
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
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#fff' }}><span style={{ color: '#ffc72c' }}>#{selected + 1}</span> {current.name}</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => moveItem(selected, -1)} disabled={selected === 0} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer' }}>↑</button>
                <button onClick={() => moveItem(selected, 1)} disabled={selected === items.length - 1} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer' }}>↓</button>
                <button onClick={() => deleteItem(selected)} style={{ background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.25)', color: '#ff5555', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer' }}>×</button>
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelSt}>Icon</label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', flexShrink: 0 }}>
                  {current.icon ? <img src={current.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '11px' }}>No icon</div>}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" value={current.icon} onChange={(e) => updateField(selected, 'icon', e.target.value)} style={inputSt} />
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: 'rgba(255,199,44,0.1)', border: '1px solid rgba(255,199,44,0.2)', color: '#ffc72c', borderRadius: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', alignSelf: 'flex-start' }}>
                    {uploadingField === selected ? 'Uploading…' : '↑ Upload Icon'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, selected)} disabled={uploadingField === selected} />
                  </label>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div><label style={labelSt}>ID</label><input type="text" value={current.id} onChange={(e) => updateField(selected, 'id', e.target.value)} style={inputSt} /></div>
              <div><label style={labelSt}>Code</label><input type="text" value={current.code} onChange={(e) => updateField(selected, 'code', e.target.value)} style={inputSt} /></div>
              <div><label style={labelSt}>Name</label><input type="text" value={current.name} onChange={(e) => updateField(selected, 'name', e.target.value)} style={inputSt} /></div>
              <div><label style={labelSt}>Tagline</label><input type="text" value={current.tagline} onChange={(e) => updateField(selected, 'tagline', e.target.value)} style={inputSt} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div><label style={labelSt}>Status Phase</label>
                <select value={current.status} onChange={(e) => updateField(selected, 'status', e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                  <option value="concept">Concept</option>
                  <option value="building">Building</option>
                  <option value="live">Live</option>
                </select>
              </div>
              <div><label style={labelSt}>Status Label</label><input type="text" value={current.statusLabel} onChange={(e) => updateField(selected, 'statusLabel', e.target.value)} style={inputSt} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div><label style={labelSt}>Link URL (optional)</label><input type="text" value={current.link || ''} onChange={(e) => updateField(selected, 'link', e.target.value)} style={inputSt} /></div>
              <div><label style={labelSt}>Link Label</label><input type="text" value={current.linkLabel || ''} onChange={(e) => updateField(selected, 'linkLabel', e.target.value)} style={inputSt} /></div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelSt}>Chips (comma separated)</label>
              <input type="text" value={(current.chips || []).join(', ')} onChange={(e) => updateField(selected, 'chips', e.target.value.split(',').map(s => s.trim()))} style={inputSt} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelSt}>Description</label>
              <textarea value={current.description} onChange={(e) => updateField(selected, 'description', e.target.value)} rows={3} style={{ ...inputSt, lineHeight: '1.5', resize: 'vertical' }} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.4 }}>⚙</div><div style={{ fontSize: '13px', fontWeight: 600 }}>Select a system</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function SystemsPage() {
  const primary = systems.filter(s => s.id === 'chronos' || s.id === 'mnemos');
  const secondary = systems.filter(s => s.id !== 'chronos' && s.id !== 'mnemos');

  const panels = {
    directory: (
      <div className="systems-room-directory">
        <div className="systems-room-intro"><span className="sp-label">Public Systems Directory</span><h2>{content.systems.hero.title}</h2><p>{content.systems.hero.lead}</p></div>
        <div className="sp-grid-3">{systems.map((system) => <SystemCard key={system.id} system={system} compact />)}</div>
      </div>
    ),
    proof: <div className="sp-grid-2 systems-active-room">{primary.map((system) => <SystemCard key={system.id} system={system} />)}</div>,
    research: <div className="sp-grid-3 systems-lane-room">{secondary.map((system) => <SystemCard key={system.id} system={system} compact />)}</div>,
    authority: (
      <div className="room-note-grid">
        {PUBLIC_DOCTRINE.contract.map((item, index) => <article className="room-note" key={item.id}><span>{String(index + 1).padStart(2, '0')} · {item.status}</span><h3>{item.label}</h3><p>{item.detail}</p></article>)}
      </div>
    ),
  };

  return (
    <PageShell>
      <HoverEditor model="content">
        <RoomShell eyebrow="Systems / Continuity Domains" title="Systems" summary={content.systems.hero.lead} status="MATURITY-LABELED PUBLIC MAP" tone="map" stations={[{ id: 'directory', label: 'Domains' }, { id: 'proof', label: 'Public Proof' }, { id: 'research', label: 'Research' }, { id: 'authority', label: 'Authority' }]} panels={panels} defaultStation="directory" className="systems-room-shell" />
      </HoverEditor>

      {/* Dev-only inline systems manager */}
      {isDev && (
        <section className="section dev-room-manager">
          <div className="shell">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffc72c', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-display)' }}>Systems Manager</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,199,44,0.15)' }} />
            </div>
            <SystemsManager />
          </div>
        </section>
      )}
    </PageShell>
  );
}

function SystemCard({ system, compact = false }) {
  return (
    <article className={compact ? 'sp-lane-card' : 'sp-system-card'}>
      <div className="sp-sys-head"><img src={system.icon} alt="" /><div><h3>{system.name}</h3><div className="sp-status">{system.statusLabel}</div></div></div>
      <p>{system.description}</p>
      {!compact && system.chips && <div className="sp-chips">{system.chips.map((chip) => <span key={chip} className="sp-chip">{chip}</span>)}</div>}
      {system.link && <div className="sp-actions">{system.link.startsWith('http') ? <a href={system.link} className="btn btn-gold" target="_blank" rel="noopener noreferrer">Open {system.name}</a> : <Link to={system.link} className="btn btn-gold">{system.linkLabel}</Link>}</div>}
    </article>
  );
}
