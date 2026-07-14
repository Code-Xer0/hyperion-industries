import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, MessageSquareText, Send, ShieldCheck, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { readOperatorStatus, streamOperatorChat, submitOperatorInquiry } from './operatorApi';
import './OperatorResident.css';

const SCRIPT_SRC = '/operator-resident/hyperion-operator.iife.js';
const ASSET_BASE = '/operator-resident/assets/operator/hy60-v2';
const FALLBACK_FRAMES = [0, 1, 2, 3].map(
  (frame) => `/assets/city/operator/operator-wave-${String(frame).padStart(4, '0')}.webp`,
);
const RESIDENT_ENABLED = import.meta.env.VITE_OPERATOR_RESIDENT_ENABLED !== 'false';
const CHAT_ENABLED = import.meta.env.VITE_OPERATOR_CHAT_ENABLED === 'true';
const API_BASE = import.meta.env.VITE_OPERATOR_API_BASE || '/api/operator';
const PUBLIC_LINKS = [
  { label: 'Systems', path: '/systems' },
  { label: 'Build lanes', path: '/forge' },
  { label: 'Contact', path: '/contact' },
];
const EMPTY_INQUIRY = {
  name: '',
  email: '',
  organization: '',
  inquiryType: 'contact',
  timeline: '',
  budget: '',
  message: '',
  website: '',
  consent: false,
};

export default function OperatorResident() {
  const location = useLocation();
  const navigate = useNavigate();
  const operatorRef = useRef(null);
  const moveTimerRef = useRef(null);
  const streamAbortRef = useRef(null);
  const positionedRef = useRef(false);
  const [runtime, setRuntime] = useState('loading');
  const [fallbackFrame, setFallbackFrame] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatStatus, setChatStatus] = useState(CHAT_ENABLED ? 'checking' : 'preview');
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [inquiryMode, setInquiryMode] = useState('closed');
  const [inquiry, setInquiry] = useState(EMPTY_INQUIRY);
  const [inquiryResult, setInquiryResult] = useState(null);
  const [position, setPosition] = useState({ x: window.innerWidth - 178, y: window.innerHeight - 224, facing: 'left' });
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 720px)').matches);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [dataSaver, setDataSaver] = useState(() => Boolean(navigator.connection?.saveData));
  const [lowFrameRate, setLowFrameRate] = useState(false);
  const [pageHidden, setPageHidden] = useState(document.hidden);
  const [hostInteractionBlocked, setHostInteractionBlocked] = useState(false);

  const routeContext = `${location.pathname}${location.hash}`;
  const suspended = chatOpen || mobile || reducedMotion || dataSaver || lowFrameRate || pageHidden || hostInteractionBlocked;
  const showFallback = runtime !== 'ready' || reducedMotion;

  useEffect(() => {
    if (!RESIDENT_ENABLED) return undefined;
    let canceled = false;
    loadOperatorRuntime()
      .then(() => { if (!canceled) setRuntime('ready'); })
      .catch(() => { if (!canceled) setRuntime('fallback'); });
    return () => { canceled = true; };
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
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'hidden', 'aria-hidden'] });
    evaluate();
    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', evaluate);
      document.removeEventListener('focusout', evaluate);
    };
  }, []);

  useEffect(() => {
    if (!showFallback || document.hidden) return undefined;
    const timer = window.setInterval(() => setFallbackFrame((frame) => (frame + 1) % FALLBACK_FRAMES.length), 220);
    return () => window.clearInterval(timer);
  }, [showFallback]);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 720px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPolicy = () => {
      setMobile(mobileQuery.matches);
      setReducedMotion(motionQuery.matches);
      setDataSaver(Boolean(navigator.connection?.saveData));
    };
    mobileQuery.addEventListener('change', onPolicy);
    motionQuery.addEventListener('change', onPolicy);
    navigator.connection?.addEventListener?.('change', onPolicy);
    return () => {
      mobileQuery.removeEventListener('change', onPolicy);
      motionQuery.removeEventListener('change', onPolicy);
      navigator.connection?.removeEventListener?.('change', onPolicy);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('operator-mobile-resident-active', RESIDENT_ENABLED && mobile);
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
        reducedMotion: 'static',
        mobile: 'allow',
        pauseWhenDocumentHidden: true,
        tapToOpen: true,
        chatEndpoint: CHAT_ENABLED ? `${API_BASE}/chat` : null,
      },
    });
    const open = () => setChatOpen(true);
    node.addEventListener('operator-chat-open-request', open);
    return () => node.removeEventListener('operator-chat-open-request', open);
  }, [mobile, runtime]);

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
    const current = position;
    const movingRight = next.x >= current.x;
    if (!reducedMotion) {
      void operatorRef.current?.prefetch?.([
        movingRight ? 'running_right' : 'running_left',
        'waving',
        'idle_breathe_posture_locked',
      ]);
      play('city_depart', 'waving');
      window.setTimeout(() => play(movingRight ? 'city_walk_right' : 'city_walk_left', movingRight ? 'running_right' : 'running_left'), 180);
    }
    setPosition({ ...next, facing: movingRight ? 'right' : 'left', reason });
    window.setTimeout(() => play('city_arrive', 'idle_breathe_posture_locked'), reducedMotion ? 0 : 960);
  }, [mobile, play, position, reducedMotion]);

  useEffect(() => {
    if (!RESIDENT_ENABLED) return undefined;
    const settle = window.setTimeout(() => {
      const anchors = findSafeAnchors();
      const anchor = anchors[0] || null;
      if (anchor && !positionedRef.current) {
        positionedRef.current = true;
        setPosition({ ...anchorPosition(anchor, mobile), facing: 'right', reason: `initial route ${routeContext}` });
      } else {
        moveToAnchor(anchor, `route ${routeContext}`);
      }
      operatorRef.current?.syncRoute?.(routeContext);
    }, 180);
    return () => window.clearTimeout(settle);
  }, [mobile, moveToAnchor, routeContext]);

  useEffect(() => {
    window.clearTimeout(moveTimerRef.current);
    if (!RESIDENT_ENABLED || suspended) {
      operatorRef.current?.pause?.(chatOpen || pageHidden);
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
  }, [chatOpen, moveToAnchor, pageHidden, suspended]);

  useEffect(() => {
    if (!chatOpen || !CHAT_ENABLED) return undefined;
    const controller = new AbortController();
    readOperatorStatus(API_BASE, controller.signal)
      .then((status) => setChatStatus(status.status === 'ready' ? 'ready' : 'degraded'))
      .catch(() => setChatStatus('offline'));
    return () => controller.abort();
  }, [chatOpen]);

  useEffect(() => () => streamAbortRef.current?.abort(), []);

  const sendMessage = async (event) => {
    event.preventDefault();
    const content = prompt.trim();
    if (!content || streaming || !CHAT_ENABLED) return;
    const history = buildChatHistory(messages, content);
    setMessages([...history, { role: 'assistant', content: '' }]);
    setPrompt('');
    setSources([]);
    setStreaming(true);
    setChatStatus('streaming');
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
          if (name === 'done') setChatStatus('ready');
          if (name === 'error') throw new Error(data.code || 'Operator stream failed.');
        },
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        setChatStatus('degraded');
        setMessages((current) => current.map((message, index) => (
          index === current.length - 1 && !message.content
            ? { ...message, content: 'Live chat is unavailable. I can still route you through the public site or prepare an inquiry for review.' }
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

  const updateInquiry = (event) => {
    const { name, value, type, checked } = event.target;
    setInquiry((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const reviewInquiry = (event) => {
    event.preventDefault();
    setInquiryMode('review');
    play('inquiry_review', 'review_breathe');
  };

  const submitInquiry = async () => {
    if (!CHAT_ENABLED || inquiryMode !== 'review') return;
    setInquiryMode('submitting');
    setInquiryResult(null);
    try {
      const result = await submitOperatorInquiry({
        apiBase: API_BASE,
        inquiry: { ...inquiry, sourcePath: location.pathname },
      });
      setInquiryResult(result);
      setInquiryMode('complete');
      play('inquiry_submitted', 'success');
    } catch (error) {
      setInquiryResult({ status: 'rejected', message: error.message });
      setInquiryMode('review');
      play('inquiry_deferred', 'failed_recover_breathe');
    }
  };

  const statusLabel = useMemo(() => {
    if (!CHAT_ENABLED) return 'chat preview';
    if (chatStatus === 'ready') return 'public corpus online';
    if (chatStatus === 'streaming') return 'responding';
    return chatStatus;
  }, [chatStatus]);

  if (!RESIDENT_ENABLED) return null;

  return (
    <aside className={`operator-resident ${mobile ? 'is-mobile' : ''} ${chatOpen ? 'is-chat-open' : ''}`} aria-label="Hyperion Operator public assistant">
      <div
        className="operator-resident-stage"
        style={{ '--operator-x': `${position.x}px`, '--operator-y': `${position.y}px` }}
        data-facing={position.facing}
      >
        {runtime === 'ready' && !reducedMotion ? (
          <hyperion-operator
            ref={operatorRef}
            asset-base={ASSET_BASE}
            animation="idle_breathe_posture_locked"
            profile="60fps"
            sampling="smooth_safe"
            scale={mobile ? '0.46' : '0.82'}
            anchor="0.5,0.92"
            tap-to-open="true"
            aria-label="Open Hyperion public inquiry assistant"
          />
        ) : (
          <button className="operator-resident-fallback" type="button" onClick={() => setChatOpen(true)} aria-label="Open Hyperion public inquiry assistant">
            <img src={FALLBACK_FRAMES[reducedMotion ? 0 : fallbackFrame]} alt="" draggable="false" />
          </button>
        )}
        <button className="operator-inquiry-signal" type="button" onClick={() => setChatOpen(true)}>
          <MessageSquareText size={14} aria-hidden="true" />
          <span>Public inquiry</span>
        </button>
      </div>

      {chatOpen && (
        <section className="operator-console" role="dialog" aria-modal="false" aria-labelledby="operator-console-title">
          <header>
            <div>
              <span className="operator-console-kicker">OPERATOR / CITY RESIDENT</span>
              <h2 id="operator-console-title">Public inquiry channel</h2>
            </div>
            <button type="button" className="operator-icon-button" onClick={() => setChatOpen(false)} aria-label="Close public inquiry channel">
              <X size={17} aria-hidden="true" />
            </button>
          </header>

          <div className="operator-console-status">
            <span data-state={chatStatus}>{statusLabel}</span>
            <code>{routeContext}</code>
          </div>

          {inquiryMode === 'closed' ? (
            <>
              <div className="operator-message-log" aria-live="polite">
                {!messages.length && (
                  <div className="operator-system-message">
                    <ShieldCheck size={16} aria-hidden="true" />
                    <p>{CHAT_ENABLED
                      ? 'Ask about public Hyperion systems, build lanes, operators, or contact routes. This channel has no private-system or tool access.'
                      : 'The resident is live in preview mode. Model chat remains disabled until the public Worker is deployed.'}</p>
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

              <div className="operator-route-links" aria-label="Public route fallback">
                {PUBLIC_LINKS.map((link) => (
                  <button key={link.path} type="button" onClick={() => { navigate(link.path); setChatOpen(false); }}>
                    {link.label}
                  </button>
                ))}
              </div>

              <form className="operator-prompt" onSubmit={sendMessage}>
                <label htmlFor="operator-prompt">Public question</label>
                <div>
                  <textarea
                    id="operator-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value.slice(0, 1500))}
                    placeholder={CHAT_ENABLED ? 'Ask about a public Hyperion route...' : 'Chat activates after the Worker is live.'}
                    disabled={!CHAT_ENABLED || streaming}
                    rows={2}
                  />
                  <button type="submit" className="operator-icon-button" disabled={!CHAT_ENABLED || streaming || !prompt.trim()} aria-label="Send public question">
                    <Send size={16} aria-hidden="true" />
                  </button>
                </div>
              </form>

              <button className="operator-command" type="button" onClick={() => { setInquiryMode('edit'); play('inquiry_offer', 'waving'); }}>
                Prepare a reviewed inquiry
              </button>
            </>
          ) : (
            <InquiryCard
              mode={inquiryMode}
              inquiry={inquiry}
              result={inquiryResult}
              enabled={CHAT_ENABLED}
              onChange={updateInquiry}
              onReview={reviewInquiry}
              onSubmit={submitInquiry}
              onEdit={() => setInquiryMode('edit')}
              onBack={() => setInquiryMode('closed')}
            />
          )}
        </section>
      )}
    </aside>
  );
}

function InquiryCard({ mode, inquiry, result, enabled, onChange, onReview, onSubmit, onEdit, onBack }) {
  if (mode === 'complete') {
    return (
      <div className="operator-inquiry-result">
        <span>{result?.status || 'submitted'}</span>
        <h3>Inquiry recorded</h3>
        <p>{result?.notification === 'notification_pending'
          ? 'The inquiry is stored. Mail notification is pending and has not been represented as complete.'
          : 'The reviewed inquiry was accepted by the public intake channel.'}</p>
        <button className="operator-command" type="button" onClick={onBack}>Return to chat</button>
      </div>
    );
  }

  if (mode === 'review' || mode === 'submitting') {
    return (
      <div className="operator-inquiry-review">
        <span>Explicit review required</span>
        <dl>
          <dt>Name</dt><dd>{inquiry.name}</dd>
          <dt>Email</dt><dd>{inquiry.email}</dd>
          <dt>Category</dt><dd>{inquiry.inquiryType.replaceAll('_', ' ')}</dd>
          <dt>Timeline</dt><dd>{inquiry.timeline || 'Not provided'}</dd>
          <dt>Budget</dt><dd>{inquiry.budget || 'Not provided'}</dd>
          <dt>Summary</dt><dd>{inquiry.message}</dd>
        </dl>
        {result?.message && <p className="operator-form-error">{result.message}</p>}
        <div className="operator-review-actions">
          <button type="button" onClick={() => onBack()}>Cancel</button>
          <button type="button" onClick={onEdit}>Edit</button>
          <button className="operator-command" type="button" onClick={onSubmit} disabled={!enabled || mode === 'submitting'}>
            {mode === 'submitting' ? 'Submitting...' : 'Confirm and submit'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="operator-inquiry-form" onSubmit={onReview}>
      <div className="operator-form-heading">
        <span>Draft only</span>
        <p>Nothing is submitted until the next review screen is confirmed.</p>
      </div>
      <div className="operator-field-grid">
        <label>Name<input name="name" value={inquiry.name} onChange={onChange} maxLength={120} required /></label>
        <label>Email<input name="email" type="email" value={inquiry.email} onChange={onChange} maxLength={254} required /></label>
        <label>Organization<input name="organization" value={inquiry.organization} onChange={onChange} maxLength={160} /></label>
        <label>Category<select name="inquiryType" value={inquiry.inquiryType} onChange={onChange}>
          <option value="contact">General contact</option>
          <option value="field_work">Field work</option>
          <option value="card_studio_order">Card Studio</option>
          <option value="beta_access">Beta access</option>
          <option value="demo_request">Demo request</option>
          <option value="chronos_beta_issue">CHR0N.OS beta issue</option>
          <option value="partnership_funding">Partnership or funding</option>
        </select></label>
        <label>Timeline<input name="timeline" value={inquiry.timeline} onChange={onChange} maxLength={120} /></label>
        <label>Budget<input name="budget" value={inquiry.budget} onChange={onChange} maxLength={120} /></label>
      </div>
      <label>Summary<textarea name="message" value={inquiry.message} onChange={onChange} minLength={10} maxLength={6000} rows={5} required /></label>
      <label className="operator-consent"><input name="consent" type="checkbox" checked={inquiry.consent} onChange={onChange} required /> I consent to Hyperion contacting me about this inquiry.</label>
      <label className="operator-honeypot" aria-hidden="true">Website<input name="website" value={inquiry.website} onChange={onChange} tabIndex={-1} autoComplete="off" /></label>
      <div className="operator-review-actions">
        <button type="button" onClick={onBack}>Cancel</button>
        <button className="operator-command" type="submit">Review inquiry</button>
      </div>
    </form>
  );
}

function loadOperatorRuntime() {
  if (customElements.get('hyperion-operator')) return Promise.resolve();
  const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.append(script);
  });
}

function findSafeAnchors() {
  return [...document.querySelectorAll('[data-operator-anchor]')]
    .filter((node) => node.getClientRects().length && node.dataset.operatorActive !== 'false')
    .filter((node) => !wouldOccludeReadableContent(node));
}

function wouldOccludeReadableContent(anchor) {
  const position = anchorPosition(anchor, false);
  const candidate = {
    left: position.x,
    top: position.y,
    right: position.x + 176,
    bottom: position.y + 208,
  };
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
