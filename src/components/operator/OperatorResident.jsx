import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, MessageSquareText, Navigation, Power, Send, ShieldCheck, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOperatorPilot } from '../../context/OperatorPilotContext';
import { readOperatorStatus, streamOperatorChat } from './operatorApi';
import './OperatorResident.css';

const SCRIPT_SRC = '/operator-resident/hyperion-operator.iife.js';
const ASSET_BASE = '/operator-resident/assets/operator/hy60-v2';
const FALLBACK_FRAMES = [0, 1, 2, 3].map(
  (frame) => `/assets/city/operator/operator-wave-${String(frame).padStart(4, '0')}.webp`,
);
const CHAT_BUILD_ENABLED = import.meta.env.VITE_OPERATOR_CHAT_ENABLED === 'true';
const ROAM_ENABLED = import.meta.env.VITE_OPERATOR_ROAM_ENABLED === 'true';
const API_BASE = import.meta.env.VITE_OPERATOR_API_BASE || '/api/operator';
const PUBLIC_LINKS = [
  { label: 'Systems', path: '/systems' },
  { label: 'Build lanes', path: '/forge' },
  { label: 'Meet the founders', path: '/founders' },
];

export default function OperatorResident() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setEnabled } = useOperatorPilot();
  const operatorRef = useRef(null);
  const moveTimerRef = useRef(null);
  const streamAbortRef = useRef(null);
  const positionedRef = useRef(false);
  const positionRef = useRef(initialPosition());
  const [runtime, setRuntime] = useState('loading');
  const [fallbackFrame, setFallbackFrame] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [worker, setWorker] = useState({ state: 'checking', status: null });
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [position, setPositionState] = useState(positionRef.current);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 720px)').matches);
  const [lowFrameRate, setLowFrameRate] = useState(false);
  const [pageHidden, setPageHidden] = useState(document.hidden);
  const [hostInteractionBlocked, setHostInteractionBlocked] = useState(false);

  const routeContext = `${location.pathname}${location.hash}`;
  const intakePath = useMemo(() => intakePathFor(location.pathname), [location.pathname]);
  const chatReady = CHAT_BUILD_ENABLED && worker.status?.capabilities?.chat === 'ready';
  const suspended = chatOpen || mobile || lowFrameRate || pageHidden || hostInteractionBlocked || runtime === 'fallback';

  const setPosition = useCallback((next) => {
    positionRef.current = next;
    setPositionState(next);
  }, []);

  useEffect(() => {
    let canceled = false;
    loadOperatorRuntime()
      .then(() => { if (!canceled) setRuntime('ready'); })
      .catch(() => { if (!canceled) setRuntime('fallback'); });
    return () => { canceled = true; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    readOperatorStatus(API_BASE, controller.signal)
      .then((status) => setWorker({ state: status.status === 'ready' ? 'ready' : 'degraded', status }))
      .catch(() => setWorker({ state: 'offline', status: null }));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const evaluate = () => {
      const active = document.activeElement;
      const inputActive = Boolean(active?.matches?.('input, textarea, select, [contenteditable="true"]'));
      const hostModal = [...document.querySelectorAll('[role="dialog"], [aria-modal="true"]')]
        .some((node) => !node.closest('.operator-resident') && node.getClientRects().length);
      setHostInteractionBlocked(inputActive || hostModal);
    };
    const observer = new MutationObserver(evaluate);
    document.addEventListener('focusin', evaluate);
    document.addEventListener('focusout', evaluate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['open', 'hidden', 'aria-hidden'],
    });
    evaluate();
    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', evaluate);
      document.removeEventListener('focusout', evaluate);
    };
  }, []);

  useEffect(() => {
    if (runtime !== 'loading' || pageHidden) return undefined;
    const timer = window.setInterval(
      () => setFallbackFrame((frame) => (frame + 1) % FALLBACK_FRAMES.length),
      220,
    );
    return () => window.clearInterval(timer);
  }, [pageHidden, runtime]);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 720px)');
    const onPolicy = () => setMobile(mobileQuery.matches);
    mobileQuery.addEventListener('change', onPolicy);
    return () => mobileQuery.removeEventListener('change', onPolicy);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('operator-mobile-resident-active', mobile);
    return () => document.documentElement.classList.remove('operator-mobile-resident-active');
  }, [mobile]);

  useEffect(() => {
    let frameCount = 0;
    let started = performance.now();
    let raf = 0;
    const sample = (now) => {
      frameCount += 1;
      if (now - started >= 2400) {
        setLowFrameRate((frameCount * 1000) / (now - started) < 38);
        frameCount = 0;
        started = now;
      }
      raf = requestAnimationFrame(sample);
    };
    raf = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const node = operatorRef.current;
    if (!node || runtime !== 'ready') return undefined;
    node.configure?.({
      assetBasePath: ASSET_BASE,
      profile: '60fps',
      renderScale: mobile ? 0.46 : 0.82,
      resident: {
        anchor: { x: 0.5, y: 0.92 },
        prefetch: ['idle_breathe_posture_locked'],
        mobile: 'allow',
        pauseWhenDocumentHidden: true,
        tapToOpen: true,
        chatEndpoint: chatReady ? `${API_BASE}/chat` : null,
      },
    });
    const open = () => setChatOpen(true);
    node.addEventListener('operator-chat-open-request', open);
    return () => node.removeEventListener('operator-chat-open-request', open);
  }, [chatReady, mobile, runtime]);

  const play = useCallback((primary, fallback = 'idle_breathe_posture_locked') => {
    const node = operatorRef.current;
    if (!node?.play) return;
    node.play(primary);
    window.setTimeout(() => {
      const active = node.snapshot?.().animation;
      if (active !== primary && active !== fallback) node.play(fallback);
    }, 80);
  }, []);

  const moveToAnchor = useCallback((anchor, reason = 'room navigation') => {
    if (!anchor) return;
    const next = anchorPosition(anchor, mobile);
    const current = positionRef.current;
    const movingRight = next.x >= current.x;
    void operatorRef.current?.prefetch?.([
      movingRight ? 'running_right' : 'running_left',
      'waving',
      'idle_breathe_posture_locked',
    ]);
    play('city_depart', 'waving');
    window.setTimeout(
      () => play(movingRight ? 'city_walk_right' : 'city_walk_left', movingRight ? 'running_right' : 'running_left'),
      180,
    );
    setPosition({ ...next, facing: movingRight ? 'right' : 'left', reason });
    window.setTimeout(() => play('city_arrive', 'idle_breathe_posture_locked'), 960);
  }, [mobile, play, setPosition]);

  useEffect(() => {
    const settle = window.setTimeout(() => {
      const anchor = findSafeAnchors()[0] || null;
      if (anchor && !positionedRef.current) {
        positionedRef.current = true;
        setPosition({ ...anchorPosition(anchor, mobile), facing: 'right', reason: `initial route ${routeContext}` });
      } else if (anchor) {
        moveToAnchor(anchor, `route ${routeContext}`);
      }
      operatorRef.current?.syncRoute?.(routeContext);
    }, 180);
    return () => window.clearTimeout(settle);
  }, [mobile, moveToAnchor, routeContext, setPosition]);

  useEffect(() => {
    window.clearTimeout(moveTimerRef.current);
    if (suspended || !ROAM_ENABLED) {
      operatorRef.current?.pause?.(chatOpen || pageHidden || lowFrameRate || hostInteractionBlocked || runtime === 'fallback');
      return undefined;
    }
    operatorRef.current?.pause?.(false);
    const schedule = () => {
      moveTimerRef.current = window.setTimeout(() => {
        const anchors = findSafeAnchors();
        const candidate = anchors[Math.floor(Math.random() * anchors.length)];
        if (candidate) moveToAnchor(candidate, 'bounded idle roam');
        schedule();
      }, 8000 + Math.random() * 10000);
    };
    schedule();
    return () => window.clearTimeout(moveTimerRef.current);
  }, [chatOpen, hostInteractionBlocked, lowFrameRate, moveToAnchor, pageHidden, runtime, suspended]);

  useEffect(() => () => streamAbortRef.current?.abort(), []);

  const sendMessage = async (event) => {
    event.preventDefault();
    const content = prompt.trim();
    if (!content || streaming || !chatReady) return;
    const history = buildChatHistory(messages, content);
    setMessages([...history, { role: 'assistant', content: '' }]);
    setPrompt('');
    setSources([]);
    setStreaming(true);
    play('chat_think', 'think_micro');
    const controller = new AbortController();
    streamAbortRef.current = controller;
    try {
      await streamOperatorChat({
        apiBase: API_BASE,
        messages: history,
        signal: controller.signal,
        onEvent: (name, data) => {
          if (name === 'delta' && data.text) {
            play('chat_speak', 'review_breathe');
            setMessages((current) => current.map((message, index) => (
              index === current.length - 1 ? { ...message, content: message.content + data.text } : message
            )));
          }
          if (name === 'sources') setSources(Array.isArray(data.sources) ? data.sources : []);
          if (name === 'error') throw new Error(data.code || 'Operator stream failed.');
        },
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        setMessages((current) => current.map((message, index) => (
          index === current.length - 1 && !message.content
            ? { ...message, content: 'Live chat is unavailable. Guided routes and Intake OS remain available.' }
            : message
        )));
        play('inquiry_deferred', 'alert_breathe');
      }
    } finally {
      setStreaming(false);
      streamAbortRef.current = null;
      play('city_return_to_idle', 'idle_breathe_posture_locked');
    }
  };

  const statusLabel = worker.state === 'checking'
    ? 'checking public worker'
    : chatReady
      ? 'public corpus online'
      : worker.state === 'offline'
        ? 'guided mode · worker offline'
        : 'guided mode · experimental';

  return (
    <aside className={`operator-resident ${mobile ? 'is-mobile' : ''} ${chatOpen ? 'is-chat-open' : ''}`} aria-label="Hyperion Operator experimental public guide">
      <div
        className="operator-resident-stage"
        style={{ '--operator-x': `${position.x}px`, '--operator-y': `${position.y}px` }}
        data-facing={position.facing}
      >
        {runtime === 'ready' ? (
          <hyperion-operator
            ref={operatorRef}
            asset-base={ASSET_BASE}
            animation="idle_breathe_posture_locked"
            profile="60fps"
            sampling="smooth_safe"
            scale={mobile ? '0.46' : '0.82'}
            anchor="0.5,0.92"
            tap-to-open="true"
            aria-label="Open experimental Hyperion Operator guide"
          />
        ) : (
          <button className="operator-resident-fallback" type="button" onClick={() => setChatOpen(true)} aria-label="Open experimental Hyperion Operator guide">
            <img src={FALLBACK_FRAMES[runtime === 'fallback' ? 0 : fallbackFrame]} alt="" draggable="false" />
          </button>
        )}
        <button className="operator-inquiry-signal" type="button" onClick={() => setChatOpen(true)}>
          <MessageSquareText size={14} aria-hidden="true" />
          <span>Guided mode</span>
        </button>
      </div>

      {chatOpen && (
        <section className="operator-console" role="dialog" aria-modal="false" aria-labelledby="operator-console-title">
          <header>
            <div>
              <span className="operator-console-kicker">OPERATOR PILOT / EXPERIMENTAL</span>
              <h2 id="operator-console-title">Guided public route</h2>
            </div>
            <button type="button" className="operator-icon-button" onClick={() => setChatOpen(false)} aria-label="Close Operator guide">
              <X size={17} aria-hidden="true" />
            </button>
          </header>

          <div className="operator-console-status">
            <span data-state={chatReady ? 'ready' : worker.state}>{statusLabel}</span>
            <code>{routeContext}</code>
          </div>

          <div className="operator-message-log" aria-live="polite">
            {!messages.length && (
              <div className="operator-system-message">
                <ShieldCheck size={16} aria-hidden="true" />
                <p>{chatReady
                  ? 'Ask about public Hyperion systems, build lanes, operators, or routes. This pilot has no private-system or tool access.'
                  : 'Live chat is not currently configured. This pilot can guide you through public routes and open the matching Intake OS lane.'}</p>
              </div>
            )}
            {messages.map((message, index) => (
              <article key={`${message.role}-${index}`} data-role={message.role}>
                <span>{message.role === 'user' ? 'Visitor' : 'Operator'}</span>
                <p>{message.content || '...'}</p>
              </article>
            ))}
          </div>

          {!!sources.length && (
            <div className="operator-sources" aria-label="Public sources">
              {sources.slice(0, 4).map((source) => (
                <a key={source.id} href={source.href} target="_blank" rel="noreferrer">
                  {source.title}<ExternalLink size={11} aria-hidden="true" />
                </a>
              ))}
            </div>
          )}

          <div className="operator-route-links" aria-label="Guided public routes">
            {PUBLIC_LINKS.map((link) => (
              <button key={link.path} type="button" onClick={() => { navigate(link.path); setChatOpen(false); }}>
                {link.label}
              </button>
            ))}
          </div>

          {chatReady && (
            <form className="operator-prompt" onSubmit={sendMessage}>
              <label htmlFor="operator-prompt">Public question</label>
              <div>
                <textarea
                  id="operator-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value.slice(0, 1500))}
                  placeholder="Ask about a public Hyperion route..."
                  disabled={streaming}
                  rows={2}
                />
                <button type="submit" className="operator-icon-button" disabled={streaming || !prompt.trim()} aria-label="Send public question">
                  <Send size={16} aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          <div className="operator-pilot-actions">
            <button className="operator-command" type="button" onClick={() => { navigate(intakePath); setChatOpen(false); }}>
              <Navigation size={14} aria-hidden="true" />
              Open matching intake
            </button>
            <button type="button" className="operator-pilot-disable" onClick={() => setEnabled(false)}>
              <Power size={14} aria-hidden="true" />
              Turn pilot off
            </button>
          </div>
        </section>
      )}
    </aside>
  );
}

function initialPosition() {
  return { x: window.innerWidth - 178, y: window.innerHeight - 224, facing: 'left' };
}

function intakePathFor(pathname) {
  if (pathname === '/forge') return '/intake/forge';
  if (['/pandora', '/talos', '/succession', '/pandora-lite'].includes(pathname)) return '/intake/pandora';
  if (['/identity', '/card-studio', '/dxcard'].some((path) => pathname.startsWith(path))) return '/intake/operator-identity';
  if (['/chronos', '/mnemos', '/software-estate'].includes(pathname)) return '/intake/continuity';
  if (pathname === '/alignment') return '/intake/relationships';
  return '/intake/general';
}

function loadOperatorRuntime() {
  if (customElements.get('hyperion-operator')) return Promise.resolve();
  const ready = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    const script = existing || document.createElement('script');
    const onLoad = () => customElements.whenDefined('hyperion-operator').then(resolve, reject);
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', reject, { once: true });
    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.append(script);
    }
  });
  const timeout = new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error('Operator runtime load timed out.')), 6500);
  });
  return Promise.race([ready, timeout]);
}

function findSafeAnchors() {
  return [...document.querySelectorAll('[data-operator-anchor]')]
    .filter((node) => node.getClientRects().length && node.dataset.operatorActive !== 'false')
    .filter((node) => !wouldOccludeReadableContent(node));
}

function wouldOccludeReadableContent(anchor) {
  const next = anchorPosition(anchor, false);
  const candidate = { left: next.x, top: next.y, right: next.x + 176, bottom: next.y + 208 };
  const readable = document.querySelectorAll('a, button, input, textarea, select, label, h1, h2, h3, h4, p, li, dt, dd, blockquote, article, [role="tab"], [role="button"]');
  return [...readable].some((element) => {
    if (element.closest('.operator-resident')) return false;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const overlapWidth = Math.max(0, Math.min(candidate.right, rect.right) - Math.max(candidate.left, rect.left));
    const overlapHeight = Math.max(0, Math.min(candidate.bottom, rect.bottom) - Math.max(candidate.top, rect.top));
    return overlapWidth * overlapHeight > 36;
  });
}

function anchorPosition(anchor, mobile) {
  if (mobile || !anchor) return { x: window.innerWidth - 120, y: window.innerHeight - 212 };
  const rect = anchor.getBoundingClientRect();
  const width = 176;
  const height = 208;
  return {
    x: Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + rect.width / 2 - width / 2)),
    y: Math.max(72, Math.min(window.innerHeight - height - 12, rect.top + rect.height / 2 - height / 2)),
  };
}

function buildChatHistory(messages, content) {
  const candidates = [...messages, { role: 'user', content }];
  const selected = [];
  let totalChars = 0;
  for (let index = candidates.length - 1; index >= 0 && selected.length < 8; index -= 1) {
    const message = candidates[index];
    if (!message?.content || totalChars + message.content.length > 6000) break;
    selected.unshift({ role: message.role, content: message.content });
    totalChars += message.content.length;
  }
  while (selected[0]?.role !== 'user') selected.shift();
  return selected;
}
