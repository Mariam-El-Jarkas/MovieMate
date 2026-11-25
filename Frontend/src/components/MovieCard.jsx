import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { Poster, ScoreRow, MiniAvatars } from './ui.jsx';
import { QUESTIONS } from '../data.js';

// ID-card style card for a watched movie (my review on the right).
export default function MovieCard({ entry, compact = false }) {
  const { movie, user } = useStore();
  const m = movie(entry.movieId);
  const mine = entry.reviews.me;
  const others = entry.participants.filter((p) => p !== 'me').map(user);
  const rows = mine && mine.type === 'full' ? QUESTIONS.filter((q) => mine.scores[q.k]).slice(0, compact ? 3 : 4) : [];
  return (
    <Link to={`/movie/${entry.id}`} className="card idcard">
      <Poster movie={m} w={compact ? 110 : 140} h={compact ? 160 : 200} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row between" style={{ gap: 8, alignItems: 'flex-start' }}><h3>{m.title}</h3>{mine ? <span className="avg">{mine.overall.toFixed(1)}</span> : null}</div>
        <div style={{ marginTop: 8 }}><span className="chip">{m.genre}</span>{mine?.type === 'quick' ? <span className="chip">Quick score</span> : null}</div>
        {rows.map((q) => <ScoreRow key={q.k} label={q.l} value={mine.scores[q.k]} />)}
        {mine?.type === 'quick' && mine.note ? <p className="small" style={{ marginTop: 12 }}>{mine.note}</p> : null}
        <div className="row small" style={{ marginTop: 14 }}>
          {others.length ? <><MiniAvatars users={others} /><span style={{ marginLeft: 10 }}>with {others.map((o) => o.name).join(', ')}</span></> : 'Watched alone'}
        </div>
      </div>
    </Link>
  );
}
