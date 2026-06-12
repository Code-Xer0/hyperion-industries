const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg|avif)$/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|mov)$/i;
const AUDIO_EXT = /\.(mp3|wav|flac|aac|m4a|oga)$/i;

export function isMediaObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && (value.type || value.src || value.embedUrl));
}

export function mediaKind(value) {
  if (!value) return 'empty';
  if (typeof value === 'object') {
    if (value.type) return value.type;
    if (value.embedUrl) return 'embed';
    if (VIDEO_EXT.test(value.src || '')) return 'video';
    if (AUDIO_EXT.test(value.src || '')) return 'audio';
    return 'image';
  }
  if (VIDEO_EXT.test(value)) return 'video';
  if (AUDIO_EXT.test(value)) return 'audio';
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(value)) return 'embed';
  return IMAGE_EXT.test(value) || value.includes('/assets/') ? 'image' : 'unknown';
}

export function normalizeMedia(value, fallback = {}) {
  if (!value) return { type: 'empty', ...fallback };
  if (typeof value === 'string') {
    const type = mediaKind(value);
    if (type === 'embed') return { type, embedUrl: value, ...fallback };
    return { type, src: value, ...fallback };
  }
  return { ...fallback, ...value, type: mediaKind(value) };
}

export function mediaSource(value) {
  const media = normalizeMedia(value);
  return media.embedUrl || media.src || '';
}

export function getEmbedSrc(url = '') {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : url;
    }
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : url;
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
    return url;
  } catch {
    return '';
  }
}

export function isMediaFieldKey(key = '') {
  return /(image|media|src|poster|video|audio|icon|asset|thumbnail|hero)$/i.test(key);
}

export function toMediaObject(value, overrides = {}) {
  const normalized = normalizeMedia(value);
  if (normalized.type === 'embed') {
    return {
      type: 'embed',
      embedUrl: normalized.embedUrl || normalized.src || '',
      title: normalized.title || '',
      aspectRatio: normalized.aspectRatio || '16 / 9',
      ...overrides,
    };
  }
  return {
    type: normalized.type === 'video' ? 'video' : 'image',
    src: normalized.src || '',
    poster: normalized.poster || '',
    alt: normalized.alt || '',
    title: normalized.title || '',
    caption: normalized.caption || '',
    aspectRatio: normalized.aspectRatio || '',
    controls: normalized.controls ?? normalized.type === 'video',
    muted: normalized.muted ?? true,
    loop: normalized.loop ?? false,
    autoplay: normalized.autoplay ?? false,
    ...overrides,
  };
}
