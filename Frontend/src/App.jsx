
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useStore } from './store.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import SignUp from './pages/SignUp.jsx';
import Home from './pages/Home.jsx';
import ReviewFlow from './pages/ReviewFlow.jsx';
import MoviePost from './pages/MoviePost.jsx';
import Library from './pages/Library.jsx';
import Waitlist from './pages/Waitlist.jsx';
import Profile from './pages/Profile.jsx';
import EditProfile from './pages/EditProfile.jsx';
import Friends from './pages/Friends.jsx';
import FriendProfile from './pages/FriendProfile.jsx';
import Notifications from './pages/Notifications.jsx';
import Settings from './pages/Settings.jsx';
import { About, Contact, Privacy, Terms, NotFound } from './pages/Static.jsx';

function RequireAuth() {
  const { auth, loading } = useStore();
  if (loading) return <div className="w" style={{ padding: 48 }}>Loading your account...</div>;
  return auth ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  const { error, clearError } = useStore();
  return (
    <>
    {error && <div role="alert" style={{ position: 'fixed', zIndex: 1000, top: 16, left: '50%', transform: 'translateX(-50%)', width: 'min(720px, 92vw)', padding: 14, background: '#FFF6D6', border: '1px solid #FFC93C', borderRadius: 10, color: '#0E0E10', boxShadow: '0 4px 20px #0002' }}>
      <div className="row between"><span>{error}</span><button className="ghost sm" onClick={clearError}>Dismiss</button></div>
    </div>}
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route element={<Layout />}>
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/review/new" element={<ReviewFlow />} />
          <Route path="/movie/:entryId" element={<MoviePost />} />
          <Route path="/movie/:entryId/review" element={<ReviewFlow />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/friends/:userId" element={<FriendProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </>
  );
}
