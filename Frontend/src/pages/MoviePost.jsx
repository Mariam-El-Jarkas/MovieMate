import { Link, Navigate, useParams } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { QUESTIONS, avg, COLORS } from '../data.js';
import { Poster } from '../components/ui.jsx';

export default function MoviePost() {
  const { entryId } = useParams();
  const { entries, movie, user } = useStore();
  const e = entries.find((x) => x.id === entryId);
  if (!e) return <Navigate to="/" replace />;
  const m = movie(e.movieId);
  const reviews = e.participants.map((id) => e.reviews[id]);
  const people = e.participants.map(user);
  const reviewed = reviews.filter(Boolean);
  const groupAvg = avg(reviewed.map((r) => r.overall));
  const rewatch = reviewed.filter((r) => (r.type === 'full' ? r.scores.rewatch >= 8 : r.tags.includes('Rewatchable'))).length;
  const iAmIn = e.participants.includes('me');
  const needsMine = iAmIn && !e.reviews.me;
  const owner = user(e.owner);
  const cell = (r, k) => (r && r.type === 'full' && r.scores[k] ? r.scores[k] : '-');
  return (
    <div className="w" style={{ paddingTop: 40 }}>
      {needsMine && (
        <div className="card row between pad" style={{ background: '#FFF6D6', padding: '20px 24px', gap: 12, flexWrap: 'wrap' }}>
          <span><b>{owner.name}</b> added you to a movie experience for <b>{m.title}</b>.</span>
          <Link to={`/movie/${e.id}/review`} className="btn" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#0E0E10' }}>Add Your Review</Link>
        </div>
      )}
      <div className="row" style={{ gap: 32, marginTop: needsMine ? 32 : 0, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Poster movie={m} w={260} h={380} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <span className="chip">{m.genre}</span>
          <h1 className="h1" style={{ marginTop: 12 }}>{m.title}</h1>
          <p className="small" style={{ fontSize: 16 }}>{people.length > 1 ? `Watched together by ${people.map((p) => p.name).join(', ')}` : 'Watched alone'}</p>
          <div className="row gap" style={{ marginTop: 24, flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: '16px 24px' }}><div className="small">{people.length > 1 ? 'Group average' : 'Your score'}</div><b style={{ fontSize: 32 }}>{groupAvg ? groupAvg.toFixed(1) : '-'}</b></div>
            <div className="card" style={{ padding: '16px 24px' }}><div className="small">Would rewatch</div><b style={{ fontSize: 32 }}>{rewatch} of {reviewed.length}</b></div>
          </div>
        </div>
      </div>
      <div className="row between" style={{ margin: '32px 0 16px', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 26 }}>{people.length > 1 ? "Everyone's ratings" : 'Your rating'}</h2>
        {iAmIn && <Link to={`/movie/${e.id}/review`} className={e.reviews.me ? 'ghost' : 'btn'} style={e.reviews.me ? undefined : { display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#0E0E10' }}>{e.reviews.me ? 'Edit my review' : 'Add your review'}</Link>}
      </div>
      <div className="card" style={{ padding: '24px 32px', overflowX: 'auto' }}>
        <div className="cmp" style={{ gridTemplateColumns: `minmax(112px, 1.2fr) repeat(${people.length}, minmax(130px, 1fr))`, minWidth: 112 + people.length * 130 }}>
          <div className="hd label" />
          {people.map((p, i) => (
            <div key={p.id} className="hd reviewer-head">
              <div className="reviewer-name"><span className="mini" style={{ background: COLORS[i % 4], margin: 0 }}>{p.name[0]}</span><b>{p.name}{p.id === 'me' ? ' (you)' : ''}</b></div>
              <span className={'chip' + (reviews[i] ? '' : ' yellow')} style={{ margin: 0 }}>{reviews[i] ? (reviews[i].type === 'full' ? 'Full review' : 'Quick score') : 'Not rated yet'}</span>
            </div>
          ))}
          {QUESTIONS.map((q) => [<div key={q.k} className="label">{q.l}</div>, ...reviews.map((r, i) => <div key={q.k + i} className={`value${cell(r, q.k) === '-' ? ' muted' : ''}`}>{cell(r, q.k)}</div>)])}
          <div className="ov label">Overall</div>
          {reviews.map((r, i) => <div key={i} className="ov value">{r ? r.overall.toFixed(1).replace('.0', '') : '-'}</div>)}
          <div className="label">Note</div>
          {reviews.map((r, i) => <div key={i} className="review-note">{r && (r.note || r.tags.length) ? <>{r.note}<div className="review-tags">{r.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div></> : <span className="muted">-</span>}</div>)}
        </div>
        <div className="small" style={{ marginTop: 12 }}>Quick scores show a dash for each question. You can only edit your own review.</div>
      </div>
    </div>
  );
}
