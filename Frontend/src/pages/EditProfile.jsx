import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { Avatar } from '../components/ui.jsx';

export default function EditProfile() {
  const { me, updateProfile, changePassword, deleteAccount } = useStore();
  const nav = useNavigate();
  const file = useRef(null);
  const [f, setF] = useState({ name: me.name, username: me.username, email: me.email, avatar: me.avatar });
  const [msg, setMsg] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const pick = (e) => {
    const x = e.target.files[0];
    if (!x) return;
    const r = new FileReader();
    r.onload = () => setF((p) => ({ ...p, avatar: r.result }));
    r.readAsDataURL(x);
  };
  const save = async (e) => {
    e.preventDefault();
    if (!/^[A-Za-z0-9_]{3,20}$/.test(f.username)) return setMsg('Username: 3 to 20 letters, numbers or underscores.');
    if (await updateProfile(f)) setMsg('Saved.');
  };
  const savePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (passwords.next.length < 8) return setPasswordError('New password needs at least 8 characters.');
    if (passwords.next !== passwords.confirm) return setPasswordError('New passwords do not match.');
    if (await changePassword(passwords.current, passwords.next)) {
      setPasswords({ current: '', next: '', confirm: '' });
      setPasswordMessage('Password changed.');
    }
  };
  const removeAccount = async () => {
    const password = window.prompt('Enter your password to permanently delete your account.');
    if (password === null) return;
    const deleted = await deleteAccount(password);
    if (deleted) nav('/login');
  };
  return (
    <div className="w edit-profile-page" style={{ maxWidth: 820, paddingTop: 48 }}>
      <div className="small"><Link to="/profile" style={{ textDecoration: 'none' }}>Profile</Link> / Edit profile</div>
      <h1 className="h1" style={{ margin: '8px 0 24px' }}>Edit profile</h1>
      <form className="card edit-profile-card" style={{ padding: 36 }} onSubmit={save}>
        <div className="row profile-photo-row" style={{ gap: 24 }}>
          <Avatar user={{ name: f.name || 'R', avatar: f.avatar }} size={104} />
          <div className="profile-photo-copy"><b style={{ fontSize: 18 }}>Profile photo</b><div className="small" style={{ margin: '4px 0 12px' }}>JPG or PNG</div>
            <div className="row gap profile-photo-actions"><input ref={file} type="file" accept="image/png,image/jpeg" hidden onChange={pick} /><button type="button" className="btn sm" onClick={() => file.current.click()}>Upload new photo</button><button type="button" className="ghost sm" onClick={() => setF({ ...f, avatar: null })}>Remove</button></div></div>
        </div>
        <label className="f" htmlFor="n1">Name</label><input id="n1" className="in" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <label className="f" htmlFor="n2">Username</label><input id="n2" className="in" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
        <div className="small" style={{ marginTop: 6 }}>Friends use this to tag you with @{f.username}.</div>
        <label className="f" htmlFor="n3">Email</label><input id="n3" className="in" type="email" value={f.email} readOnly />
        {msg && <p role="status" style={{ marginTop: 16 }}>{msg}</p>}
        <div className="row gap" style={{ justifyContent: 'flex-end', marginTop: 28 }}><button type="button" className="ghost" onClick={() => nav('/profile')}>Cancel</button><button className="btn">Save changes</button></div>
      </form>
      <form className="card pad mt" onSubmit={savePassword}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>Change password</h2>
        <p className="small">Password recovery by email is unavailable, so keep your password safe.</p>
        <label className="f" htmlFor="current-password">Current password</label>
        <input id="current-password" className="in" type="password" autoComplete="current-password" required value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
        <label className="f" htmlFor="new-password">New password</label>
        <input id="new-password" className="in" type="password" autoComplete="new-password" minLength={8} required value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} />
        <label className="f" htmlFor="confirm-password">Confirm new password</label>
        <input id="confirm-password" className="in" type="password" autoComplete="new-password" minLength={8} required value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
        {passwordError && <p role="alert" className="alert-message">{passwordError}</p>}
        {passwordMessage && <p role="status">{passwordMessage}</p>}
        <button className="btn" style={{ marginTop: 16 }}>Change password</button>
      </form>
      <div className="card row between" style={{ padding: '24px 36px', marginTop: 24, gap: 12, flexWrap: 'wrap' }}>
        <div><b>Delete account</b><div className="small">Permanently remove your account, reviews and friends.</div></div>
        <button className="ghost red" onClick={removeAccount}>Delete account</button>
      </div>
    </div>
  );
}
