import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { Avatar } from './ui.jsx';
import { notifText } from '../pages/Notifications.jsx';

const Bell = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21h4" /></svg>
);

export default function Navbar() {
  const { auth, me, notifications, logout, markAllRead, markRead } = useStore();
  const [open, setOpen] = useState(null); // 'bell' | 'menu' | null
  const nav = useNavigate();
  const box = useRef(null);
  useEffect(() => {
    const h = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const unread = notifications.filter((n) => !n.read).length;
  const go = (to) => { setOpen(null); nav(to); };

  return (
    <div className="nav">
      <div className="w">
        <Link to="/" className="logo"><img src="/logo.jpeg" alt="MovieMate" /></Link>
        <nav className="links">
          <NavLink to="/" end>Watched</NavLink>
          <NavLink to="/waitlist">Waitlist</NavLink>
        </nav>
        {auth ? (
          <div className="row" style={{ gap: 8 }} ref={box}>
            <div className="rel">
              <button className="ic" aria-label="Notifications" onClick={() => setOpen(open === 'bell' ? null : 'bell')}>
                <Bell />{unread ? <span className="dot" /> : null}
              </button>
              {open === 'bell' && (
                <div className="pop" style={{ width: 380, maxWidth: '92vw', right: -60, padding: 16 }}>
                  <div className="row between"><b style={{ fontSize: 18 }}>Notifications</b><button className="ghost sm" disabled={!unread} onClick={markAllRead}>{unread ? 'Mark all read' : 'All caught up'}</button></div>
                  {notifications.slice(0, 4).map((n) => (
                    <div key={n.id} className={'notif' + (n.read ? '' : ' unread')} onClick={() => { markRead(n.id); go(n.entryId ? `/movie/${n.entryId}` : '/notifications'); }}>
                      <div style={{ flex: 1 }}><div>{notifText(n)}</div><div className="small">{n.time}</div></div>
                    </div>
                  ))}
                  <div style={{ textAlign: 'center', marginTop: 14 }}><Link to="/notifications" className="notification-see-all" onClick={() => setOpen(null)}>See all notifications</Link></div>
                </div>
              )}
            </div>
            <div className="rel">
              <button className="av" aria-label="Open menu" onClick={() => setOpen(open === 'menu' ? null : 'menu')}>
                {me.avatar ? <img src={me.avatar} alt="" /> : me.name[0]}
              </button>
              {open === 'menu' && (
                <div className="pop" style={{ width: 260 }}>
                  <div className="row account-menu-user" style={{ gap: 12, padding: '12px 14px' }}><Avatar user={me} /><div className="account-menu-details"><b>{me.name}</b><div className="small account-menu-email">{me.email}</div></div></div>
                  <hr />
                  <button className="item" onClick={() => go('/profile')}>Profile</button>
                  <button className="item" onClick={() => go('/profile/edit')}>Edit profile</button>
                  <button className="item" onClick={() => go('/friends')}>Friends</button>
                  <button className="item" onClick={() => go('/settings')}>Settings</button>
                  <hr />
                  <button className="item danger" onClick={() => { logout(); go('/login'); }}>Log out</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="row gap"><Link to="/login" className="ghost sm" style={{ color: '#fff', borderColor: '#fff', background: 'none' }}>Log in</Link><Link to="/signup" className="btn sm" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#0E0E10' }}>Sign up</Link></div>
        )}
      </div>
    </div>
  );
}
