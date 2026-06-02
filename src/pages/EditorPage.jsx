import { useCallback, useEffect, useMemo, useState } from 'react';
import EditorForm from '../components/ui/EditorForm';
import MediaFrame from '../components/ui/MediaFrame';
import { mediaSource, toMediaObject } from '../utils/media';
import { HYPERION_MARK_DEFAULT } from '../utils/brand';
import { useTheme } from '../context/ThemeContext';
import './EditorPage.css';

const MODELS = [
  'content',
  'destinations',
  'systems',
  'operators',
  'gallery',
  'showcase',
  'newsletter',
  'navigation',
];

const MODEL_META = {
  content: { label: 'Content', mode: 'document', hint: 'Homepage, sections, page copy, and media strips.' },
  destinations: { label: 'Destinations', mode: 'collection', titleKey: 'title', hint: 'Homepage routing cards.' },
  systems: { label: 'Systems', mode: 'collection', titleKey: 'name', hint: 'System stack rows and status badges.' },
  operators: { label: 'Operators', mode: 'collection', titleKey: 'name', hint: 'Founding operator cards.' },
  gallery: { label: 'Gallery', mode: 'collection', titleKey: 'label', hint: 'Gallery assets, media, and references.' },
  showcase: { label: 'Build Archive', mode: 'collection', titleKey: 'codename', hint: 'Build cards and carousel entries.' },
  newsletter: { label: 'Newsletter', mode: 'document', hint: 'Future newsletter lane.' },
  navigation: { label: 'Navigation', mode: 'document', hint: 'Header and footer links.' },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function titleFor(item, index, model) {
  const key = MODEL_META[model]?.titleKey;
  return item?.[key] || item?.title || item?.label || item?.name || item?.codename || `Entry ${index + 1}`;
}

function collectionTemplate(model) {
  const templates = {
    destinations: { id: 'new-destination', color: 'cyan', status: 'Draft', title: 'New Destination', purpose: '', cta: 'Open', path: '/' },
    systems: { id: 'new-system', code: 'OS -- 00', name: 'New System', tagline: '', description: '', status: 'concept', statusLabel: 'Draft', link: null, linkLabel: null, icon: HYPERION_MARK_DEFAULT, color: 'cyan', chips: [] },
    operators: { id: 'HYP-OP-NEW', name: 'New Operator', attr: 'H', image: null, typeLine: 'Operator', description: '', focuses: [], flavor: '', stats: [], serial: 'HYP-OP-NEW' },
    gallery: { src: '', label: 'New Asset', desc: '', type: 'References', reference: false },
    showcase: { codename: 'NEW BUILD', generation: 'Gen 2026', hardwareClass: 'Draft', status: 'Draft', image: '', focalX: '50%', focalY: '50%', fit: 'cover', specs: [], description: '' },
  };
  return clone(templates[model] || { title: 'New Entry' });
}

function statusText(result) {
  if (result?.stdout?.includes('No changes to commit')) return 'No changes to publish. Already up to date.';
  return result?.stdout ? 'Published to GitHub Pages pipeline.' : 'Saved.';
}

function MediaLibrary({ mediaItems, selectedMedia, onSelect, onRefresh, activePath }) {
  const [uploading, setUploading] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [embedTitle, setEmbedTitle] = useState('');

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, data: reader.result, mimeType: file.type }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Upload failed');
        onSelect(result.media);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
      setUploading(false);
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const insertEmbed = () => {
    if (!embedUrl.trim()) return;
    onSelect(toMediaObject({ type: 'embed', embedUrl: embedUrl.trim(), title: embedTitle.trim(), aspectRatio: '16 / 9' }));
    setEmbedUrl('');
    setEmbedTitle('');
  };

  return (
    <aside className="ed-media-panel">
      <div className="ed-panel-head">
        <div>
          <span>Media Library</span>
          <strong>{activePath ? activePath.join('.') : 'No field focused'}</strong>
        </div>
        <button className="ed-icon-btn" onClick={onRefresh} title="Refresh media">↻</button>
      </div>

      <label className="ed-upload-zone">
        <input type="file" accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime" onChange={upload} disabled={uploading} />
        <span>{uploading ? 'Uploading...' : 'Upload image or video'}</span>
        <small>Stored in public/assets/uploads</small>
      </label>

      <div className="ed-embed-box">
        <label>Embed Video</label>
        <input className="ed-input" value={embedTitle} onChange={(event) => setEmbedTitle(event.target.value)} placeholder="Title" />
        <input className="ed-input" value={embedUrl} onChange={(event) => setEmbedUrl(event.target.value)} placeholder="YouTube / Vimeo / direct URL" />
        <button className="ed-btn ed-btn-primary" onClick={insertEmbed} disabled={!embedUrl.trim()}>Select Embed</button>
      </div>

      {selectedMedia && (
        <div className="ed-selected-media">
          <span>Selected</span>
          <MediaFrame media={selectedMedia} compact />
          <code>{mediaSource(selectedMedia)}</code>
        </div>
      )}

      <div className="ed-media-grid">
        {mediaItems.map((item) => (
          <button
            type="button"
            key={item.path}
            className={`ed-media-card ${mediaSource(selectedMedia) === item.path ? 'active' : ''}`}
            onClick={() => onSelect(item.media)}
            title={item.path}
          >
            <MediaFrame media={item.media} compact />
            <span>{item.name}</span>
            <small>{item.type}</small>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default function EditorPage() {
  const { brandMark } = useTheme();
  const [activeModel, setActiveModel] = useState(MODELS[0]);
  const [data, setData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [activePath, setActivePath] = useState(null);

  const meta = MODEL_META[activeModel] || { label: activeModel };
  const dirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(originalData), [data, originalData]);

  const reloadMedia = useCallback(() => {
    fetch('/api/media')
      .then((res) => res.json())
      .then((json) => setMediaItems(json.items || []))
      .catch(() => setMediaItems([]));
  }, []);

  const loadModel = useCallback((model) => {
    setLoading(true);
    setSelectedItemIndex(null);
    setActivePath(null);
    fetch(`/api/data/${model}`)
      .then((res) => {
        if (!res.ok) throw new Error('Data not found');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setOriginalData(clone(json));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setData(null);
        setOriginalData(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadModel(activeModel);
  }, [activeModel, loadModel]);

  useEffect(() => {
    reloadMedia();
  }, [reloadMedia]);

  const flash = (text, ms = 4000) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), ms);
  };

  const saveDraft = async (nextData = data) => {
    if (!nextData) return false;
    setSaving(true);
    try {
      const res = await fetch(`/api/data/${activeModel}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextData, null, 2),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Draft save failed.');
      setOriginalData(clone(nextData));
      flash('Draft saved locally.');
      return true;
    } catch (err) {
      flash(`Save failed: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const saved = dirty ? await saveDraft(data) : true;
      if (!saved) return;
      const res = await fetch('/api/commit', { method: 'POST' });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Git push failed.');
      flash(statusText(result));
    } catch (err) {
      flash(`Publish failed: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const addItem = () => {
    const updated = [collectionTemplate(activeModel), ...(Array.isArray(data) ? data : [])];
    setData(updated);
    setSelectedItemIndex(0);
  };

  const deleteItem = (index) => {
    if (!window.confirm(`Delete "${titleFor(data[index], index, activeModel)}"?`)) return;
    setData(data.filter((_, itemIndex) => itemIndex !== index));
    setSelectedItemIndex(null);
  };

  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= data.length) return;
    const updated = [...data];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setData(updated);
    setSelectedItemIndex(target);
  };

  const editableChunk = Array.isArray(data) && selectedItemIndex !== null ? data[selectedItemIndex] : data;
  const updateChunk = (updatedChunk) => {
    if (Array.isArray(data) && selectedItemIndex !== null) {
      const updated = [...data];
      updated[selectedItemIndex] = updatedChunk;
      setData(updated);
    } else {
      setData(updatedChunk);
    }
  };

  return (
    <div className="ed-layout">
      <aside className="ed-sidebar">
        <div className="ed-logo">
          <img src={brandMark} alt="" />
          <div>
            <strong>Hyperion</strong>
            <span>Workbench</span>
          </div>
        </div>
        <nav className="ed-nav">
          <div className="ed-nav-title">Models</div>
          {MODELS.map((model) => (
            <button
              key={model}
              className={`ed-nav-btn ${activeModel === model ? 'active' : ''}`}
              onClick={() => setActiveModel(model)}
            >
              <span>{MODEL_META[model]?.label || model}</span>
              <small>{model}.json</small>
            </button>
          ))}
        </nav>
        <div className="ed-sidebar-footer">
          <div className={`ed-dirty ${dirty ? 'active' : ''}`}>{dirty ? 'Dirty changes' : 'Clean'}</div>
          <button className="ed-btn ed-btn-commit" onClick={publish} disabled={publishing || !data}>
            {publishing ? 'Publishing...' : 'Commit & Push'}
          </button>
          {message && <div className="ed-message">{message}</div>}
        </div>
      </aside>

      <main className="ed-main">
        <header className="ed-header">
          <div>
            <div className="ed-kicker">Current Model</div>
            <h2>{meta.label}</h2>
            <p>{meta.hint}</p>
          </div>
          <div className="ed-header-actions">
            <button className="ed-btn ed-btn-ghost" onClick={() => loadModel(activeModel)} disabled={loading || dirty}>Reload</button>
            <button className="ed-btn ed-btn-primary" onClick={() => saveDraft()} disabled={saving || !data || !dirty}>
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button className="ed-btn ed-btn-gold" onClick={publish} disabled={publishing || !data}>
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </header>

        <div className="ed-workspace">
          {loading ? (
            <div className="ed-loading"><div className="ed-spinner" />Accessing artifact store...</div>
          ) : !data ? (
            <div className="ed-loading error">Artifact model not found in /src/data/</div>
          ) : (
            <div className="ed-editor-container">
              {Array.isArray(data) && (
                <aside className="ed-list">
                  <div className="ed-list-head">
                    <span>{data.length} entries</span>
                    <button className="ed-icon-btn" onClick={addItem}>+</button>
                  </div>
                  {data.map((item, index) => (
                    <button
                      type="button"
                      key={`${activeModel}-${index}`}
                      className={`ed-list-item ${selectedItemIndex === index ? 'active' : ''}`}
                      onClick={() => setSelectedItemIndex(index)}
                    >
                      <strong>{titleFor(item, index, activeModel)}</strong>
                      <span>Item {String(index + 1).padStart(2, '0')}</span>
                    </button>
                  ))}
                </aside>
              )}

              <section className="ed-form">
                {Array.isArray(data) && selectedItemIndex === null ? (
                  <div className="ed-empty-state">
                    <div>Select an artifact entry to modify</div>
                    <button className="ed-btn ed-btn-primary" onClick={addItem}>Add Entry</button>
                  </div>
                ) : (
                  <>
                    {Array.isArray(data) && (
                      <div className="ed-entry-toolbar">
                        <span>{titleFor(editableChunk, selectedItemIndex, activeModel)}</span>
                        <div>
                          <button className="ed-icon-btn" onClick={() => moveItem(selectedItemIndex, -1)} disabled={selectedItemIndex === 0}>↑</button>
                          <button className="ed-icon-btn" onClick={() => moveItem(selectedItemIndex, 1)} disabled={selectedItemIndex === data.length - 1}>↓</button>
                          <button className="ed-icon-btn danger" onClick={() => deleteItem(selectedItemIndex)}>×</button>
                        </div>
                      </div>
                    )}
                    <EditorForm
                      data={editableChunk}
                      onUpdate={updateChunk}
                      selectedMedia={selectedMedia}
                      onFocusPath={setActivePath}
                    />
                  </>
                )}
              </section>
            </div>
          )}
          <MediaLibrary
            mediaItems={mediaItems}
            selectedMedia={selectedMedia}
            onSelect={setSelectedMedia}
            onRefresh={reloadMedia}
            activePath={activePath}
          />
        </div>
      </main>
    </div>
  );
}
