import React, { useState } from 'react';

export default function EditorForm({ data, onUpdate }) {
  const [uploadingPath, setUploadingPath] = useState(null);

  // Generic recursive object updater
  const updateDataPath = (path, value) => {
    const newData = Array.isArray(data) ? [...data] : { ...data };
    let current = newData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    onUpdate(newData);
  };

  const handleFileUpload = async (e, path) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPath(path.join('.'));
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, data: base64Data })
        });
        if (res.ok) {
          const result = await res.json();
          updateDataPath(path, result.path);
        }
      } catch (err) {
        console.error('Upload failed', err);
      }
      setUploadingPath(null);
    };
    reader.readAsDataURL(file);
  };

  const renderFormFields = (obj, path = []) => {
    return Object.keys(obj).map(key => {
      const val = obj[key];
      const currentPath = [...path, key];
      const pathString = currentPath.join('.');
      
      if (typeof val === 'boolean') {
        return (
          <div className="ed-field" key={pathString} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="checkbox"
              checked={val}
              onChange={(e) => updateDataPath(currentPath, e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#ffc72c', cursor: 'pointer' }}
            />
            <label style={{ 
              fontSize: '12px', 
              color: 'var(--text-soft)', 
              fontFamily: 'var(--font-display, monospace)',
              fontWeight: 600,
              cursor: 'pointer'
            }} onClick={() => updateDataPath(currentPath, !val)}>{key}</label>
          </div>
        );
      }

      if (typeof val === 'string' || typeof val === 'number') {
        const isImage = typeof val === 'string' && (val.endsWith('.png') || val.endsWith('.jpg') || val.endsWith('.jpeg') || val.endsWith('.webp') || val.includes('/assets/'));
        const isTextArea = typeof val === 'string' && val.length > 60 && !isImage;
        const isUploading = uploadingPath === pathString;
        
        return (
          <div className="ed-field" key={pathString} style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '10px', 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em', 
              marginBottom: '8px',
              fontFamily: 'var(--font-display, monospace)',
              fontWeight: 700
            }}>{key}</label>
            
            {isTextArea ? (
              <textarea 
                value={val} 
                onChange={(e) => updateDataPath(currentPath, e.target.value)}
                rows={4}
                className="ed-input"
                style={{
                  width: '100%',
                  background: 'var(--chip-bg)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: '6px',
                  color: 'var(--text)',
                  padding: '12px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type={typeof val === 'number' ? 'number' : 'text'}
                    value={val} 
                    onChange={(e) => updateDataPath(currentPath, e.target.value)}
                    className="ed-input"
                    style={{
                      flex: 1,
                      background: 'var(--chip-bg)',
                      border: '1px solid var(--border-soft)',
                      borderRadius: '6px',
                      color: 'var(--text)',
                      padding: '10px 12px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                  {isImage && (
                    <label className="ed-btn-upload" style={{ 
                      whiteSpace: 'nowrap',
                      padding: '8px 16px', 
                      cursor: 'pointer', 
                      background: 'rgba(255,199,44,0.1)', 
                      border: '1px solid rgba(255,199,44,0.2)',
                      color: '#ffc72c',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderRadius: '4px',
                      transition: 'all 0.2s'
                    }}>
                      {isUploading ? 'Uploading...' : 'Replace Artifact'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, currentPath)} disabled={isUploading} />
                    </label>
                  )}
                </div>
                {isImage && (
                  <div style={{ 
                    marginTop: '4px',
                    padding: '8px',
                    background: 'var(--surface-top)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <img src={val} alt="preview" style={{ 
                      width: '64px', 
                      height: '64px', 
                      objectFit: 'cover', 
                      borderRadius: '4px',
                      border: '1px solid var(--border)'
                    }} />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-display, monospace)' }}>
                      Source: {val.split('/').pop()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      
      if (Array.isArray(val) && (typeof val[0] === 'string' || val.length === 0)) {
        return (
          <div className="ed-field" key={pathString} style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '10px', 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em', 
              marginBottom: '8px',
              fontFamily: 'var(--font-display, monospace)',
              fontWeight: 700
            }}>{key} (List · Comma Separated)</label>
            <input 
              type="text" 
              value={val.join(', ')} 
              onChange={(e) => {
                const newArray = e.target.value.split(',').map(s => s.trim());
                updateDataPath(currentPath, newArray);
              }}
              style={{
                width: '100%',
                background: 'var(--chip-bg)',
                border: '1px solid var(--border-soft)',
                borderRadius: '6px',
                color: 'var(--text)',
                padding: '10px 12px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        );
      }
      
      if (typeof val === 'object' && val !== null) {
        return (
          <div className="ed-nested" key={pathString} style={{ 
            marginTop: '24px',
            marginBottom: '32px',
            padding: '24px',
            background: 'var(--surface-top)',
            border: '1px solid var(--border-soft)',
            borderRadius: '12px'
          }}>
            <div style={{ 
              fontSize: '13px', 
              fontWeight: 800, 
              color: 'var(--text)', 
              marginBottom: '20px', 
              fontFamily: 'var(--font-display)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ color: 'var(--gold)' }}>▶</span> {key}
            </div>
            <div className="ed-nested-content" style={{ paddingLeft: '12px', borderLeft: '1px solid var(--border-soft)' }}>
              {renderFormFields(val, currentPath)}
            </div>
          </div>
        );
      }
      
      return null;
    });
  };

  return <>{renderFormFields(data, [])}</>;
}
