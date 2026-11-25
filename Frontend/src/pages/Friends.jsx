import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { useStore } from '../store.jsx';
import { Tabs, Avatar } from '../components/ui.jsx';

export default function Friends() {
  const { me, friends, requests, user, answerRequest, sendFriendRequest } = useStore();
  const location = useLocation();
  const [tab, setTab] = useState('friends');
  const [q, setQ] = useState(location.state?.query || '');
  const [results, setResults] = useState([]);
  const [resultsKey, setResultsKey] = useState('');
  const [searchError, setSearchError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busyId, setBusyId] = useState('');
  const searching = q.trim().length > 0;
  const list = friends.filter((id) => (user(id).name + user(id).username).toLowerCase().includes(q.toLowerCase().replace('@', '')));

  useEffect(() => {
    let active = true;
    const term = q.trim();
    const key = `${me?.id || ''}:${term}`;
    setResults([]);
    setResultsKey('');
    setSearchError('');
    if (term.length < 2) {
      return () => { active = false; };
    }
    const timer = setTimeout(() => {
      api(`/friends/search?q=${encodeURIComponent(term)}`).then(({ users }) => {
        if (active) {
          setResults(users);
          setResultsKey(key);
          setSearchError('');
        }
      }).catch((error) => {
        if (active) {
          setResults([]);
          setSearchError(error.message || 'Could not search for people.');
        }
      });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q, me?.id]);

  const respond = async (target, accept) => {
    setBusyId(target.id);
    const ok = await answerRequest(target.id, accept);
    if (ok) {
      setResults((old) => old.map((person) => person.id === target.id
        ? { ...person, friendship: accept ? 'accepted' : 'declined', friendshipDirection: null }
        : person));
      setFeedback(accept ? `You are now friends with @${target.username}.` : `Request from @${target.username} declined.`);
    }
    setBusyId('');
  };

  const add = async (target) => {
    setBusyId(target.id);
    const result = await sendFriendRequest(target.username);
    if (result) {
      const accepted = result.status === 'accepted';
      setResults((old) => old.map((person) => person.id === target.id
        ? { ...person, friendship: accepted ? 'accepted' : 'pending', friendshipDirection: accepted ? null : 'sent' }
        : person));
      setFeedback(accepted ? `You are now friends with @${target.username}.` : `Request sent to @${target.username}.`);
    }
    setBusyId('');
  };

  const searchAction = (target) => {
    if (target.friendship === 'accepted') return <span className="chip" style={{ margin: 0 }}>Friends</span>;
    if (target.friendship === 'pending' && target.friendshipDirection === 'sent') {
      return <button className="ghost sm" disabled style={{ cursor: 'default' }}>Request Sent</button>;
    }
    if (target.friendship === 'pending' && target.friendshipDirection === 'received') {
      return <button className="btn sm" disabled={busyId === target.id} onClick={() => respond(target, true)}>{busyId === target.id ? 'Accepting...' : 'Accept Request'}</button>;
    }
    return <button className="btn sm" disabled={busyId === target.id} onClick={() => add(target)}>{busyId === target.id ? 'Sending...' : 'Add Friend'}</button>;
  };

  return (
    <div className="w" style={{ paddingTop: 48 }}>
      <div className="row between gap" style={{ flexWrap: 'wrap' }}>
        <h1 className="h1">Friends</h1>
        <input className="in" style={{ width: 360, flex: 'none' }} placeholder="Find people by name or @username" aria-label="Find people" value={q} onChange={(e) => { setQ(e.target.value); setFeedback(''); }} />
      </div>
      {feedback && <p role="status" className="small" style={{ fontSize: 15 }}>{feedback}</p>}
      {searchError && <p role="alert" className="small">{searchError}</p>}
      {searching && q.trim().length >= 2 && !searchError && (
        <div className="g2" style={{ marginTop: 16 }}>
          {resultsKey === `${me?.id || ''}:${q.trim()}` ? results.map((target, i) => (
            <div key={target.id} className="card row" style={{ padding: 16, gap: 12 }}>
              <Link to={`/friends/${target.id}`} state={{ from: '/friends', query: q, user: target }} aria-label={`View ${target.name}'s profile`}><Avatar user={target} size={48} i={i} /></Link>
              <div style={{ flex: 1, minWidth: 0 }}><Link to={`/friends/${target.id}`} state={{ from: '/friends', query: q, user: target }} style={{ fontWeight: 600 }}>{target.name}</Link><div className="small">@{target.username}</div></div>
              {searchAction(target)}
            </div>
          )) : <p className="small">Searching...</p>}
          {resultsKey === `${me?.id || ''}:${q.trim()}` && !results.length && <p className="small">No matching users found.</p>}
        </div>
      )}
      {!searching && <>
        <div style={{ marginTop: 24 }}><Tabs value={tab} onChange={setTab} items={[{ v: 'friends', l: `Friends ${friends.length}` }, { v: 'requests', l: `Requests ${requests.length}` }]} /></div>
        {tab === 'requests' ? (
          <div className="g2" style={{ marginTop: 32 }}>
            {requests.map((id, i) => (
              <div key={id} className="card row" style={{ padding: 20, gap: 14, background: '#FFF6D6' }}>
                <Link to={`/friends/${id}`} state={{ from: '/friends' }} aria-label={`View ${user(id).name}'s profile`}><Avatar user={user(id)} size={56} i={i + 1} /></Link>
                <div style={{ flex: 1 }}><Link to={`/friends/${id}`} state={{ from: '/friends' }} style={{ fontWeight: 600 }}>{user(id).name}</Link><div className="small">@{user(id).username} wants to be friends</div></div>
                <button className="btn sm" disabled={busyId === id} onClick={() => respond(user(id), true)}>{busyId === id ? 'Accepting...' : 'Accept'}</button>
                <button className="ghost sm" disabled={busyId === id} onClick={() => respond(user(id), false)}>Decline</button>
              </div>
            ))}
            {!requests.length && <p className="small">No pending requests.</p>}
          </div>
        ) : (
          <div className="g3" style={{ marginTop: 32 }}>
            {list.map((id, i) => (
              <div key={id} className="card row" style={{ padding: 20, gap: 14 }}>
                <Link to={`/friends/${id}`} state={{ from: '/friends' }} aria-label={`View ${user(id).name}'s profile`}><Avatar user={user(id)} size={56} i={i} /></Link>
                <div style={{ flex: 1, minWidth: 0 }}><Link to={`/friends/${id}`} state={{ from: '/friends' }} style={{ fontWeight: 600 }}>{user(id).name}</Link><div className="small">@{user(id).username}</div></div>
                <Link to={`/friends/${id}`} state={{ from: '/friends' }} className="ghost sm">Profile</Link>
              </div>
            ))}
            {!list.length && <p className="small">No friends match that search.</p>}
          </div>
        )}
      </>}
    </div>
  );
}
