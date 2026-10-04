import React from 'react';
import { clock } from '../../../utils/timeRange';

/** Fixed bar under the nav: step through the detected truck ranges, open the filters. */
const RangeBar = ({ ranges, current, subtitle, hasFrames, loading, filtersActive, onPrev, onNext, onJump, onOpenFilters }) => {
  const range = ranges[current];
  const arrow = 'flex h-10 items-center justify-center rounded-lg text-[#1b2330] disabled:opacity-30 dark:text-[#e8ecf3]';

  return (
    <div className="fixed left-1/2 top-[calc(3.5rem+env(safe-area-inset-top))] z-[99] grid h-[46px] w-full max-w-md -translate-x-1/2 grid-cols-[44px_1fr_44px_44px] items-center border-b border-[#dfe3ea] bg-white px-1 dark:border-[#2f3745] dark:bg-[#1c222c]">
      <button onClick={onPrev} disabled={!ranges.length || current <= 0} aria-label="Previous truck range" className={arrow}>
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      <div onClick={() => range && onJump()} className="min-w-0 cursor-pointer text-center leading-tight">
        <div className="truncate font-bold text-[#1b2330] dark:text-[#e8ecf3]">
          {loading ? 'Loading…' : range ? `${clock(range.start)} – ${clock(range.end)}` : hasFrames ? 'No truck ranges' : 'No data'}
        </div>
        <div className="truncate text-[11.5px] text-[#6a7485] dark:text-[#9aa4b5]">
          {range ? `${subtitle} · ${current + 1}/${ranges.length} · ${Math.round((range.end - range.start) / 60000)} min` : subtitle}
        </div>
      </div>

      <button onClick={onNext} disabled={!ranges.length || current >= ranges.length - 1} aria-label="Next truck range" className={arrow}>
        <span className="material-symbols-outlined">chevron_right</span>
      </button>

      <button onClick={onOpenFilters} aria-label="Filters" className={`${arrow} relative`}>
        <span className="material-symbols-outlined">filter_alt</span>
        {filtersActive && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#2457d6] dark:bg-[#6f95ff]" />}
      </button>
    </div>
  );
};

export default RangeBar;
