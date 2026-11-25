import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { Poster, Avatar } from '../components/ui.jsx';

export default function FriendProfile() {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchUser = location.state?.user;
  const backTo = location.state?.from || '/friends';
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [privateProfile, setPrivateProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setProfile(null);
    setError('');
    setPrivateProfile(false);
    api(`/friends/${userId}/profile`).then((data) => {
      if (active) setProfile(data);
    }).catch((e) => {
      if (!active) return;
      if (e.status === 404 && searchUser?.id === userId) {
        setProfile({
          user: { ...searchUser, avatar: searchUser.avatar || searchUser.avatarUrl },
          canViewMovies: false,
          friendCount: null,
          reviews: [],
        });
        setPrivateProfile(true);
      } else {
        setError(e.message || 'Could not load this profile.');
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [userId, searchUser]);

  if (loading) return <div className="w" style={{ paddingTop: 48 }}>Loading profile...</div>;
  if (error) return <div className="w" style={{ paddingTop: 48 }}><button className="back-arrow" aria-label="Go back" title="Go back" onClick={() => navigate(backTo, { state: { query: location.state?.query } })}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m0 0 7-7m-7 7 7 7" /></svg></button><p role="alert" className="small">{error}</p></div>;
  if (!profile) return null;

  return (
    <div className="w" style={{ paddingTop: 48 }}>
      <button className="back-arrow" aria-label="Go back" title="Go back" onClick={() => navigate(backTo, { state: { query: location.state?.query } })}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m0 0 7-7m-7 7 7 7" /></svg></button>
      <div className="card row" style={{ padding: 32, gap: 24, flexWrap: 'wrap', marginTop: 20 }}>
        <Avatar user={profile.user} size={96} ring />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 className="h1" style={{ fontSize: 36 }}>{profile.user.name}</h1>
          <div className="small" style={{ fontSize: 16 }}>@{profile.user.username}</div>
        </div>
        <div className="row" style={{ gap: 28, textAlign: 'center' }}>
          {profile.canViewMovies && <div><b style={{ fontSize: 30 }}>{profile.watchedCount}</b><div className="small">Watched</div></div>}
          {profile.friendCount !== null && <div><b style={{ fontSize: 30 }}>{profile.friendCount}</b><div className="small">Friends</div></div>}
        </div>
      </div>
      <h2 style={{ margin: '32px 0 16px', fontSize: 26 }}>Recent reviews</h2>
      {privateProfile
        ? <p className="small">This member's profile is private. Send a friend request from the search results to ask for access.</p>
        : !profile.canViewMovies
          ? <p className="small">This member keeps their movie activity private.</p>
        : profile.reviews.length
          ? <div className="g2">{profile.reviews.map((item) => (
            <div className="card row" key={item.id} style={{ padding: 16, gap: 16, alignItems: 'flex-start' }}>
              <Poster movie={{ ...item.movie, pal: 0 }} w={88} h={132} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row between" style={{ gap: 8 }}><b>{item.movie.title}</b><span className="avg">{Number(item.review.overall).toFixed(1)}</span></div>
                <div className="small" style={{ marginTop: 8 }}>{item.movie.genre} {item.movie.year ? `- ${item.movie.year}` : ''}</div>
                {item.review.note && <p className="small" style={{ marginTop: 12 }}>{item.review.note}</p>}
                {item.review.tags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}
              </div>
            </div>
          ))}</div>
          : <p className="small">No reviews to show yet.</p>}
    </div>
  );
}
