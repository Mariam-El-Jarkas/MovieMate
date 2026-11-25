import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { QUESTIONS, GROUPS, TAGS, avg } from '../data.js';
import { Poster } from '../components/ui.jsx';
import RatingSlider from '../components/RatingSlider.jsx';

const WORDS = ['', 'Poor', 'Poor', 'Weak', 'Weak', 'Okay', 'Okay', 'Good', 'Great', 'Loved it', 'Masterpiece'];

export default function ReviewFlow() {
  const { entryId } = useParams();
  const [sp] = useSearchParams();
  const location = useLocation();
  const nav = useNavigate();
  const { entries, movie, friends, user, addEntry, saveReview } = useStore();
  const existing = entries.find((e) => e.id === entryId);
  const mv = existing ? movie(existing.movieId) : location.state?.movie || movie(sp.get('movie'));
  const mine = existing?.reviews.me;
  const first = existing ? 1 : 0;

  const [step, setStep] = useState(first);
  const [mode, setMode] = useState('steps'); // steps | quick | done
  const [withIds, setWithIds] = useState([]);
  const [friendQuery, setFriendQuery] = useState('');
  const [alone, setAlone] = useState(true);
  const [scores, setScores] = useState(mine?.scores || {});
  const [overall, setOverall] = useState(mine?.type === 'quick' ? mine.overall : 8);
  const [tags, setTags] = useState(mine?.tags || []);
  const [note, setNote] = useState(mine?.note || '');
  const [savedId, setSavedId] = useState(existing?.id);
  const [final, setFinal] = useState(null);

  if (!mv) return <Navigate to="/" replace />;
  const total = existing ? 3 : 4;
  const shown = step - first + 1;
  const toggle = (id) => setWithIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const searchTerm = friendQuery.trim().toLowerCase().replace(/^@/, '');
  const matchingFriends = friends.filter((id) => {
    const person = user(id);
    return !withIds.includes(id) && (`${person.name} ${person.username}`).toLowerCase().includes(searchTerm);
  });

  const persist = async (review) => {
    const id = existing ? existing.id : await addEntry(mv, alone ? [] : withIds);
    if (!id) return;
    const saved = await saveReview(id, review);
    if (!saved) return;
    setSavedId(id); setFinal(review); setMode('done');
  };
  const submitFull = () => {
    const vals = Object.values(scores);
    if (!vals.length) { setMode('quick'); return; } // skipped everything: offer the quick score
    persist({ type: 'full', scores, overall: avg(vals), note: '', tags: [] });
  };
  const submitQuick = () => persist({ type: 'quick', scores: {}, overall, note, tags });

  const Header = ({ title, label }) => (
    <>
      <div className="row" style={{ gap: 16 }}>
        <Poster movie={mv} w={48} h={72} label={false} />
        <div><div className="small">{mv.title} - {label}</div><h1 className="h1" style={{ fontSize: 30 }}>{title}</h1></div>
      </div>
    </>
  );
  const Dots = ({ n }) => <div className="row" style={{ gap: 6, margin: '20px 0 6px' }}>{Array.from({ length: total }).map((_, i) => <span key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < n ? '#FFC93C' : '#E6E2D8' }} />)}</div>;

  let body;
  if (mode === 'done') {
    body = (
      <>
        <Header title="Review submitted" label="All done" />
        <Dots n={total} />
        <div className="review-result" style={{ textAlign: 'center', padding: '24px 0' }}>
          <span className="avg" style={{ display: 'inline-block', fontSize: 56, padding: '16px 32px' }}>{final.overall.toFixed(1)}</span>
          <p style={{ fontSize: 18, margin: '16px 0 4px' }}><b>Your score for {mv.title}</b></p>
          <p className="small" style={{ fontSize: 15 }}>{!existing && !alone && withIds.length ? `${withIds.map((i) => user(i).name).join(' and ')} will be notified and can add their own review.` : 'Nice. It is in your library.'}</p>
        </div>
        <div className="row between review-result-actions" style={{ marginTop: 20 }}>
          <Link to="/" className="ghost">Add another movie</Link>
          <Link to={`/movie/${savedId}`} className="btn" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#0E0E10' }}>View movie post</Link>
        </div>
      </>
    );
  } else if (mode === 'quick') {
    body = (
      <>
        <Header title="Short on time?" label="Quick review" />
        <p className="small" style={{ fontSize: 15, marginTop: 16 }}>Give it one score. You can add the details later.</p>
        <div style={{ textAlign: 'center', margin: '28px 0 8px' }}><span style={{ fontSize: 96, fontWeight: 700, lineHeight: 1 }}>{overall}</span><span style={{ fontSize: 28, color: '#4A473F' }}>/10</span><div style={{ fontSize: 20, fontWeight: 600 }}>{WORDS[overall]}</div></div>
        <div style={{ marginTop: 36 }}><RatingSlider big value={overall} onChange={setOverall} label="Overall score" /></div>
        <div className="row between small" style={{ marginTop: 26 }}><span>1 Poor</span><span>10 Great</span></div>
        <h2 style={{ fontSize: 18, margin: '28px 0 12px' }}>What stood out? <span className="small" style={{ fontWeight: 400 }}>(optional)</span></h2>
        <div>{TAGS.map((t) => <button key={t} className={'chip' + (tags.includes(t) ? ' on' : '')} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</button>)}</div>
        <label className="f" htmlFor="nt" style={{ fontSize: 18 }}>One line about it <span className="small" style={{ fontWeight: 400 }}>(optional)</span></label>
        <textarea id="nt" className="in" style={{ marginTop: 10 }} maxLength={140} placeholder="What did you think in one line?" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="small" style={{ textAlign: 'right' }}>{note.length} / 140</div>
        <div className="row between" style={{ marginTop: 20 }}>
          <button className="ghost" onClick={() => setMode('steps')}>Back</button>
          <button className="btn" onClick={submitQuick}>Submit review</button>
        </div>
      </>
    );
  } else if (step === 0) {
    body = (
      <>
        <Header title="Who watched it?" label={`Step ${shown} of ${total}`} />
        <Dots n={shown} />
        <p className="small" style={{ fontSize: 15 }}>Pick how you watched, then tag your friends.</p>
        <div className="row gap" style={{ marginTop: 8 }}>
          {[['Watched alone', 'Only your review', true], ['Watched with someone', 'Tag friends to share the post', false]].map(([t, d, a]) => (
            <button key={t} onClick={() => setAlone(a)} style={{ flex: 1, textAlign: 'left', padding: 18, borderRadius: 16, cursor: 'pointer', border: '2px solid ' + (alone === a ? '#0E0E10' : '#CFCABD'), background: alone === a ? '#FFF6D6' : '#fff' }}><b>{t}</b><div className="small">{d}</div></button>
          ))}
        </div>
        {!alone && (
          <div style={{ marginTop: 20 }}>
            <label className="small friend-search-label" htmlFor="friend-search">Watched with</label>
            <input id="friend-search" className="in friend-search" type="search" placeholder="Search friends by name or username" value={friendQuery} onChange={(e) => setFriendQuery(e.target.value)} />
            {withIds.length > 0 && <div className="friend-selected" aria-label="Selected friends">
              {withIds.map((id) => <button key={id} className="chip on" aria-pressed="true" onClick={() => toggle(id)}>@{user(id).username} ×</button>)}
            </div>}
            <div className="friend-options" aria-label="Friend search results">
              {matchingFriends.slice(0, 6).map((id) => <button key={id} className="chip" aria-pressed="false" onClick={() => toggle(id)}>@{user(id).username}</button>)}
            </div>
            {!matchingFriends.length && <p className="small friend-search-hint">No friends match that search.</p>}
            {matchingFriends.length > 6 && <p className="small friend-search-hint">Showing 6 friends. Search to find more.</p>}
            <p className="small">Tagged friends get a notification and can add their own review.</p>
          </div>
        )}
        <p className="small" style={{ marginTop: 8 }}>In a hurry? <button className="ghost sm" onClick={() => setMode('quick')}>Just give one overall score</button></p>
        <div className="row between" style={{ marginTop: 28 }}>
          <button className="ghost" onClick={() => nav(-1)}>Cancel</button>
          <button className="btn" onClick={() => setStep(1)}>Next</button>
        </div>
      </>
    );
  } else {
    const g = step - 1;
    body = (
      <>
        <Header title={GROUPS[g].t} label={`Step ${shown} of ${total}`} />
        <Dots n={shown} />
        <p className="small" style={{ fontSize: 15, margin: '12px 0 8px' }}>{GROUPS[g].s}</p>
        {QUESTIONS.filter((q) => q.g === g).map((q) => (
          <div key={q.k} style={{ padding: '20px 0', borderTop: '1px solid #E6E2D8' }}>
            <b style={{ fontSize: 18 }}>{q.l}</b>
            <div className="small" style={{ margin: '2px 0 24px' }}>{q.h}</div>
            <RatingSlider value={scores[q.k] || null} onChange={(v) => setScores({ ...scores, [q.k]: v })} label={q.l} />
            <div className="row between small" style={{ marginTop: 20 }}><span>1 Poor</span><span>10 Great</span></div>
          </div>
        ))}
        <div className="row between" style={{ marginTop: 28 }}>
          <button className="ghost" onClick={() => (step > first ? setStep(step - 1) : nav(-1))}>Back</button>
          {step < 3 && <button className="small" style={{ background: 'none', border: 0, textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }} onClick={() => setStep(step + 1)}>Skip this step</button>}
          {step < 3 ? <button className="btn" onClick={() => setStep(step + 1)}>Next</button> : <button className="btn" onClick={submitFull}>Submit review</button>}
        </div>
      </>
    );
  }
  return <div className="w review-flow" style={{ maxWidth: 712, paddingTop: 40 }}><div className="card review-card" style={{ padding: 36 }}>{body}</div></div>;
}
