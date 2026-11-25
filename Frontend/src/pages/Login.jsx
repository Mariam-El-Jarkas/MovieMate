import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { useStore } from '../store.jsx';

export default function Login() {
  const { login, loading, error: apiError } = useStore();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (!f.email || !f.password) return setErr('Enter your email and password.');
    const session = await login(f.email, f.password);
    if (session) nav('/');
  };
  return (
    <AuthShell>
      <form onSubmit={submit}>
        <h2 style={{ fontSize: 32, margin: 0 }}>Welcome back</h2>
        <p className="small" style={{ fontSize: 16 }}>Log in to your movie diary.</p>
        <label className="f" htmlFor="em">Email</label>
        <input id="em" className="in" type="email" placeholder="you@email.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <label className="f" htmlFor="pw">Password</label>
        <input id="pw" className="in" type="password" placeholder="Your password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        {(err || apiError) && <p role="alert" className="alert-message">{err || apiError}</p>}
        <button className="btn" disabled={loading} style={{ width: '100%', marginTop: 24 }}>{loading ? 'Loading...' : 'Log in'}</button>
        <p className="small" style={{ textAlign: 'center' }}>Password recovery is not available yet. Keep your password safe.</p>
        <p className="small" style={{ textAlign: 'center', marginTop: 24 }}>New here? <Link to="/signup">Create an account</Link></p>
      </form>
    </AuthShell>
  );
}
