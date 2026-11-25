import { Poster } from './ui.jsx';
import { MOVIES } from '../data.js';

export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <div className="left">
        <img src="/logo.jpeg" alt="MovieMate" style={{ height: 56, width: 56, borderRadius: 12 }} />
        <div>
          <h1 className="h1">Every movie you watch,<br /><span style={{ color: '#FFC93C' }}>shared with friends.</span></h1>
          <p style={{ color: '#D9D6CE', fontSize: 17 }}>Rate it, compare it, never forget it.</p>
        </div>
        <div className="row" style={{ gap: 16 }}>
          {[0, 3, 4].map((i, k) => <Poster key={i} movie={MOVIES[i]} w={120} h={180} style={{ transform: `rotate(${(k - 1) * 6}deg)` }} />)}
        </div>
      </div>
      <div className="right"><div className="box">{children}</div></div>
    </div>
  );
}
