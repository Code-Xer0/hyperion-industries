import { getEmbedSrc, normalizeMedia } from '../../utils/media';
import './MediaFrame.css';

export default function MediaFrame({
  media,
  alt = '',
  className = '',
  fit = 'cover',
  focalX = '50%',
  focalY = '50%',
  draggable,
  compact = false,
}) {
  const item = normalizeMedia(media, { alt });
  const style = {
    '--media-fit': fit || item.fit || 'cover',
    '--media-focal-x': item.focalX || focalX,
    '--media-focal-y': item.focalY || focalY,
    '--media-aspect': item.aspectRatio || undefined,
  };

  if (item.type === 'empty') {
    return <div className={`media-frame is-empty ${compact ? 'is-compact' : ''} ${className}`} style={style}>No media</div>;
  }

  if (item.type === 'video') {
    return (
      <figure className={`media-frame is-video ${compact ? 'is-compact' : ''} ${className}`} style={style}>
        <video
          src={item.src}
          poster={item.poster || undefined}
          controls={item.controls ?? true}
          muted={item.muted ?? true}
          loop={item.loop ?? false}
          autoPlay={item.autoplay ?? false}
          playsInline
        />
        {item.caption && <figcaption>{item.caption}</figcaption>}
      </figure>
    );
  }

  if (item.type === 'embed') {
    const src = getEmbedSrc(item.embedUrl || item.src);
    return (
      <figure className={`media-frame is-embed ${compact ? 'is-compact' : ''} ${className}`} style={style}>
        {src ? (
          <iframe
            src={src}
            title={item.title || alt || 'Embedded media'}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="media-frame-error">Invalid embed URL</div>
        )}
        {item.caption && <figcaption>{item.caption}</figcaption>}
      </figure>
    );
  }

  return (
    <figure className={`media-frame is-image ${compact ? 'is-compact' : ''} ${className}`} style={style}>
      <img src={item.src} alt={item.alt || alt} draggable={draggable} />
      {item.caption && <figcaption>{item.caption}</figcaption>}
    </figure>
  );
}
