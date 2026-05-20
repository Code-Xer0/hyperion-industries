import { useState, useEffect } from 'react';
import EditorForm from '../components/ui/EditorForm';
import './EditorPage.css';

const MODELS = [
  'content',
  'destinations',
  'systems',
  'operators',
  'gallery',
  'showcase',
  'newsletter',
  'navigation'
];

export default function EditorPage() {
  const [activeModel, setActiveModel] = useState(MODELS[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  // Fetch data
  useEffect(() => {
    setLoading(true);
    setSelectedItemIndex(null);
    fetch(`/api/data/${activeModel}`)
      .then(res => {
        if (!res.ok) throw new Error('Data not found');
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setData(null);
        setLoading(false);
      });
  }, [activeModel]);

  // Save to local file system
  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/data/${activeModel}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data, null, 2),
      });
      if (res.ok) {
        setMessage('Artifact synced to local store.');
      } else {
        setMessage('Failed to sync artifact.');
      }
    } catch (e) {
      setMessage('Network error during sync.');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  // Commit via Git
  const handleCommit = async () => {
    setCommitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/commit', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setMessage('Changes committed to provenance chain.');
      } else {
        setMessage(`Commit failed: ${result.error}`);
      }
    } catch (e) {
      setMessage('Error during git operation.');
    }
    setCommitting(false);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleDataUpdate = (newData) => {
    setData(newData);
  };

  return (
    <div className="ed-layout">
      <aside className="ed-sidebar">
        <div className="ed-logo">
          <img src="/assets/branding/hyperion/Hyblklogoonly.png" alt="" style={{ width: '24px', height: '24px', marginRight: '12px' }} />
          Hyperion CMS
        </div>
        <nav className="ed-nav">
          <div className="ed-nav-title">Active Artifacts</div>
          {MODELS.map(m => (
            <button 
              key={m} 
              className={`ed-nav-btn ${activeModel === m ? 'active' : ''}`}
              onClick={() => setActiveModel(m)}
            >
              <span style={{ opacity: 0.4, marginRight: '8px', fontSize: '10px' }}>■</span>
              {m}.json
            </button>
          ))}
        </nav>
        <div className="ed-sidebar-footer">
          <button className="ed-btn ed-btn-commit" onClick={handleCommit} disabled={committing}>
            {committing ? 'Committing...' : 'Push to Git (Commit)'}
          </button>
          {message && <div className="ed-message">{message}</div>}
        </div>
      </aside>
      
      <main className="ed-main">
        <header className="ed-header">
          <div>
            <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Current Model</div>
            <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeModel}.json</h2>
          </div>
          <button className="ed-btn ed-btn-primary" onClick={handleSave} disabled={saving || !data}>
            {saving ? 'Syncing...' : 'Save Local Artifact'}
          </button>
        </header>

        <div className="ed-workspace">
          {loading ? (
            <div className="ed-loading">
               <div className="ed-spinner"></div>
               Accessing artifact store...
            </div>
          ) : !data ? (
            <div className="ed-loading" style={{ color: 'var(--red)' }}>Artifact model not found in /src/data/</div>
          ) : (
            <div className="ed-editor-container">
              {Array.isArray(data) ? (
                <div className="ed-split">
                  <div className="ed-list">
                    <div style={{ padding: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px' }}>
                      <button 
                        className="ed-btn" 
                        style={{ background: 'rgba(33,214,232,0.1)', color: '#21d6e8', border: '1px solid rgba(33,214,232,0.2)' }}
                        onClick={() => {
                          const newItem = { codename: 'NEW_ITEM', label: 'New Item' };
                          const newData = [newItem, ...data];
                          setData(newData);
                          setSelectedItemIndex(0);
                        }}
                      >
                        + Add New Entry
                      </button>
                    </div>
                    {data.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`ed-list-item ${selectedItemIndex === idx ? 'active' : ''}`}
                        onClick={() => setSelectedItemIndex(idx)}
                        style={{ position: 'relative' }}
                      >
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginBottom: '4px' }}>ITEM_#{idx}</div>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '24px' }}>
                          {item.codename || item.name || item.label || item.title || `Entry ${idx}`}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this artifact entry?')) {
                              const newData = data.filter((_, i) => i !== idx);
                              setData(newData);
                              setSelectedItemIndex(null);
                            }
                          }}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            right: '12px',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="ed-form">
                    {selectedItemIndex !== null ? (
                      <EditorForm 
                        data={data[selectedItemIndex]} 
                        onUpdate={(updatedItem) => {
                          const newData = [...data];
                          newData[selectedItemIndex] = updatedItem;
                          handleDataUpdate(newData);
                        }} 
                      />
                    ) : (
                      <div className="ed-empty-state">
                        <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.3 }}>⚝</div>
                        Select an artifact entry to modify
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="ed-form ed-form-full">
                  <EditorForm data={data} onUpdate={handleDataUpdate} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
