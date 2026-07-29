import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Clock3, Cpu, History, KeyRound, LoaderCircle,
  LogOut, ShieldCheck, Sparkles,
} from 'lucide-react';
import './ClientAccountPage.css';

const formatDate = (value) => {
  if (!value) return 'Time not supplied';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time not supplied';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      'content-type': 'application/json',
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || typeof body !== 'object' || Array.isArray(body)) {
    const error = new Error(body?.error?.message || 'The client room is temporarily unavailable.');
    error.code = body?.error?.code || 'client_room_unavailable';
    error.status = response.ok ? 503 : response.status;
    throw error;
  }
  return body;
}

export default function ClientAccountPage() {
  const [state, setState] = useState('loading');
  const [account, setAccount] = useState(null);
  const [history, setHistory] = useState({ events: [], builds: [] });
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('Checking for a private client-room session…');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token');
      try {
        if (token) {
          setMessage('Opening your single-use client-room link…');
          await requestJson('/api/client/magic-link/consume', {
            method: 'POST',
            body: JSON.stringify({ token }),
          });
          url.searchParams.delete('token');
          window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
        }
        const [accountPayload, historyPayload] = await Promise.all([
          requestJson('/api/client/account'),
          requestJson('/api/client/history'),
        ]);
        if (!active) return;
        setAccount(accountPayload);
        setHistory(historyPayload);
        setState('authenticated');
        setMessage('This room shows only records HypRM has marked client-visible.');
      } catch (error) {
        if (!active) return;
        setAccount(null);
        setHistory({ events: [], builds: [] });
        if (error.status === 401) {
          setState(token ? 'invalid_link' : 'signed_out');
          setMessage(token
            ? 'That link has expired or was already used. Request a fresh one below.'
            : 'Use a private email link to enter your client room.');
        } else if (error.code === 'client_gateway_unconfigured') {
          setState('unavailable');
          setMessage('Managed client-room access has not been activated on this deployment yet.');
        } else {
          setState('unavailable');
          setMessage(error.message);
        }
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const requestLink = async (event) => {
    event.preventDefault();
    setState('requesting');
    setMessage('Preparing a single-use access link…');
    try {
      const result = await requestJson('/api/client/magic-link', {
        method: 'POST',
        headers: { 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({ email, display_name: displayName }),
      });
      setState('sent');
      setMessage(result.message || 'If the address is eligible, a private link is on its way.');
      setEmail('');
    } catch (error) {
      setState(error.code === 'client_gateway_unconfigured' ? 'unavailable' : 'signed_out');
      setMessage(error.message);
    }
  };

  const signOut = async () => {
    setState('loading');
    setMessage('Closing the client room…');
    await requestJson('/api/client/logout', { method: 'POST', body: '{}' }).catch(() => null);
    setAccount(null);
    setHistory({ events: [], builds: [] });
    setState('signed_out');
    setMessage('You are signed out. This browser no longer holds the client-room session.');
  };

  const signedIn = state === 'authenticated';
  const accountName = account?.account?.display_name || 'Hyperion client';

  return (
    <main className="client-room">
      <Helmet>
        <title>Private Client Room | Hyperion Industries</title>
        <meta name="description" content="Private Hyperion client history and saved-build references, projected from HypRM." />
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href="https://hyperion-industries.dev/account" />
      </Helmet>
      <div className="client-room-shell">
        <header className="client-room-hero">
          <div>
            <Link to="/"><ArrowLeft size={14} />Return to the city</Link>
            <span>HYPERION // PRIVATE CLIENT ROOM</span>
            <h1>{signedIn ? `Welcome back, ${accountName}.` : 'Your build history, without the back-office noise.'}</h1>
            <p>{signedIn
              ? 'Saved-build references and approved milestones stay tied to your HypRM relationship record. Engineering and pricing authority remain in their own systems.'
              : 'A single-use email link opens a 14-day HttpOnly session. No password, CRM record, or secret token is stored in browser JavaScript.'}</p>
          </div>
          <aside>
            <ShieldCheck />
            <span>Authority boundary</span>
            <strong>HypRM projection</strong>
            <small>Client-visible records only · no internal notes</small>
          </aside>
        </header>

        <section className="client-room-status" data-state={state} aria-live="polite">
          {['loading', 'requesting'].includes(state)
            ? <LoaderCircle className="client-room-spin" />
            : state === 'authenticated' || state === 'sent'
              ? <Check />
              : <KeyRound />}
          <p>{message}</p>
          {signedIn && <button type="button" onClick={signOut}><LogOut size={14} />Sign out</button>}
        </section>

        {!signedIn && (
          <section className="client-room-entry">
            <div>
              <span>PRIVATE ENTRY // MAGIC LINK</span>
              <h2>No password to remember.</h2>
              <p>Enter the email you use with Hyperion. The link expires in 15 minutes and works once.</p>
              <div className="client-room-boundaries">
                <p><ShieldCheck />Email and relationship truth stay in HypRM.</p>
                <p><Clock3 />Session unlocks expire after 14 days.</p>
                <p><Sparkles />Unknown or unavailable history is never filled with guesses.</p>
              </div>
            </div>
            <form onSubmit={requestLink}>
              <label>
                <span>Name <small>optional</small></span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  autoComplete="name"
                  maxLength={80}
                  placeholder="How should we greet you?"
                />
              </label>
              <label>
                <span>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  maxLength={254}
                  required
                  placeholder="you@example.com"
                />
              </label>
              <button type="submit" disabled={state === 'requesting' || state === 'unavailable'}>
                {state === 'requesting' ? 'Preparing link…' : 'Email my private link'}
                <ArrowRight size={15} />
              </button>
              <small>The response is deliberately generic so this page cannot reveal who already has a Hyperion relationship.</small>
            </form>
          </section>
        )}

        {signedIn && (
          <div className="client-room-grid">
            <section>
              <header><Cpu /><div><span>SAVED SYSTEMS</span><h2>Build references</h2></div></header>
              <div className="client-room-list">
                {history.builds.map((build) => (
                  <article key={build.build_ref_id}>
                    <div><span>{build.source_system} · {build.state.replaceAll('_', ' ')}</span><h3>{build.title}</h3></div>
                    <p>{formatDate(build.last_event_at)}</p>
                    <small>Revision {build.latest_revision_hash?.slice(0, 16) || 'unresolved'}…</small>
                  </article>
                ))}
                {!history.builds.length && <div className="client-room-empty"><Cpu /><strong>No client-visible build references yet.</strong><p>A local browser draft is not a CRM record and will not appear here until an operator-approved handoff.</p></div>}
              </div>
            </section>
            <section>
              <header><History /><div><span>CURATED HISTORY</span><h2>Milestones</h2></div></header>
              <div className="client-room-list">
                {history.events.map((item) => (
                  <article key={item.history_event_id}>
                    <div><span>{item.domain} · {item.state.replaceAll('_', ' ')}</span><h3>{item.title}</h3></div>
                    <p>{item.summary || 'No additional client-safe detail was supplied.'}</p>
                    <small>{formatDate(item.occurred_at)}</small>
                  </article>
                ))}
                {!history.events.length && <div className="client-room-empty"><History /><strong>No client-visible milestones yet.</strong><p>Internal notes and unapproved operational records are intentionally absent.</p></div>}
              </div>
            </section>
          </div>
        )}

        <footer className="client-room-footer">
          <KeyRound />
          <span>HypRM owns identity and relationship truth. HypOM and Pandora own their engineering revisions. This room stores neither domain.</span>
        </footer>
      </div>
    </main>
  );
}
