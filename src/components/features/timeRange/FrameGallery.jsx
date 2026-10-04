import React, { useEffect, useRef, useState } from 'react';
import { clock, durationText, istParts } from '../../../utils/timeRange';

/** One thumbnail. The signed link is requested only when the tile is near the screen. */
const FrameImage = ({ path, imageUrls }) => {
  const ref = useRef(null);
  const [src, setSrc] = useState('');
  const retried = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      imageUrls.get(path).then(setSrc).catch(() => {});
    }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [path, imageUrls]);

  const onError = () => {                                   // link expired: ask for a fresh one once
    if (retried.current) return;
    retried.current = true;
    imageUrls.get(path, true).then(setSrc).catch(() => {});
  };

  return <img ref={ref} src={src || undefined} onError={onError} alt="" draggable={false} className="block aspect-video w-full bg-[#222] object-fill" />;
};

const FrameTile = ({ frame, imageUrls, state, forced, onClick, onZoom }) => {
  const { inRange, endpoint, tag, pending } = state;
  return (
    <div
      data-ms={frame.ms}
      onClick={onClick}
      className={`relative scroll-mt-[114px] select-none overflow-hidden rounded-lg border-2 ${inRange ? 'border-[#16a34a] bg-[#16a34a]' : 'border-transparent bg-black'} ${endpoint ? 'z-[2] border-[#16a34a] ring-[3px] ring-[#16a34a]' : ''}`}
    >
      <div className={inRange ? 'opacity-85' : ''}><FrameImage path={frame.path} imageUrls={imageUrls} /></div>
      <span className="absolute bottom-0 left-0 rounded-tr-md bg-black/65 px-1.5 py-px text-[11px] text-white">{clock(frame.ms)}</span>
      {tag && <span className={`absolute left-0 top-0 rounded-br-md px-1.5 py-px text-[10px] font-bold text-white ${forced ? 'bg-amber-500' : 'bg-[#16a34a]'}`}>{tag}</span>}
      {pending && <span className="absolute inset-x-0 bottom-0 h-1 bg-[#2563eb] dark:bg-[#6ea3ff]" />}
      <button
        aria-label="Enlarge"
        onClick={(e) => { e.stopPropagation(); onZoom(); }}
        className="absolute right-0.5 top-0.5 flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-black/55 text-white"
      >
        <span className="material-symbols-outlined !text-[15px]">open_in_full</span>
      </button>
    </div>
  );
};

/** Sections of tiles: one per detected range (with its own Expand/Collapse), or every frame grouped by hour. */
const FrameGallery = ({ sections, imageUrls, selection, pendingRanges, reserveRight = false, onTileClick, onZoom, onToggleExpand }) => {
  const { start, end } = selection;
  const lo = start != null && end != null ? Math.min(start, end) : null;
  const hi = lo != null ? Math.max(start, end) : null;

  const stateOf = (ms) => ({
    inRange: lo != null && ms > lo && ms < hi,
    endpoint: ms === start || ms === end,
    tag: ms === start ? 'START' : ms === end ? 'END' : null,
    pending: pendingRanges.some((r) => ms >= r.s && ms <= r.e),
  });

  return (
    <div className={`grid grid-cols-3 gap-1.5 pb-24 pl-2.5 pt-1.5 ${reserveRight ? 'pr-8' : 'pr-2.5'}`}>
      {sections.map((sec) => {
        const key = `${sec.kind}-${sec.at}`;
        let lastHour = -1;
        return (
          <React.Fragment key={key}>
            {sec.kind === 'range' && (
              <div data-ri={sec.index} className="col-span-3 mt-3 flex scroll-mt-[112px] items-center justify-between gap-2 border-b border-[#dfe3ea] px-0.5 pb-1.5 pt-0.5 first:mt-1 dark:border-[#2f3745]">
                <div className="min-w-0">
                  <b className="text-base text-[#1b2330] dark:text-[#e8ecf3]">{clock(sec.range.start)} – {clock(sec.range.end)}</b>
                  <span className="ml-1.5 text-[13px] text-[#6a7485] dark:text-[#9aa4b5]">{durationText(sec.range.end - sec.range.start)}</span>
                </div>
                <button
                  onClick={() => onToggleExpand(sec.range.start)} aria-pressed={sec.open}
                  className={`flex min-h-[30px] flex-none items-center gap-0.5 rounded-full border py-[3px] pl-2 pr-2.5 text-[12.5px] ${sec.open ? 'border-[#2457d6] bg-[#2457d6] font-semibold text-white dark:border-[#6f95ff] dark:bg-[#6f95ff] dark:text-[#0b1020]' : 'border-[#dfe3ea] bg-white text-[#1b2330] dark:border-[#2f3745] dark:bg-[#1c222c] dark:text-[#e8ecf3]'}`}
                >
                  <span className="material-symbols-outlined !text-[16px]">{sec.open ? 'expand_less' : 'expand_more'}</span>
                  {sec.open ? 'Collapse' : 'Expand'}
                </button>
              </div>
            )}
            {sec.kind === 'pin' && (
              <div className="col-span-3 mt-3 flex items-center border-b border-[#dfe3ea] px-0.5 pb-1.5 pt-0.5 dark:border-[#2f3745]">
                <b className="text-base text-amber-600">Selected {clock(sec.ms)}</b>
                <span className="ml-1.5 text-[13px] text-[#6a7485] dark:text-[#9aa4b5]">hidden by the current filters</span>
              </div>
            )}
            {sec.frames.map((f) => {
              const hour = istParts(f.ms).h;
              const header = sec.kind === 'all' && hour !== lastHour;
              lastHour = hour;
              return (
                <React.Fragment key={f.ms}>
                  {header && <div data-hour={String(hour).padStart(2, '0')} className="col-span-3 mt-3 border-b border-[#dfe3ea] px-0.5 pb-1 pt-0.5 text-[13px] font-bold text-[#6a7485] dark:border-[#2f3745] dark:text-[#9aa4b5]">{String(hour).padStart(2, '0')}:00</div>}
                  <FrameTile
                    frame={f} imageUrls={imageUrls} state={stateOf(f.ms)} forced={sec.kind === 'pin'}
                    onClick={() => onTileClick(f.ms)} onZoom={() => onZoom(f.ms)}
                  />
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default FrameGallery;
