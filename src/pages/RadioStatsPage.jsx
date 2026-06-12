import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import PageShell from '../components/layout/PageShell';

const card = { background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' };
const num = { fontFamily: 'var(--font-display)', fontSize: '34px', fontWeight: 800, lineHeight: 1 };
const lbl = { fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '8px' };

function Stat({ label, value, accent }) {
  return <div style={card}><div style={{ ...num, color: accent || 'var(--text)' }}>{value}</div><div style={lbl}>{label}</div></div>;
}

export default function RadioStatsPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') || '';
    fetch('/api/stats' + (token ? `?token=${encodeURIComponent(token)}` : ''))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then(setData)
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  const t = data?.totals || {};
  const days = data?.byDay ? Object.entries(data.byDay) : [];
  const maxDay = Math.max(1, ...days.map(([, v]) => +(v.play || 0)));

  return (
    <PageShell>
      <Helmet><title>Hyperion Radio — Telemetry</title><meta name="robots" content="noindex" /></Helmet>
      <section className="section" style={{ paddingTop: '120px' }}>
        <div className="shell">
          <div className="label">Operator telemetry</div>
          <h2 className="h2" style={{ marginBottom: '8px' }}>Hyperion Radio — <em>signal trends.</em></h2>
          <p className="body-lead" style={{ marginBottom: '28px' }}>
            Anonymous engagement on the founder-page radio. {data?.note ? `(${data.note})` : ''}
          </p>

          {err && (
            <div style={{ ...card, borderColor: '#ff5555', color: '#ff8888' }}>
              Couldn’t load stats: {err}. On the live site, append <code>?token=YOUR_STATS_TOKEN</code> to the URL.
            </div>
          )}

          {data && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', marginBottom: '28px' }}>
                <Stat label="Unique listeners" value={data.uniqueSessions ?? 0} accent="var(--cyan, #21D6E8)" />
                <Stat label="Plays" value={t.play || 0} accent="var(--gold, #FFC72C)" />
                <Stat label="Completion · sticky" value={Math.round((data.completionRate || 0) * 100) + '%'} />
                <Stat label="Downloads" value={t.download || 0} />
                <Stat label="Visits" value={t.visit || 0} />
                <Stat label="Radio opens" value={t.radio_open || 0} />
              </div>

              <div style={{ ...card, marginBottom: '28px' }}>
                <div style={lbl}>Plays — last 14 days</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', marginTop: '16px' }}>
                  {days.map(([d, v]) => (
                    <div key={d} title={`${d}: ${v.play || 0} plays`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '100%', height: `${(+(v.play || 0) / maxDay) * 100}%`, minHeight: '2px', background: 'linear-gradient(180deg, var(--gold,#FFC72C), rgba(255,199,44,0.22))', borderRadius: '3px 3px 0 0' }} />
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{d.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      <th style={{ padding: '14px 18px' }}>Track</th><th>Plays</th><th>Completes</th><th>Sticky</th><th>Skips</th><th style={{ paddingRight: '18px' }}>Downloads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.tracks || []).map((tr) => (
                      <tr key={tr.id} style={{ borderTop: '1px solid var(--border)', color: 'var(--text-soft)' }}>
                        <td style={{ padding: '12px 18px', color: 'var(--text)', fontWeight: 600 }}>{tr.title}</td>
                        <td>{tr.play}</td><td>{tr.complete}</td>
                        <td>{tr.play ? Math.round((tr.complete / tr.play) * 100) + '%' : '—'}</td>
                        <td>{tr.skip}</td><td style={{ paddingRight: '18px' }}>{tr.download}</td>
                      </tr>
                    ))}
                    {(!data.tracks || data.tracks.length === 0) && (
                      <tr><td colSpan={6} style={{ padding: '18px', color: 'var(--text-muted)' }}>No track events yet — play a track to seed the data.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {!data && !err && <div style={card}>Loading telemetry…</div>}
        </div>
      </section>
    </PageShell>
  );
}
