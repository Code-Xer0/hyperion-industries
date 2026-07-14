import { useEffect, useRef, useState } from 'react';

export default function CityPreviewMedia({ media }) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [media?.src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const syncVisibility = () => {
      if (document.hidden) {
        video.pause();
        return;
      }
      video.play().catch(() => setFailed(true));
    };

    document.addEventListener('visibilitychange', syncVisibility);
    syncVisibility();
    return () => {
      document.removeEventListener('visibilitychange', syncVisibility);
      video.pause();
    };
  }, [media?.src, failed]);

  if (!media) return null;

  const fallback = media.poster || media.src;
  const showVideo = media.type === 'video' && !failed;

  return (
    <div
      key={media.src}
      className="city-route-preview-media"
      role="img"
      aria-label={media.alt}
      data-media-type={showVideo ? 'video' : 'image'}
      data-truth-class={media.truthClass}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          src={media.src}
          poster={media.poster}
          style={{ objectPosition: media.objectPosition }}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
          aria-hidden="true"
        />
      ) : (
        <img
          src={fallback}
          alt=""
          style={{ objectPosition: media.objectPosition }}
          decoding="async"
          draggable="false"
        />
      )}
    </div>
  );
}
