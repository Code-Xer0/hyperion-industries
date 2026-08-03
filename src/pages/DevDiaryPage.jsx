import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import RoomShell from '../components/portal/RoomShell';
import HoverEditor from '../components/ui/HoverEditor';
import content from '../../site-content/collections/content.json';
import './SubPage.css';

const entries = [
  { tag: 'Shipped', title: 'Public site stabilization', desc: 'Core public routes, commercial lanes, proof assets, and contact paths are being tightened for real traffic.' },
  { tag: 'Building', title: 'Interactive City rooms', desc: 'The public site is moving from stacked pages into bounded rooms with explicit transit and maturity signage.' },
  { tag: 'Testing', title: 'Archive presentation', desc: 'Heavy proof collections remain in dedicated rooms so performance, focus, and context can be managed separately.' },
];

const stations = [
  { id: 'current', label: 'Current' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'next', label: 'Next' },
  { id: 'gaps', label: 'Known Gaps' },
];

export default function DevDiaryPage() {
  const panels = {
    current: <div className="room-note-grid">{entries.map((entry, index) => <DiaryEntry key={entry.title} entry={entry} index={index} />)}</div>,
    shipped: <DiaryFocus entry={entries[0]} label="Current public milestone" />,
    next: (
      <HoverEditor model="content">
        <div className="room-panel-grid">
          <div className="room-panel-copy">
            <span className="sp-label">What comes next</span>
            <h2>{content.devdiary.roadmap.title}</h2>
            <p>{content.devdiary.roadmap.desc}</p>
          </div>
          <div className="sp-panel">
            <div className="sp-chips">{['Room navigation', 'Public proof', 'Responsive QA', 'Operator handoff'].map((item) => <span key={item} className="sp-chip">{item}</span>)}</div>
          </div>
        </div>
      </HoverEditor>
    ),
    gaps: (
      <div className="room-panel-copy">
        <h2>Known gaps stay visible.</h2>
        <p>Some product captures remain withheld until private state can be removed. Store and newsletter lanes remain staged. No public checkout, account system, or command surface is implied.</p>
        <div className="room-action-row"><Link to="/intake" className="btn btn-gold">Start an Assessment</Link></div>
      </div>
    ),
  };

  return (
    <PageShell>
      <RoomShell eyebrow="Public Record / Development Diary" title="Development Diary" summary={content.devdiary.hero.lead} status="PUBLIC NOTES" tone="map" stations={stations} panels={panels} defaultStation="current" />
    </PageShell>
  );
}

function DiaryEntry({ entry, index }) {
  return (
    <article className="room-note">
      <span>{String(index + 1).padStart(2, '0')} · {entry.tag}</span>
      <h3>{entry.title}</h3>
      <p>{entry.desc}</p>
    </article>
  );
}

function DiaryFocus({ entry, label }) {
  return (
    <div className="room-panel-grid">
      <div className="room-panel-copy"><span className="sp-label">{label}</span><h2>{entry.title}</h2><p>{entry.desc}</p></div>
      <div className="sp-panel"><div className="sp-status">{entry.tag}</div><p>Public notes describe shipping posture only. Internal source, client state, and operator controls remain outside this room.</p></div>
    </div>
  );
}
