import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const firstAtOrAfter = (tiles, ms) => { let lo = 0, hi = tiles.length - 1, hit = null; while (lo <= hi) { const m = (lo + hi) >> 1; if (+tiles[m].dataset.ms >= ms) { hit = tiles[m]; hi = m - 1; } else lo = m + 1; } return hit; };
const lastAtOrBefore = (tiles, ms) => { let lo = 0, hi = tiles.length - 1, hit = null; while (lo <= hi) { const m = (lo + hi) >> 1; if (+tiles[m].dataset.ms <= ms) { hit = tiles[m]; lo = m + 1; } else hi = m - 1; } return hit; };

/**
 * Thin strip on the right edge for a long list of frames (shown with "Show all frames"): hour labels, the ranges already
 * picked (blue), the picked start/end (green) and a box for the part on screen. Drag or tap it to jump anywhere.
 */
const TimeScrubber = ({ layoutKey, selection, pendingRanges }) => {
  const stripRef = useRef(null);
  const thumbRef = useRef(null);
  const dragging = useRef(false);
  const [marks, setMarks] = useState({ labels: [], ranges: [], pins: [] });

  const place = useCallback(() => {
    const strip = stripRef.current, thumb = thumbRef.current;
    if (!strip || !thumb) return;
    const H = document.documentElement.scrollHeight, area = strip.clientHeight;
    thumb.style.top = `${(window.scrollY / H) * area}px`;
    thumb.style.height = `${Math.max((window.innerHeight / H) * area, 14)}px`;
  }, []);

  const measure = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const H = document.documentElement.scrollHeight, area = strip.clientHeight;
    const y = (el) => Math.min(1, Math.max(0, (el.offsetTop + el.offsetHeight / 2) / H)) * area;
    const tiles = [...document.querySelectorAll('[data-ms]')];

    const ranges = pendingRanges.map((r) => {
      const a = firstAtOrAfter(tiles, r.s), b = lastAtOrBefore(tiles, r.e);
      return a && b && a.offsetTop <= b.offsetTop ? { top: y(a), height: Math.max(y(b) - y(a), 3) } : null;
    }).filter(Boolean);
    const pins = [selection.start, selection.end].filter((ms) => ms != null)
      .map((ms) => document.querySelector(`[data-ms="${ms}"]`)).filter(Boolean).map((el) => y(el));

    let last = -99;
    const labels = [];
    document.querySelectorAll('[data-hour]').forEach((h) => { const top = y(h); if (top - last >= 16) { labels.push({ top, text: h.dataset.hour }); last = top; } });
    setMarks({ labels, ranges, pins });
    place();
  }, [pendingRanges, selection.start, selection.end, place]);

  useLayoutEffect(() => { measure(); }, [measure, layoutKey]);
  useEffect(() => {
    const onScroll = () => requestAnimationFrame(place);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', measure); };
  }, [place, measure]);

  const jump = (e) => {
    const r = stripRef.current.getBoundingClientRect(), H = document.documentElement.scrollHeight;
    window.scrollTo(0, ((e.clientY - r.top) / r.height) * H - window.innerHeight / 2);
  };

  return (
    <div
      ref={stripRef}
      onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); jump(e); }}
      onPointerMove={(e) => dragging.current && jump(e)}
      onPointerUp={() => { dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}
      className="fixed bottom-0 right-[max(0px,calc(50vw-14rem))] top-[calc(102px+env(safe-area-inset-top))] z-[90] w-6 touch-none bg-slate-500/10"
    >
      {marks.ranges.map((r, i) => <div key={i} className="absolute inset-x-[3px] min-h-[3px] rounded-[3px] bg-[#2563eb]/80 dark:bg-[#6ea3ff]/80" style={{ top: r.top, height: r.height }} />)}
      {marks.pins.map((top, i) => <div key={i} className="absolute inset-x-0 h-[3px] bg-[#16a34a] dark:bg-[#34d27b]" style={{ top }} />)}
      {marks.labels.map((l) => <div key={l.top} className="pointer-events-none absolute inset-x-0 text-center text-[9px] leading-none text-[#6a7485] dark:text-[#9aa4b5]" style={{ top: l.top }}>{l.text}</div>)}
      <div ref={thumbRef} className="pointer-events-none absolute inset-x-0 min-h-[14px] rounded-[5px] border-2 border-[#2457d6] bg-[#6482ff]/20 dark:border-[#6f95ff]" />
    </div>
  );
};

export default TimeScrubber;
