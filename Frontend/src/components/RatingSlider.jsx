import { useRef } from 'react';

// Drag the knob or tap the bar. Value is 1 to 10 (or null when not rated yet).
export default function RatingSlider({ value, onChange, big = false, label }) {
  const track = useRef(null);
  const set = (clientX) => {
    const r = track.current.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    onChange(Math.round(f * 9) + 1);
  };
  const pct = value ? ((value - 1) / 9) * 100 : 44.4;
  const onKey = (e) => {
    const v = value ?? 5;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange(Math.min(10, v + (value ? 1 : 0))); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.max(1, v - (value ? 1 : 0))); }
  };
  return (
    <div
      className={'rs' + (big ? ' big' : '')}
      role="slider" tabIndex={0} aria-label={label} aria-valuemin={1} aria-valuemax={10} aria-valuenow={value ?? undefined}
      onKeyDown={onKey}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); set(e.clientX); }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) set(e.clientX); }}
    >
      <div className="rs-track" ref={track}>
        {value ? <div className="rs-fill" style={{ width: pct + '%' }} /> : null}
        <div className={'rs-knob' + (value ? '' : ' empty')} style={{ left: `calc(${pct}% - ${big ? 28 : 19}px)` }}>{value ?? '?'}</div>
      </div>
    </div>
  );
}
