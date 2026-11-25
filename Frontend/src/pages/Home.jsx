import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { searchMovies } from '../api.js';
import { Poster } from '../components/ui.jsx';
import MovieCard from '../components/MovieCard.jsx';

export default function Home() {
  const { myEntries, watchedCount } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [res, setRes] = useState([]);
  const [searchError, setSearchError] = useState('');
  useEffect(() => {
    let active = true;
    searchMovies(q).then((result) => { if (active) { setRes(result); setSearchError(''); } })
      .catch((error) => { if (active) { setRes([]); setSearchError(error.message); } });
    return () => { active = false; };
  }, [q]);
  const pick = (m) => nav(`/review/new?movie=${m.id}`, { state: { movie: m } });
  return (
    <div className="w watched-page" style={{ paddingTop: 56 }}>
      <div className="card hero">
        <h1 className="h1">Watched a movie?<br /><span style={{ color: '#FFC93C' }}>Share your thoughts!</span></h1>
        <p>Search any movie, old or new, tell us how you watched it, and rate it your way.</p>
        <form className="row gap" style={{ maxWidth: 720 }} onSubmit={(e) => { e.preventDefault(); if (res[0]) pick(res[0]); }}>
          <input className="in" placeholder="Search a movie..." aria-label="Search a movie" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn">Add</button>
        </form>
        {searchError && <p role="alert" className="small">{searchError}</p>}
        {res.length > 0 && (
          <div className="suggest">{res.map((m) => <button key={m.id} onClick={() => pick(m)}><Poster movie={m} w={36} h={54} label={false} /><span><b>{m.title}</b> <span className="small">{m.year} - {m.genre}</span></span></button>)}</div>
        )}
      </div>
      <div className="sec"><h2>Your watched movies</h2><span className="small">Showing {Math.min(6, myEntries.length)} of {watchedCount}</span></div>
      <div className="g2">{myEntries.slice(0, 6).map((e) => <MovieCard key={e.id} entry={e} />)}</div>
      <div style={{ textAlign: 'center', marginTop: 32 }}><Link to="/library" className="btn dark" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>View All</Link></div>
    </div>
  );
}
