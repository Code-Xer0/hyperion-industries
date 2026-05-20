import { useState, useEffect } from 'react';
import './EditorPage.css';

const MODELS = ['showcase', 'operators', 'content'];

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
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
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
        setMessage('Saved successfully to local JSON.');
      } else {
        setMessage('Failed to save.');
      }
    } catch (e) {
      setMessage('Error saving data.');
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
        setMessage('Changes committed to Git.');
      } else {
        setMessage(`Commit failed: ${result.error}`);
      }
    } catch (e) {
      setMessage('Error committing data.');
    }
    setCommitting(false);
    setTimeout(() => setMessage(''), 4000);
  };

  // Generic recursive object updater
  const updateDataPath = (path, value) => {
    setData(prev => {
      const newData = Array.isArray(prev) ? [...prev] : { ...prev };
      let current = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  // Render a dynamic form for an object
  const renderFormFields = (obj, path = []) => {
    return Object.keys(obj).map(key => {
      const val = obj[key];
      const currentPath = [...path, key];
      
      if (typeof val === 'string' || typeof val === 'number') {
        const isImage = typeof val === 'string' && val.includes('.');
        const isTextArea = typeof val === 'string' && val.length > 60;
        
        return (
          <div className="ed-field" key={currentPath.join('.')}>
            <label>{key}</label>
            {isTextArea ? (
              <textarea 
                value={val} 
                onChange={(e) => updateDataPath(currentPath, e.target.value)}
                rows={3}
              />
            ) : (
              <input 
                type={typeof val === 'number' ? 'number' : 'text'}
                value={val} 
                onChange={(e) => updateDataPath(currentPath, e.target.value)}
              />
            )}
            {isImage && <img src={val} alt="preview" className="ed-img-preview" />}
          </div>
        );
      }
      
      if (Array.isArray(val) && typeof val[0] === 'string') {
        // Array of strings (e.g. tags, specs)
        return (
          <div className="ed-field" key={currentPath.join('.')}>
            <label>{key} (comma separated)</label>
            <input 
              type="text" 
              value={val.join(', ')} 
              onChange={(e) => {
                const newArray = e.target.value.split(',').map(s => s.trim());
                updateDataPath(currentPath, newArray);
              }}
            />
          </div>
        );
      }
      
      if (typeof val === 'object' && val !== null) {
        return (
          <div className="ed-nested" key={currentPath.join('.')}>
            <div className="ed-nested-label">{key}</div>
            <div className="ed-nested-content">
              {renderFormFields(val, currentPath)}
            </div>
          </div>
        );
      }
      
      return null;
    });
  };

  return (
    <div className="ed-layout">
      <aside className="ed-sidebar">
        <div className="ed-logo">Hyperion CMS</div>
        <nav className="ed-nav">
          <div className="ed-nav-title">Data Collections</div>
          {MODELS.map(m => (
            <button 
              key={m} 
              className={`ed-nav-btn ${activeModel === m ? 'active' : ''}`}
              onClick={() => setActiveModel(m)}
            >
              {m}.json
            </button>
          ))}
        </nav>
        <div className="ed-sidebar-footer">
          <button className="ed-btn ed-btn-commit" onClick={handleCommit} disabled={committing}>
            {committing ? 'Committing...' : 'Save & Commit'}
          </button>
          {message && <div className="ed-message">{message}</div>}
        </div>
      </aside>
      
      <main className="ed-main">
        <header className="ed-header">
          <h2>Editing: {activeModel}.json</h2>
          <button className="ed-btn ed-btn-primary" onClick={handleSave} disabled={saving || !data}>
            {saving ? 'Saving...' : 'Save Local'}
          </button>
        </header>

        <div className="ed-workspace">
          {loading ? (
            <div className="ed-loading">Loading data...</div>
          ) : !data ? (
            <div className="ed-loading">No data found.</div>
          ) : (
            <div className="ed-editor-container">
              {Array.isArray(data) ? (
                <div className="ed-split">
                  <div className="ed-list">
                    {data.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`ed-list-item ${selectedItemIndex === idx ? 'active' : ''}`}
                        onClick={() => setSelectedItemIndex(idx)}
                      >
                        {item.codename || item.name || item.title || `Item ${idx}`}
                      </div>
                    ))}
                  </div>
                  <div className="ed-form">
                    {selectedItemIndex !== null ? (
                      renderFormFields(data[selectedItemIndex], [selectedItemIndex])
                    ) : (
                      <div className="ed-empty-state">Select an item to edit</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="ed-form ed-form-full">
                  {renderFormFields(data, [])}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
