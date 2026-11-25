import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { Tabs, Poster } from '../components/ui.jsx';
import MovieCard from '../components/MovieCard.jsx';

export default function Library() {
  const { myEntries, waitlist, movie } = useStore();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') === 'wishlist' ? 'wishlist' : 'watched';
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('recent');
  const match = (id) => movie(id).title.toLowerCase().includes(q.toLowerCase());
  let list = myEntries.filter((e) => match(e.movieId));
  if (sort === 'top') list = [...list].sort((a, b) => b.reviews.me.overall - a.reviews.me.overall);
  const wl = waitlist.filter(match);
  return (
    <div className="w" style={{ paddingTop: 48 }}>
      <h1 className="h1">My Library</h1>
      <div className="row between gap library-toolbar" style={{ marginTop: 24, flexWrap: 'wrap' }}>
        <Tabs value={tab} onChange={(v) => setSp(v === 'wishlist' ? { tab: 'wishlist' } : {})} items={[{ v: 'watched', l: 'Watched' }, { v: 'wishlist', l: 'Wishlist' }]} />
        <div className="row gap">
          <input className="in" style={{ width: 240, height: 44 }} placeholder="Search library" aria-label="Search library" value={q} onChange={(e) => setQ(e.target.value)} />
          {tab === 'watched' && <select className="in library-sort" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}><option value="recent">Most recent</option><option value="top">Top rated</option></select>}
        </div>
      </div>
      {tab === 'watched' ? (
        <div className="g3" style={{ marginTop: 32 }}>{list.map((e) => <MovieCard key={e.id} entry={e} compact />)}</div>
      ) : (
        <div className="g6" style={{ marginTop: 32 }}>{wl.map((id) => <div key={id}><Poster movie={movie(id)} style={{ aspectRatio: '2/3', width: '100%' }} /><div style={{ marginTop: 10, fontWeight: 600 }}>{movie(id).title}</div></div>)}</div>
      )}
      {tab === 'wishlist' && <p className="small" style={{ marginTop: 24 }}>Manage your list on the <Link to="/waitlist">Waitlist page</Link>.</p>}
    </div>
  );
}
