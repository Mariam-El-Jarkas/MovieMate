import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { Tabs } from '../components/ui.jsx';

export function notifText(n) {
  const a = <span className="notification-actor">{n.actor || 'Someone'}</span>;
  switch (n.type) {
    case 'tagged': return n.reviewed
      ? <>{a} added you to a movie experience. Your review is submitted.</>
      : <>{a} added you to a movie experience. Add your review.</>;
    case 'friend_review': return <>{a} added a review to a movie you share.</>;
    case 'friend_request': return <>{a} sent you a friend request.</>;
    case 'friend_accepted': return <>{a} accepted your friend request.</>;
    default: return <>You earned the <span className="notification-actor">{n.badge}</span> badge.</>;
  }
}

export function NotifItem({ n, i }) {
  const { markRead, answerRequest } = useStore();
  const nav = useNavigate();
  const open = () => {
    markRead(n.id);
    if (n.entryId) nav(`/movie/${n.entryId}`);
  };
  const respond = async (accept) => {
    const updated = await answerRequest(n.actorId, accept);
    if (updated) await markRead(n.id);
  };
  return (
    <div className={'notif' + (n.read ? '' : ' unread')} onClick={open}>
      <span className="av notification-avatar">{(n.actor || 'B')[0]}</span>
      <div className="notification-content">
        <div className="notification-copy">{notifText(n)}</div><div className="notification-time">{n.time}</div>
        {n.type === 'tagged' && (n.reviewed
          ? <span className="notification-status" style={{ marginTop: 10 }}>Review submitted</span>
          : <Link to={`/movie/${n.entryId}/review`} className="btn sm" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#0E0E10', marginTop: 10 }} onClick={(e) => { e.stopPropagation(); markRead(n.id); }}>Add Your Review</Link>)}
        {n.type === 'friend_request' && (
          <div className="row" style={{ gap: 8, marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
            {n.friendshipStatus === 'pending'
              ? <>
                <button className="btn sm" onClick={() => respond(true)}>Accept</button>
                <button className="ghost sm" onClick={() => respond(false)}>Decline</button>
              </>
              : <span className="notification-status">
                {n.friendshipStatus === 'accepted' ? 'Accepted' : n.friendshipStatus === 'declined' ? 'Declined' : 'Request no longer pending'}
              </span>}
          </div>
        )}
        {!n.read && <button className="btn sm" style={{ marginTop: 10 }} onClick={(e) => { e.stopPropagation(); markRead(n.id); }}>Mark as Read</button>}
      </div>
      {!n.read && <span className="notification-unread-dot" aria-label="Unread" />}
    </div>
  );
}

export default function Notifications() {
  const { notifications, markAllRead } = useStore();
  const [tab, setTab] = useState('all');
  const f = notifications.filter((n) => tab === 'all' || (tab === 'tags' ? ['tagged', 'friend_review'].includes(n.type) : ['friend_request', 'friend_accepted'].includes(n.type)));
  const fresh = f.filter((n) => !n.read);
  const old = f.filter((n) => n.read);
  const unreadCount = f.filter((n) => !n.read).length;
  return (
    <div className="w notifications-page" style={{ maxWidth: 820, paddingTop: 48 }}>
      <div className="row between notifications-heading"><h1 className="h1">Notifications</h1><button className="btn notification-read-all" disabled={!unreadCount} onClick={markAllRead}>{unreadCount ? 'Mark all as read' : 'All caught up'}</button></div>
      <div style={{ marginTop: 20 }}><Tabs value={tab} onChange={setTab} items={[{ v: 'all', l: 'All' }, { v: 'tags', l: 'Tags' }, { v: 'friends', l: 'Friends' }]} /></div>
      {fresh.length > 0 && <section className="notification-section"><h2 className="notification-section-title">New</h2>{fresh.map((n, i) => <NotifItem key={n.id} n={n} i={i} />)}</section>}
      {old.length > 0 && <section className="notification-section"><h2 className="notification-section-title">Earlier</h2>{old.map((n, i) => <NotifItem key={n.id} n={n} i={i} />)}</section>}
      {!f.length && <p className="notification-empty">Nothing here yet.</p>}
    </div>
  );
}
