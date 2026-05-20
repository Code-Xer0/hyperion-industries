import { useState, useCallback, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import showcaseItems from '../../data/showcase.json';
import HoverEditor from './HoverEditor';
import './Carousel3D.css';

export default function Carousel3D() {
  const [activeIndex, setActiveIndex] = useState(0);
  const controls = useAnimation();
  
  const total = showcaseItems.length;

  const wrapIndex = useCallback((index) => {
    return (index + total) % total;
  }, [total]);

  const signedOffset = useCallback((index) => {
    let offset = index - activeIndex;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;
    return offset;
  }, [activeIndex, total]);

  const goTo = useCallback((index) => {
    setActiveIndex(wrapIndex(index));
  }, [wrapIndex]);

  const handleDragEnd = (event, info) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      goTo(activeIndex + 1);
    } else if (info.offset.x > threshold) {
      goTo(activeIndex - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goTo(activeIndex - 1);
      if (e.key === 'ArrowRight') goTo(activeIndex + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, goTo]);

  return (
    <div className="carousel-shell">
      <motion.div 
        className="carousel-track" 
        drag="x" 
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        tabIndex={0}
      >
        {showcaseItems.map((item, index) => {
          const offset = signedOffset(index);
          const absOffset = Math.min(Math.abs(offset), 4);
          const clampedOffset = Math.max(-3, Math.min(3, offset));
          
          const isActive = index === activeIndex;
          const isHidden = Math.abs(offset) > 3;

          return (
            <HoverEditor key={item.codename} model="showcase" index={index}>
              <article 
                className={`artifact-card ${isActive ? 'is-active' : ''} ${isHidden ? 'is-hidden' : ''}`}
                style={{
                  '--offset': clampedOffset,
                  '--abs': absOffset,
                  pointerEvents: isActive ? 'auto' : 'none'
                }}
                aria-hidden={Math.abs(offset) > 2 ? "true" : "false"}
              >
                <span className="ac-corner tl"></span>
                <span className="ac-corner tr"></span>
                <span className="ac-corner bl"></span>
                <span className="ac-corner br"></span>
                
                <div className="ac-inner">
                  <header className="ac-top">
                    <div>
                      <div className="ac-kicker">{item.generation}</div>
                      <div className="ac-title">{item.codename}</div>
                    </div>
                    <div className="ac-class">{item.hardwareClass}</div>
                  </header>
                  
                  <div className="ac-image-bay" style={{ '--focal-x': item.focalX, '--focal-y': item.focalY, '--fit': item.fit }}>
                    <img src={item.image} alt={`${item.codename} custom PC build`} draggable="false" />
                  </div>
                  
                  <div className="ac-body">
                    <div className="ac-spec-tags">
                      {item.specs.map(spec => (
                        <span key={spec}>{spec}</span>
                      ))}
                    </div>
                    <p className="ac-description">{item.description}</p>
                    <footer className="ac-footer">
                      <div>
                        <span className="ac-meta-label">Archive Marker</span>
                        <span className="ac-meta-value">{item.status}</span>
                      </div>
                    </footer>
                  </div>
                </div>
              </article>
            </HoverEditor>
          );
        })}
      </motion.div>

      <div className="carousel-controls">
        <button 
          className="carousel-button" 
          onClick={() => goTo(activeIndex - 1)}
          aria-label="Previous build"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="carousel-counter">
          {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
        <button 
          className="carousel-button" 
          onClick={() => goTo(activeIndex + 1)}
          aria-label="Next build"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
