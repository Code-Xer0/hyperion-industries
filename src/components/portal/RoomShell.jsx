import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StatusChip from './StatusChip';
import './RoomShell.css';

export default function RoomShell({
  eyebrow,
  title,
  summary,
  status,
  tone = 'map',
  stations,
  panels,
  defaultStation,
  actions,
  backdrop,
  className = '',
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const fallback = defaultStation || stations[0]?.id;
  const requested = location.hash.replace(/^#/, '');
  const active = stations.some((station) => station.id === requested) ? requested : fallback;
  const activeStation = useMemo(
    () => stations.find((station) => station.id === active),
    [active, stations],
  );
  const activeIndex = stations.findIndex((station) => station.id === active);
  const previousIndexRef = useRef(activeIndex);
  const direction = activeIndex === previousIndexRef.current
    ? 1
    : Math.sign(activeIndex - previousIndexRef.current);

  useEffect(() => {
    previousIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (requested && requested !== active) {
      navigate({ pathname: location.pathname, search: location.search, hash: active }, { replace: true });
    }
  }, [active, location.pathname, location.search, navigate, requested]);

  const selectStation = (id) => {
    if (id === active) return;
    navigate({ pathname: location.pathname, search: location.search, hash: id });
    requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
  };

  return (
    <section className={`room-shell ${className}`} data-room-station={active} style={{ '--room-station-count': stations.length }}>
      {backdrop && <div className="room-backdrop" aria-hidden="true">{backdrop}</div>}
      <header className="room-heading">
        <div className="room-heading-copy">
          <div className="room-heading-meta">
            {eyebrow && <span className="room-eyebrow">{eyebrow}</span>}
            {status && <StatusChip label={status} tone={tone} compact />}
          </div>
          <h1>{title}</h1>
          {summary && <p>{summary}</p>}
        </div>
        {actions && <div className="room-heading-actions">{actions}</div>}
      </header>

      <div className="room-workspace">
        <div className="room-station-rail" role="tablist" aria-label={`${title} stations`}>
          {stations.map((station, index) => (
            <button
              key={station.id}
              id={`station-${station.id}`}
              type="button"
              role="tab"
              aria-selected={station.id === active}
              aria-controls={`room-panel-${station.id}`}
              className={station.id === active ? 'is-active' : ''}
              onClick={() => selectStation(station.id)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{station.label}</strong>
            </button>
          ))}
          <span className="room-operator-anchor room-operator-anchor-rail" data-operator-anchor data-position="rail" data-facing="right" data-station={active} data-safe-radius="76" data-intent="guard" aria-hidden="true" />
        </div>

        <div className="room-panel-stage">
          <div className="room-operator-anchors" aria-hidden="true">
            <span className="room-operator-anchor" data-operator-anchor data-position="west" data-facing="right" data-station={active} data-safe-radius="88" data-intent="present" />
            <span className="room-operator-anchor" data-operator-anchor data-position="center" data-facing="front" data-station={active} data-safe-radius="80" data-intent="inspect" />
            <span className="room-operator-anchor" data-operator-anchor data-position="east" data-facing="left" data-station={active} data-safe-radius="88" data-intent="present" />
          </div>
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={active}
              ref={panelRef}
              id={`room-panel-${active}`}
              className="room-panel"
              role="tabpanel"
              tabIndex={-1}
              aria-labelledby={`station-${active}`}
              custom={direction}
              initial={{ opacity: 0, x: direction * 22, scale: 0.995 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -16, scale: 0.998 }}
              transition={{
                duration: 0.34,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="room-panel-label">
                <span>Current station</span>
                <strong>{activeStation?.label}</strong>
              </div>
              {panels[active]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
