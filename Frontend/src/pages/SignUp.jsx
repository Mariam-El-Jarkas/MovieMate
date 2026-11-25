import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { useStore } from '../store.jsx';

export default function SignUp() {
  const nav = useNavigate();
  const { signUp, error: apiError } = useStore();
  const [f, setF] = useState({ name: '', username: '', email: '', password: '', password2: '', agree: false });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name || !f.email || !f.password) return setErr('Fill in all the fields.');
    if (!/^[A-Za-z0-9_]{3,20}$/.test(f.username)) return setErr('Username: 3 to 20 letters, numbers or underscores.');
    if (f.password.length < 8) return setErr('Password needs at least 8 characters.');
    if (f.password !== f.password2) return setErr('Passwords do not match.');
    if (!f.agree) return setErr('Please accept the Terms and Privacy Policy.');
    const result = await signUp({ name: f.name, username: f.username, email: f.email, password: f.password });
    if (result) nav('/');
  };
  return (
    <AuthShell>
      <form onSubmit={submit}>
        <h2 style={{ fontSize: 32, margin: 0 }}>Create your account</h2>
        <p className="small" style={{ fontSize: 16 }}>Start your movie diary in a minute.</p>
        <label className="f" htmlFor="nm">Name</label><input id="nm" className="in" placeholder="Your name" value={f.name} onChange={set('name')} />
        <label className="f" htmlFor="un">Username</label><input id="un" className="in" placeholder="Friends tag you with @username" value={f.username} onChange={set('username')} />
        <label className="f" htmlFor="em">Email</label><input id="em" className="in" type="email" placeholder="you@email.com" value={f.email} onChange={set('email')} />
        <label className="f" htmlFor="pw">Password</label><input id="pw" className="in" type="password" placeholder="At least 8 characters" value={f.password} onChange={set('password')} />
        <label className="f" htmlFor="pw2">Confirm password</label><input id="pw2" className="in" type="password" placeholder="Repeat password" value={f.password2} onChange={set('password2')} />
        <label className="small" style={{ display: 'block', marginTop: 16 }}><input type="checkbox" checked={f.agree} onChange={set('agree')} /> I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link></label>
        {(err || apiError) && <p role="alert" className="alert-message">{err || apiError}</p>}
        <button className="btn" style={{ width: '100%', marginTop: 20 }}>Create account</button>
        <p className="small" style={{ textAlign: 'center' }}>Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </AuthShell>
  );
}
