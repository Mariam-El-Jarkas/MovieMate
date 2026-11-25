import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { searchMovies } from '../api.js';
import { Poster, Modal } from '../components/ui.jsx';

export default function Waitlist() {
  const { waitlist, movie, addToWaitlist, removeFromWaitlist } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [res, setRes] = useState([]);
  const [sel, setSel] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { let active = true; searchMovies(q).then((result) => { if (active) { setRes(result); setSearchError(''); } }).catch((error) => { if (active) { setRes([]); setSearchError(error.message); } }); return () => { active = false; }; }, [q]);
  const close = () => { if (!saving) { setOpen(false); setQ(''); setSel(null); } };
  const addSelected = async () => {
    if (!sel || saving) return;
    setSaving(true);
    try {
      if (await addToWaitlist(sel)) {
        setOpen(false);
        setQ('');
        setSel(null);
      }
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="w" style={{ paddingTop: 48 }}>
      <div className="row between">
        <div><h1 className="h1">Waitlist</h1><p className="small" style={{ fontSize: 16 }}>{waitlist.length} movies to watch</p></div>
        <button className="btn" onClick={() => setOpen(true)}>+ Add Movie</button>
      </div>
      <div className="g6" style={{ marginTop: 32 }}>
        {waitlist.map((id) => (
          <div key={id}>
              <Poster movie={movie(id)} style={{ aspectRatio: '2/3', width: '100%' }} />
              <div style={{ marginTop: 10, fontWeight: 600 }}>{movie(id)?.title}</div>
            <div className="row small" style={{ gap: 12, marginTop: 4 }}>
                <Link className="waitlist-watched-link" to={`/review/new?movie=${id}`} state={{ movie: movie(id) }}>Watched it</Link>
                <button className="ghost sm" style={{ height: 28, padding: '0 10px' }} onClick={() => removeFromWaitlist(id)} aria-label={`Remove ${movie(id)?.title}`}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <Modal title="Add to Waitlist" onClose={close}>
          <input className="in" style={{ width: '100%', marginTop: 20 }} placeholder="Search a movie" aria-label="Search a movie" autoFocus value={q} disabled={saving} onChange={(e) => { setQ(e.target.value); setSel(null); }} />
          {searchError && <p role="alert" className="small">{searchError}</p>}
          <div className="waitlist-results" style={{ marginTop: 12 }}>{res.map((m) => <button key={m.id} className={'res' + (sel?.id === m.id ? ' sel' : '')} disabled={saving} onClick={() => setSel(m)}><Poster movie={m} w={44} h={64} label={false} /><div><b>{m.title}</b><div className="small">{m.year} - {m.genre}</div></div></button>)}</div>
          <button className="btn" disabled={!sel || saving} style={{ width: '100%', marginTop: 20 }} onClick={addSelected}>{saving ? 'Adding...' : 'Add to Waitlist'}</button>
        </Modal>
      )}
    </div>
  );
}
