import { PAL, COLORS } from '../data.js';

export function Poster({ movie, w, h, style, label = true }) {
  const [a, b] = PAL[movie.pal % 6];
  const bg = movie.posterUrl
    ? `url(${movie.posterUrl})`
    : `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.75)), linear-gradient(135deg, ${a}, ${b})`;
  return (
    <div className="poster" style={{ width: w, height: h, flex: 'none', backgroundImage: bg, ...style }} role="img" aria-label={movie.title}>
      {label && !movie.posterUrl ? movie.title : null}
    </div>
  );
}

export function Avatar({ user, size = 40, i = 0, ring }) {
  const st = { width: size, height: size, fontSize: size * 0.4, background: COLORS[i % 4], boxShadow: ring ? '0 0 0 3px #FFC93C' : undefined, cursor: 'default' };
  return <span className="av" style={st}>{user.avatar ? <img src={user.avatar} alt="" /> : user.name[0]}</span>;
}

export function MiniAvatars({ users }) {
  return <span style={{ paddingLeft: 8 }}>{users.map((u, i) => <span key={u.id} className="mini" style={{ background: COLORS[i % 4] }}>{u.name[0]}</span>)}</span>;
}

export function Toggle({ on, onChange, label }) {
  return <button className={'sw' + (on ? ' on' : '')} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}><i /></button>;
}

export function ScoreRow({ label, value }) {
  return (
    <div className="sr"><span>{label}</span><span className="bar"><b style={{ width: value * 10 + '%' }} /></span><span>{value}</span></div>
  );
}

export function Tabs({ items, value, onChange }) {
  return (
    <div className="tabs">
      {items.map((t) => <button key={t.v} className={'tab' + (value === t.v ? ' on' : '')} onClick={() => onChange(t.v)}>{t.l}</button>)}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="row between"><h2 style={{ margin: 0, fontSize: 24 }}>{title}</h2><button className="ghost sm" onClick={onClose}>Close</button></div>
        {children}
      </div>
    </div>
  );
}
