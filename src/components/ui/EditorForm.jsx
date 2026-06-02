import { useState } from 'react';
import MediaFrame from './MediaFrame';
import { isMediaFieldKey, isMediaObject, mediaKind, mediaSource, toMediaObject } from '../../utils/media';

const LABEL_OVERRIDES = {
  l1: 'Headline line 1',
  l2: 'Headline line 2',
  l3: 'Headline line 3',
  p1: 'Body copy 1',
  p2: 'Body copy 2',
  cta: 'Call to action',
  src: 'Media source',
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function titleize(key) {
  return LABEL_OVERRIDES[key] || key.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function setAtPath(source, path, value) {
  const next = clone(source);
  let current = next;
  for (let i = 0; i < path.length - 1; i += 1) {
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
  return next;
}

function joinPath(path) {
  return path.join('.');
}

function mediaAccept() {
  return 'image/*,video/mp4,video/webm,video/ogg,video/quicktime';
}

export default function EditorForm({
  data,
  onUpdate,
  selectedMedia,
  onFocusPath,
}) {
  const [uploadingPath, setUploadingPath] = useState(null);

  const updateDataPath = (path, value) => {
    onUpdate(setAtPath(data, path, value));
  };

  const handleFileUpload = async (event, path, currentValue) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const pathString = joinPath(path);
    setUploadingPath(pathString);

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
        updateDataPath(path, isMediaObject(currentValue) ? result.media : result.path);
      } catch (err) {
        console.error('Upload failed', err);
      }
      setUploadingPath(null);
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const applySelectedMedia = (path, currentValue) => {
    if (!selectedMedia) return;
    updateDataPath(path, isMediaObject(currentValue) ? selectedMedia : mediaSource(selectedMedia));
  };

  const renderMediaField = (key, value, path) => {
    const pathString = joinPath(path);
    const isUploading = uploadingPath === pathString;
    const currentMedia = isMediaObject(value) ? value : value || '';

    return (
      <div className="ed-field ed-media-field" key={pathString}>
        <div className="ed-field-head">
          <label>{titleize(key)}</label>
          <span>{mediaKind(currentMedia)}</span>
        </div>
        <div className="ed-media-row">
          <MediaFrame media={currentMedia} compact alt={titleize(key)} />
          <div className="ed-media-controls">
            <input
              type="text"
              value={typeof value === 'string' ? value : mediaSource(value)}
              onFocus={() => onFocusPath?.(path)}
              onChange={(event) => updateDataPath(path, isMediaObject(value) ? toMediaObject(value, { src: event.target.value }) : event.target.value)}
              className="ed-input"
              placeholder="/assets/uploads/file.jpg or https://..."
            />
            <div className="ed-inline-actions">
              <label className="ed-btn ed-btn-upload">
                {isUploading ? 'Uploading...' : 'Upload'}
                <input type="file" accept={mediaAccept()} onChange={(event) => handleFileUpload(event, path, value)} disabled={isUploading} />
              </label>
              <button type="button" className="ed-btn ed-btn-ghost" onClick={() => applySelectedMedia(path, value)} disabled={!selectedMedia}>
                Use Selected
              </button>
              {!isMediaObject(value) && (
                <button type="button" className="ed-btn ed-btn-ghost" onClick={() => updateDataPath(path, toMediaObject(value))}>
                  Rich Media
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMediaObject = (key, value, path) => {
    const pathString = joinPath(path);
    const media = toMediaObject(value);
    const sourceKey = media.type === 'embed' ? 'embedUrl' : 'src';

    return (
      <div className="ed-nested ed-media-object" key={pathString}>
        <div className="ed-nested-label">{titleize(key)} Media</div>
        <MediaFrame media={media} alt={media.alt || media.title || key} />
        <div className="ed-grid-2">
          <div className="ed-field">
            <label>Type</label>
            <select className="ed-input" value={media.type} onChange={(event) => updateDataPath(path, toMediaObject(media, { type: event.target.value }))}>
              <option value="image">image</option>
              <option value="video">video</option>
              <option value="embed">embed</option>
            </select>
          </div>
          <div className="ed-field">
            <label>Aspect Ratio</label>
            <input className="ed-input" value={media.aspectRatio || ''} onChange={(event) => updateDataPath(path, { ...media, aspectRatio: event.target.value })} placeholder="16 / 9" />
          </div>
        </div>
        <div className="ed-field">
          <label>{sourceKey === 'embedUrl' ? 'Embed URL' : 'Source'}</label>
          <input className="ed-input" value={media[sourceKey] || ''} onFocus={() => onFocusPath?.(path)} onChange={(event) => updateDataPath(path, { ...media, [sourceKey]: event.target.value })} />
        </div>
        <div className="ed-grid-2">
          <div className="ed-field">
            <label>Poster</label>
            <input className="ed-input" value={media.poster || ''} onChange={(event) => updateDataPath(path, { ...media, poster: event.target.value })} />
          </div>
          <div className="ed-field">
            <label>Alt / Title</label>
            <input className="ed-input" value={media.alt || media.title || ''} onChange={(event) => updateDataPath(path, { ...media, alt: event.target.value, title: event.target.value })} />
          </div>
        </div>
        <div className="ed-check-row">
          {['controls', 'muted', 'loop', 'autoplay'].map((flag) => (
            <label key={flag}>
              <input type="checkbox" checked={Boolean(media[flag])} onChange={(event) => updateDataPath(path, { ...media, [flag]: event.target.checked })} />
              {titleize(flag)}
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderPrimitive = (key, value, path) => {
    const pathString = joinPath(path);
    if (typeof value === 'boolean') {
      return (
        <label className="ed-check-line" key={pathString}>
          <input type="checkbox" checked={value} onChange={(event) => updateDataPath(path, event.target.checked)} />
          {titleize(key)}
        </label>
      );
    }

    if (typeof value === 'number') {
      return (
        <div className="ed-field" key={pathString}>
          <label>{titleize(key)}</label>
          <input className="ed-input" type="number" value={value} onFocus={() => onFocusPath?.(path)} onChange={(event) => updateDataPath(path, Number(event.target.value))} />
        </div>
      );
    }

    if (typeof value === 'string') {
      if (isMediaFieldKey(key) || mediaKind(value) !== 'unknown') return renderMediaField(key, value, path);
      const multiline = value.length > 72 || /(desc|lead|copy|body|quote|purpose|description|flavor|planned)/i.test(key);
      return (
        <div className="ed-field" key={pathString}>
          <label>{titleize(key)}</label>
          {multiline ? (
            <textarea className="ed-input" rows={4} value={value} onFocus={() => onFocusPath?.(path)} onChange={(event) => updateDataPath(path, event.target.value)} />
          ) : (
            <input className="ed-input" type="text" value={value} onFocus={() => onFocusPath?.(path)} onChange={(event) => updateDataPath(path, event.target.value)} />
          )}
        </div>
      );
    }

    return null;
  };

  const renderArray = (key, value, path) => {
    const pathString = joinPath(path);
    if (value.every((item) => typeof item === 'string')) {
      return (
        <div className="ed-field" key={pathString}>
          <label>{titleize(key)} List</label>
          <input className="ed-input" value={value.join(', ')} onFocus={() => onFocusPath?.(path)} onChange={(event) => updateDataPath(path, event.target.value.split(',').map((part) => part.trim()).filter(Boolean))} />
        </div>
      );
    }

    return (
      <div className="ed-nested" key={pathString}>
        <div className="ed-nested-label">{titleize(key)}</div>
        {value.map((item, index) => (
          <div className="ed-nested-item" key={`${pathString}.${index}`}>
            <div className="ed-nested-label small">Item {index + 1}</div>
            {renderFormFields(item, [...path, index])}
          </div>
        ))}
      </div>
    );
  };

  const renderFormFields = (obj, path = []) => {
    if (!obj || typeof obj !== 'object') return null;
    return Object.keys(obj).map((key) => {
      const value = obj[key];
      const currentPath = [...path, key];
      const pathString = joinPath(currentPath);

      if (Array.isArray(value)) return renderArray(key, value, currentPath);
      if (isMediaObject(value)) return renderMediaObject(key, value, currentPath);
      if (value && typeof value === 'object') {
        return (
          <div className="ed-nested" key={pathString}>
            <div className="ed-nested-label">{titleize(key)}</div>
            <div className="ed-nested-content">{renderFormFields(value, currentPath)}</div>
          </div>
        );
      }
      return renderPrimitive(key, value, currentPath);
    });
  };

  return <div className="ed-form-fields">{renderFormFields(data)}</div>;
}
