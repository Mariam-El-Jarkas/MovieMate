import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { BADGES } from '../data.js';
import { Avatar } from '../components/ui.jsx';
import MovieCard from '../components/MovieCard.jsx';
import { NotifItem } from './Notifications.jsx';

export default function Profile() {
  const { me, user, friends, waitlist, watchedCount, myEntries, notifications, badges } = useStore();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className="w profile-page" style={{ paddingTop: 48 }}>
      <div className="card row profile-header" style={{ padding: 32, gap: 28, flexWrap: 'wrap' }}>
        <Avatar user={me} size={112} ring />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 className="h1" style={{ fontSize: 36 }}>{me.name}</h1>
          <div className="small" style={{ fontSize: 16 }}>@{me.username} - {me.email}</div>
          <div className="row gap" style={{ marginTop: 14, flexWrap: 'wrap' }}><Link to="/profile/edit" className="ghost">Edit profile</Link><Link to="/settings" className="ghost">Settings</Link></div>
        </div>
        <div className="row profile-stats" style={{ gap: 28, textAlign: 'center' }}>
          {[[watchedCount, 'Watched'], [waitlist.length, 'Waitlist'], [friends.length, 'Friends']].map(([n, l]) => <div key={l}><b style={{ fontSize: 30 }}>{n}</b><div className="small">{l}</div></div>)}
        </div>
      </div>
      <div className="row" style={{ gap: 24, marginTop: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 300 }}>
          <div className="card pad"><h2 style={{ margin: '0 0 16px' }}>Badges</h2>
            <div className="row profile-badges" style={{ gap: 16 }}>
              {BADGES.map((b) => { const earned = badges.find((badge) => badge.minMovies === b.n)?.earned; return (
                <div key={b.n} className="card profile-badge-card" style={{ padding: 20, textAlign: 'center', flex: 1, background: earned ? '#fff' : '#EDEAE1', boxShadow: earned ? undefined : 'none' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, background: earned ? '#FFC93C' : '#CFCABD' }}>{b.t}</div>
                  <b className="profile-badge-label"><span>Watched</span><span>{b.t} movies</span></b><div className="small">{earned ? 'Earned' : `${Math.max(0, b.n - watchedCount)} to go`}</div>
                </div>); })}
            </div>
          </div>
          <div className="card pad mt"><div className="row between"><h2 style={{ margin: 0 }}>Friends</h2><Link to="/friends" className="ghost sm">See all</Link></div>
            <div className="row" style={{ gap: 24, marginTop: 20, flexWrap: 'wrap' }}>{friends.slice(0, 6).map((id, i) => <Link key={id} to={`/friends/${id}`} state={{ from: '/profile' }} style={{ textAlign: 'center', textDecoration: 'none' }}><Avatar user={user(id)} size={56} i={i} /><div className="small">{user(id).name}</div></Link>)}</div>
          </div>
          <div className="card pad mt"><h2 style={{ margin: '0 0 16px' }}>Recent reviews</h2><div className="g2">{myEntries.slice(0, 2).map((e) => <MovieCard key={e.id} entry={e} compact />)}</div></div>
        </div>
        <div className="card pad" style={{ flex: 1, minWidth: 280 }}>
          <div className="row between"><h2 style={{ margin: 0 }}>Notifications</h2>{unread > 0 && <span className="chip" style={{ background: '#FFC93C', margin: 0 }}>{unread} new</span>}</div>
          {notifications.slice(0, 4).map((n, i) => <NotifItem key={n.id} n={n} i={i} />)}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/notifications" className="ghost sm">See all</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
