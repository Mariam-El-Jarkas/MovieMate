import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { Toggle } from '../components/ui.jsx';

const Row = ({ t, d, children }) => <div className="setrow"><div><b>{t}</b><div className="small">{d}</div></div>{children}</div>;
const Sec = ({ t, children }) => <div className="card pad mt"><h2 style={{ margin: '0 0 8px', fontSize: 22 }}>{t}</h2>{children}</div>;

export default function Settings() {
  const { settings: s, updateSettings: u, logout } = useStore();
  const nav = useNavigate();
  return (
    <div className="w" style={{ maxWidth: 820, paddingTop: 48 }}>
      <h1 className="h1">Settings</h1>
      <Sec t="Account">
        <Row t="Profile" d="Name, photo and username"><Link to="/profile/edit" className="ghost sm">Edit profile</Link></Row>
      </Sec>
      <Sec t="Notifications">
        <Row t="Tagged in a movie" d="When a friend adds you to a movie post"><Toggle on={s.tagged} onChange={(v) => u({ tagged: v })} label="Tagged in a movie" /></Row>
        <Row t="Friend reviews" d="When a friend reviews a movie you share"><Toggle on={s.friendReviews} onChange={(v) => u({ friendReviews: v })} label="Friend reviews" /></Row>
        <Row t="Friend requests" d="When someone wants to be your friend"><Toggle on={s.friendRequests} onChange={(v) => u({ friendRequests: v })} label="Friend requests" /></Row>
      </Sec>
      <Sec t="Privacy">
        <Row t="Who can see my profile and watched movies" d="Choose who can view your profile and diary"><select className="in" aria-label="Who can see my profile and watched movies" value={s.seeMovies} onChange={(e) => u({ seeMovies: e.target.value })}><option value="friends">Friends only</option><option value="everyone">Everyone</option><option value="only_me">Only me</option></select></Row>
        <Row t="Who can tag me" d="Choose who can add you to a movie post"><select className="in" aria-label="Who can tag me" value={s.canTag} onChange={(e) => u({ canTag: e.target.value })}><option value="friends">Friends only</option><option value="everyone">Everyone</option><option value="nobody">Nobody</option></select></Row>
      </Sec>
      <div className="card row between mt" style={{ padding: '24px 32px', gap: 12 }}>
        <div><b>Log out</b><div className="small">You can log back in any time.</div></div>
        <button className="ghost red" onClick={() => { logout(); nav('/login'); }}>Log out</button>
      </div>
    </div>
  );
}
