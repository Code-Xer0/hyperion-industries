import React, { useEffect, useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import EditorForm from './EditorForm';

export default function EditorModal() {
  const { activeEditConfig, setActiveEditConfig } = useEditor();
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!activeEditConfig) {
      setData(null);
      return;
    }
    
    // Fetch current data for the model
    fetch(`/api/data/${activeEditConfig.model}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
      });
  }, [activeEditConfig]);

  if (!activeEditConfig) return null;



  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const saveRes = await fetch(`/api/data/${activeEditConfig.model}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data, null, 2),
      });
      if (!saveRes.ok) {
        throw new Error('Failed to save locally.');
      }

      const commitRes = await fetch('/api/commit', { method: 'POST' });
      const commitResult = await commitRes.json();
      if (!commitResult.success) {
        throw new Error(commitResult.error || 'Failed to commit/push changes.');
      }

      window.location.reload();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during synchronization.');
      setSaving(false);
    }
  };

  // Extract the specific chunk to edit if an index is provided
  const isArray = Array.isArray(data);
  const chunkToEdit = isArray && activeEditConfig.index !== null ? data[activeEditConfig.index] : data;

  const handleUpdate = (updatedChunk) => {
    if (isArray && activeEditConfig.index !== null) {
      const newData = [...data];
      newData[activeEditConfig.index] = updatedChunk;
      setData(newData);
    } else {
      setData(updatedChunk);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--nav-bg-scrolled)',
      backdropFilter: 'blur(20px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'ed-fade-in 0.3s ease-out'
    }}>
      <div style={{
        background: 'var(--surface-up)',
        border: '1px solid var(--border-gold)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 42px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          padding: '28px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(255,199,44,0.03), transparent)'
        }}>
          <div>
            <div style={{ fontSize: '10px', color: '#ffc72c', fontFamily: 'var(--font-display)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Visual Editor</div>
            <h3 style={{ margin: 0, color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, letterSpacing: '0.05em' }}>
              Editing: <span style={{ color: 'var(--gold)' }}>{activeEditConfig.model}</span>
              {activeEditConfig.index !== null && <span style={{ color: 'var(--text-muted)', marginLeft: '12px' }}>[#{activeEditConfig.index}]</span>}
            </h3>
          </div>
          <button 
            onClick={() => setActiveEditConfig(null)}
            style={{ 
              background: 'var(--chip-bg)', 
              border: '1px solid var(--border-soft)', 
              color: 'var(--text)', 
              cursor: 'pointer', 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,59,59,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--chip-bg)'}
          >
            ×
          </button>
        </div>
        
        <div style={{ padding: '32px', overflowY: 'auto', flex: 1, scrollbarWidth: 'thin' }}>
          {chunkToEdit ? (
            <EditorForm data={chunkToEdit} onUpdate={handleUpdate} />
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
              <div style={{ marginBottom: '16px', fontSize: '24px' }}>⏳</div>
              Initializing synchronization...
            </div>
          )}
        </div>

        <div style={{
          padding: '24px 32px',
          borderTop: '1px solid var(--border-soft)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          background: 'var(--chip-bg)'
        }}>
          {errorMsg ? (
            <div style={{ color: '#ff5555', fontSize: '11px', fontFamily: 'monospace', maxWidth: '50%' }}>
              ⚠️ {errorMsg}
            </div>
          ) : <div />}
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={() => setActiveEditConfig(null)}
              style={{ 
                padding: '10px 24px', 
                background: 'transparent', 
                border: '1px solid var(--border)', 
                color: 'var(--text-soft)', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-soft)'; }}
            >
              Discard Changes
            </button>
            <button 
              onClick={handleSave}
              disabled={saving || !chunkToEdit}
              style={{ 
                padding: '10px 32px', 
                background: 'var(--gold)', 
                border: 'none', 
                color: '#000', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: 800,
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'all 0.2s',
                boxShadow: '0 8px 24px rgba(255, 199, 44, 0.2)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {saving ? 'Deploying...' : 'Save & Publish →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
