import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Archive,
  ArrowUpRight,
  Bot,
  ChevronRight,
  Command,
  Cpu,
  Fingerprint,
  Handshake,
  MapPinned,
  Moon,
  Orbit,
  Search,
  Send,
  Sun,
  UsersRound,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  cityDestinations,
  cityFamilies,
  cityMotionManifest,
  cityUtilities,
  getCityDestination,
} from '../../data/cityNavigation';
import { useTheme } from '../../context/ThemeContext';
import { useOperatorPilot } from '../../context/OperatorPilotContext';
import { pickKairoScore } from '../../data/scores';
import StatusChip from '../portal/StatusChip';
import CityPreviewMedia from './CityPreviewMedia';
import './Nav.css';

const searchableText = (destination) => [
  destination.label,
  destination.family,
  destination.status,
  ...(destination.keywords || []),
].join(' ').toLowerCase();

const familyIcons = {
  systems: Orbit,
  infrastructure: Cpu,
  identity: Fingerprint,
  record: Archive,
  alignment: Handshake,
  operators: UsersRound,
};

const interactiveSelector = 'a[href], button:not([disabled]), [role="button"], [role="tab"]';

export default function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLightMode, brandMark, toggleTheme } = useTheme();
  const operatorPilot = useOperatorPilot();
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeFamilyId, setActiveFamilyId] = useState('systems');
  const [previewPath, setPreviewPath] = useState('/chronos');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [scoreTrack] = useState(pickKairoScore);
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const soundtrackRef = useRef(null);
  const feedbackContextRef = useRef(null);
  const feedbackTargetRef = useRef(null);
  const returnFocusRef = useRef(null);
  const current = getCityDestination(location.pathname);
  const activeFamily = cityFamilies.find((family) => family.id === activeFamilyId) || cityFamilies[0];
  const previewDestination = cityDestinations.find((destination) => destination.path === previewPath)
    || activeFamily.routes[0];
  const previewMedia = previewDestination.previewMedia
    || activeFamily.previewMedia
    || cityMotionManifest.assets.systems;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? cityDestinations.filter((destination) => searchableText(destination).includes(needle)) : cityDestinations;
  }, [query]);

  const openLauncher = useCallback(() => {
    returnFocusRef.current = document.activeElement;
    const currentFamily = cityFamilies.find((family) => family.id === current?.family);
    const nextFamily = currentFamily || cityFamilies[0];
    setActiveFamilyId(nextFamily.id);
    setPreviewPath(currentFamily ? current.path : nextFamily.routes[0].path);
    setLauncherOpen(true);
  }, [current?.family, current?.path]);

  const closeLauncher = useCallback(() => {
    setLauncherOpen(false);
    setQuery('');
    setActiveIndex(0);
    requestAnimationFrame(() => returnFocusRef.current?.focus?.());
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        launcherOpen ? closeLauncher() : openLauncher();
      }
      if (event.key === 'Escape' && launcherOpen) {
        event.preventDefault();
        closeLauncher();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeLauncher, launcherOpen, openLauncher]);

  useEffect(() => {
    if (!launcherOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => { document.body.style.overflow = previousOverflow; };
  }, [launcherOpen]);

  useEffect(() => {
    setLauncherOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, [location.pathname]);

  const getFeedbackContext = useCallback(() => {
    if (feedbackContextRef.current) return feedbackContextRef.current;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    feedbackContextRef.current = new AudioContextClass();
    return feedbackContextRef.current;
  }, []);

  const playInterfaceCue = useCallback((kind) => {
    if (!soundEnabled) return;
    const context = getFeedbackContext();
    if (!context) return;
    if (context.state === 'suspended') context.resume().catch(() => {});

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequencies = { hover: 520, focus: 620, press: 180 };
    const duration = kind === 'press' ? 0.075 : 0.045;
    oscillator.type = kind === 'press' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequencies[kind] || 440, now);
    if (kind === 'press') oscillator.frequency.exponentialRampToValueAtTime(280, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === 'press' ? 0.045 : 0.018, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  }, [getFeedbackContext, soundEnabled]);

  useEffect(() => {
    const findInteractive = (target) => target instanceof Element ? target.closest(interactiveSelector) : null;
    const onPointerOver = (event) => {
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const interactive = findInteractive(event.target);
      if (!interactive || interactive === feedbackTargetRef.current || interactive.contains(event.relatedTarget)) return;
      feedbackTargetRef.current = interactive;
      playInterfaceCue('hover');
    };
    const onPointerOut = (event) => {
      const interactive = findInteractive(event.target);
      if (interactive && !interactive.contains(event.relatedTarget)) feedbackTargetRef.current = null;
    };
    const onPointerDown = (event) => {
      if (!findInteractive(event.target)) return;
      playInterfaceCue('press');
      if (event.pointerType === 'touch' && navigator.vibrate) navigator.vibrate(8);
    };
    const onFocusIn = (event) => {
      if (findInteractive(event.target)) playInterfaceCue('focus');
    };
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    document.addEventListener('pointerout', onPointerOut, { passive: true });
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('focusin', onFocusIn, { passive: true });
    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [playInterfaceCue]);

  useEffect(() => () => {
    feedbackContextRef.current?.close?.().catch(() => {});
  }, []);

  // The founder page can take over an already-playing score with its arrival
  // track. This remains gesture-safe: the handoff only starts when the visitor
  // has already enabled the global score.
  useEffect(() => {
    const onRadioArrival = (event) => {
      const soundtrack = soundtrackRef.current;
      if (!soundtrack || soundtrack.paused) return;

      event.detail?.startRoadHome?.();
      const initialVolume = soundtrack.volume || 0.28;
      const startedAt = performance.now();
      const fadeOut = (now) => {
        const progress = Math.min(1, (now - startedAt) / 1100);
        soundtrack.volume = initialVolume * (1 - progress);
        if (progress < 1) {
          requestAnimationFrame(fadeOut);
          return;
        }
        soundtrack.pause();
        soundtrack.currentTime = 0;
        soundtrack.volume = initialVolume;
      };
      requestAnimationFrame(fadeOut);
    };
    window.addEventListener('hyperion:radio-arrival', onRadioArrival);
    return () => window.removeEventListener('hyperion:radio-arrival', onRadioArrival);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const trapFocus = (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...launcherRef.current.querySelectorAll('a[href], button:not([disabled]), input')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter' && filtered[activeIndex]) {
      event.preventDefault();
      navigate(filtered[activeIndex].path);
      closeLauncher();
    }
  };

  const selectFamily = (family) => {
    setActiveFamilyId(family.id);
    setPreviewPath(family.routes[0].path);
  };

  const toggleSoundtrack = async () => {
    const soundtrack = soundtrackRef.current;
    if (!soundtrack) return;

    if (soundEnabled) {
      soundtrack.pause();
      setSoundEnabled(false);
      return;
    }

    soundtrack.volume = 0.28;
    try {
      await getFeedbackContext()?.resume?.();
      await soundtrack.play();
      setSoundEnabled(true);
    } catch {
      setSoundEnabled(false);
    }
  };

  const routeLink = (destination, index = -1, cinematic = false) => (
    <Link
      key={destination.path}
      id={index >= 0 ? `city-search-option-${index}` : undefined}
      to={destination.path}
      role={index >= 0 ? 'option' : undefined}
      aria-selected={index >= 0 ? index === activeIndex : undefined}
      className={`city-launch-route${cinematic ? ' is-cinematic' : ''}${destination.path === location.pathname ? ' is-current' : ''}${destination.path === previewDestination?.path ? ' is-preview' : ''}${index === activeIndex && query ? ' is-keyboard-active' : ''}`}
      onMouseEnter={() => setPreviewPath(destination.path)}
      onFocus={() => setPreviewPath(destination.path)}
      onClick={closeLauncher}
    >
      {cinematic && <span className="city-launch-route-index">{String(activeFamily.routes.indexOf(destination) + 1).padStart(2, '0')}</span>}
      <span className="city-launch-route-copy">
        <strong>{destination.label}</strong>
        <small>{destination.status}</small>
      </span>
      {cinematic ? <ChevronRight size={17} aria-hidden="true" /> : <ArrowUpRight size={15} aria-hidden="true" />}
    </Link>
  );

  return (
    <>
      <nav className="hi-nav" aria-label="Primary City transit">
        <Link to="/" className="nav-logo" title="Return to the City Gate">
          <img src={brandMark} alt="" className="nav-mark" />
          <span className="nav-wordmark-logo" aria-label="Hyperion Industries">
            <strong>Hyperion</strong>
            <small>Industries</small>
          </span>
        </Link>

        <div className="nav-location" aria-label="Current location">
          <span>Current location</span>
          <strong>{current?.label || 'Public Edge'}</strong>
        </div>

        <div className="nav-city-slot">
          <button
            type="button"
            className="nav-city-trigger"
            onClick={openLauncher}
            aria-haspopup="dialog"
            aria-label={`Explore Hyperion City map, ${cityFamilies.length} public districts`}
          >
            <span className="nav-city-beacon" aria-hidden="true">
              <span className="nav-city-pulse" />
              <MapPinned size={17} />
            </span>
            <span className="nav-city-copy">
              <span className="nav-city-rest">City Map</span>
              <span className="nav-city-expanded">
                <strong>Explore Hyperion City</strong>
                <small>{cityFamilies.length} public districts</small>
              </span>
            </span>
            <ChevronRight className="nav-city-arrow" size={16} aria-hidden="true" />
            <kbd><Command size={11} aria-hidden="true" />K</kbd>
          </button>
        </div>

        <div className="nav-status">
          <StatusChip label={current?.status || 'PUBLIC ROUTE'} tone={current?.tone} compact />
        </div>

        <div className="nav-controls">
          {operatorPilot.available && (
            <button
              type="button"
              onClick={operatorPilot.toggle}
              className="nav-score-button nav-operator-pilot"
              aria-pressed={operatorPilot.enabled}
              aria-label={operatorPilot.enabled ? 'Turn Operator Pilot off' : 'Turn experimental Operator Pilot on'}
              title={operatorPilot.enabled ? 'Turn Operator Pilot off' : 'Turn experimental Operator Pilot on'}
            >
              <Bot size={16} aria-hidden="true" />
              <span className="nav-score-copy"><strong>Operator</strong><small>{operatorPilot.enabled ? 'Pilot on' : 'Pilot off'}</small></span>
            </button>
          )}
          <button
            type="button"
            onClick={toggleSoundtrack}
            className="nav-score-button"
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Turn City score off' : 'Turn City score on'}
            title={soundEnabled ? 'Turn City score off' : 'Turn City score on'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="nav-score-copy"><strong>Score</strong><small>{soundEnabled ? 'On' : 'Off'}</small></span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="nav-icon-button"
            aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
            title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {isLightMode ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          <Link to="/intake" className="nav-signal-button">
            <Send size={15} aria-hidden="true" />
            <span>Start a signal</span>
          </Link>
        </div>
      </nav>

      <audio
        ref={soundtrackRef}
        src={scoreTrack.audio}
        preload="none"
        loop
        onPlay={() => setSoundEnabled(true)}
        onPause={() => setSoundEnabled(false)}
      />

      <AnimatePresence>
        {launcherOpen && (
          <motion.div
            className="city-launcher-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onMouseDown={(event) => { if (event.target === event.currentTarget) closeLauncher(); }}
          >
            <motion.section
              ref={launcherRef}
              className="city-launcher"
              role="dialog"
              aria-modal="true"
              aria-labelledby="city-launcher-title"
              onKeyDown={trapFocus}
              initial={{ opacity: 0, y: -18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
            >
              <div className="city-launcher-scene" aria-hidden="true">
                {previewMedia.type !== 'video' && (
                  <video
                    src={cityMotionManifest.assets.gate.src}
                    poster={cityMotionManifest.assets.gate.poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                )}
                <div className="city-launcher-skyline" />
                <div className="city-launcher-grid" />
              </div>

              <header className="city-launcher-head">
                <div className="city-launcher-title-lockup">
                  <img src="/assets/city/navigation/hyperion-core.jpg" alt="" />
                  <div className="city-launcher-title-copy">
                    <span>Public transit authority // Route map 01</span>
                    <h2 id="city-launcher-title">Hyperion City</h2>
                  </div>
                </div>
                <div className="city-launcher-controls">
                  {operatorPilot.available && (
                    <button
                      type="button"
                      className="city-launcher-control"
                      onClick={operatorPilot.toggle}
                      aria-pressed={operatorPilot.enabled}
                      aria-label={operatorPilot.enabled ? 'Turn Operator Pilot off' : 'Turn experimental Operator Pilot on'}
                      title={operatorPilot.enabled ? 'Turn Operator Pilot off' : 'Turn experimental Operator Pilot on'}
                    >
                      <Bot size={18} aria-hidden="true" />
                      <span>{operatorPilot.enabled ? 'Operator on' : 'Operator pilot'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="city-launcher-control"
                    onClick={toggleSoundtrack}
                    aria-pressed={soundEnabled}
                    aria-label={soundEnabled ? 'Mute Kairo score' : 'Play Kairo score'}
                    title={soundEnabled ? 'Mute Kairo score' : 'Play Kairo score'}
                  >
                    {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    <span>{soundEnabled ? 'Score active' : 'Score off'}</span>
                  </button>
                  <button type="button" className="city-launcher-control is-close" onClick={closeLauncher} aria-label="Close City map" title="Close City map">
                    <X size={20} />
                    <span>Exit</span>
                  </button>
                </div>
              </header>

              <div className="city-launcher-command">
                <div className="city-launcher-current">
                  <span>Arriving from</span>
                  <strong>{current?.label || 'Public Edge'}</strong>
                </div>
                <label className="city-launch-search">
                  <Search size={18} aria-hidden="true" />
                  <span className="sr-only">Search public City destinations</span>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={onSearchKeyDown}
                    placeholder="Search routes, systems, proof, or action"
                    autoComplete="off"
                    role="combobox"
                    aria-expanded="true"
                    aria-controls="city-search-results"
                    aria-activedescendant={query && filtered[activeIndex] ? `city-search-option-${activeIndex}` : undefined}
                  />
                  <kbd>ESC</kbd>
                </label>
                <div className="city-launcher-clock" aria-hidden="true">
                  <span>Transit state</span>
                  <strong>Public edge online</strong>
                </div>
              </div>

              <div className={`city-launcher-body${query ? ' is-searching' : ''}`}>
                {query ? (
                  <div id="city-search-results" className="city-search-results" role="listbox" aria-live="polite">
                    <div className="city-family-head">
                      <span>Search results</span>
                      <small>{filtered.length} public destinations</small>
                    </div>
                    {filtered.length ? filtered.map((destination, index) => routeLink(destination, index)) : (
                      <p className="city-search-empty">No public room matches that signal.</p>
                    )}
                  </div>
                ) : (
                  <>
                    <aside
                      className="city-transit-lines"
                      aria-label="City district lines"
                      style={{ '--city-line-count': cityFamilies.length }}
                    >
                      <span className="city-transit-label">District lines</span>
                      {cityFamilies.map((family, index) => (
                        (() => {
                          const FamilyIcon = familyIcons[family.id] || MapPinned;
                          return (
                            <button
                              key={family.id}
                              type="button"
                              className={family.id === activeFamily.id ? 'is-active' : ''}
                              onClick={() => selectFamily(family)}
                              aria-pressed={family.id === activeFamily.id}
                            >
                              <span className={`city-line-signal is-${family.id}`}>
                                <FamilyIcon size={16} strokeWidth={1.5} aria-hidden="true" />
                                <small>{String(index + 1).padStart(2, '0')}</small>
                              </span>
                              <span>
                                <strong>{family.label}</strong>
                                <small>{family.routes.length} rooms</small>
                              </span>
                              <ChevronRight size={16} aria-hidden="true" />
                            </button>
                          );
                        })()
                      ))}
                    </aside>

                    <section className={`city-route-chamber is-${activeFamily.id}`}>
                      <header className="city-route-chamber-head">
                        <div>
                          <span>Selected district</span>
                          <h3>{activeFamily.label}</h3>
                        </div>
                        <p>{activeFamily.description}</p>
                      </header>

                      <div className="city-route-chamber-grid">
                        <div className="city-route-list">
                          {activeFamily.routes.map((destination) => routeLink(destination, -1, true))}
                        </div>

                        <div className="city-route-preview">
                          <CityPreviewMedia
                            key={`${previewDestination.path}-${previewMedia.src}`}
                            media={previewMedia}
                          />
                          <div className="city-route-preview-scrim" />
                          {previewDestination.mark && (
                            <img
                              className={`city-route-preview-mark is-${previewDestination.markPlacement || 'left'}`}
                              src={previewDestination.mark}
                              alt={previewDestination.markAlt}
                            />
                          )}
                          <div className="city-route-preview-copy">
                            <span>Destination acquired</span>
                            <strong>{previewDestination.label}</strong>
                            <small>{previewDestination.status}</small>
                          </div>
                          <div className="city-route-preview-coordinates" aria-hidden="true">
                            <span>HYP // {activeFamily.id.toUpperCase()}</span>
                            <span>PUBLIC ROUTE</span>
                          </div>
                        </div>
                      </div>
                    </section>
                  </>
                )}
              </div>

              <footer className="city-launcher-foot">
                <div className="city-launch-utilities">
                  {cityUtilities.map((item) => item.href
                    ? <a key={item.label} href={item.href}>{item.label}</a>
                    : <Link key={item.label} to={item.path} onClick={closeLauncher}>{item.label}</Link>)}
                </div>
                <span>Posture visible. Authority protected.</span>
              </footer>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
