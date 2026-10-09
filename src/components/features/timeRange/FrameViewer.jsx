import React, { useEffect, useRef, useState } from 'react';
import { clock, visibleBoxes } from '../../../utils/timeRange';

/** Full-size image with the detected truck boxes drawn on it. Swipe or use the arrow keys to move between frames. */
const FrameViewer = ({ frames, index, filters, imageUrls, onChange, onClose }) => {
  const frame = frames[index];
  const [shown, setShown] = useState({ path: '', url: '' });
  const touchX = useRef(0);

  useEffect(() => {
    if (!frame) return undefined;
    let alive = true;
    imageUrls.get(frame.path).then((url) => alive && setShown({ path: frame.path, url })).catch(() => {});
    return () => { alive = false; };
  }, [frame, imageUrls]);

  useEffect(() => {
    const step = (d) => onChange((index + d + frames.length) % frames.length);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, frames.length, onChange, onClose]);

  if (!frame) return null;
  const boxes = visibleBoxes(frame, filters);
  const swipe = (d) => onChange((index + d + frames.length) % frames.length);

  return (
    <div
      className="fixed inset-0 z-[210] flex flex-col items-center justify-center gap-3 bg-black/[.97] p-2.5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { const d = e.changedTouches[0].clientX - touchX.current; if (Math.abs(d) > 50) swipe(d < 0 ? 1 : -1); }}
    >
      <button onClick={onClose} aria-label="Close" className="absolute right-2.5 top-[calc(0.6rem+env(safe-area-inset-top))] flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white/15 text-white">
        <span className="material-symbols-outlined !text-[26px]">close</span>
      </button>

      <div className="relative w-full max-w-md">
        {shown.path === frame.path ? <img src={shown.url} alt="" className="block w-full" /> : <div className="aspect-video w-full animate-pulse bg-[#222]" />}
        {boxes.map((b, i) => (
          <div
            key={i} className="pointer-events-none absolute border-2 border-[#ff6b5e]"
            style={{ left: `${(b[0] / frame.w) * 100}%`, top: `${(b[1] / frame.h) * 100}%`, width: `${((b[2] - b[0]) / frame.w) * 100}%`, height: `${((b[3] - b[1]) / frame.h) * 100}%` }}
          >
            <span className="absolute -left-0.5 -top-[18px] whitespace-nowrap rounded-[3px] bg-[#ff6b5e] px-1.5 text-[11px] text-white">
              truck {b[4].toFixed(2)} · {((((b[2] - b[0]) * (b[3] - b[1])) / (frame.w * frame.h)) * 100).toFixed(1)}% area
            </span>
          </div>
        ))}
      </div>
      <div className="text-center text-[15px] text-white">
        {clock(frame.ms)}{frame.processed === false ? '' : ` · ${boxes.length ? `${boxes.length} truck box${boxes.length > 1 ? 'es' : ''}` : 'no truck'}`} · {index + 1}/{frames.length}
      </div>
    </div>
  );
};

export default FrameViewer;
