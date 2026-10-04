import React from 'react';
import BottomSheet from './BottomSheet';
import Loader from '../../common/Loader';
import { clock, dayLabel, dayStartOf, durationText, HOUR } from '../../../utils/timeRange';

const dayHeading = (ms) => {
  const today = dayStartOf(Date.now());
  const d = dayStartOf(ms);
  return d === today ? 'Today' : d === today - 24 * HOUR ? 'Yesterday' : dayLabel(d);
};

/** The ranges picked so far (kept in memory only) with remove and Submit. After submitting it shows what was created. */
const SelectedRangesSheet = ({ isOpen, items, submitting, error, result, onRemove, onClearAll, onJump, onSubmit, onViewJobs, onClose }) => {
  const groups = new Map();
  [...items].sort((a, b) => a.s - b.s).forEach((r) => { const d = dayStartOf(r.s); if (!groups.has(d)) groups.set(d, []); groups.get(d).push(r); });

  return (
    <BottomSheet isOpen={isOpen} title={result ? 'Jobs created' : `Selected time ranges (${items.length})`} onClose={onClose}>
      {result ? (
        <div className="py-2">
          <div className="mb-3 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">check_circle</span>
            <p className="text-sm text-emerald-800 dark:text-emerald-200">
              {result.created} job{result.created === 1 ? '' : 's'} created. The video for each range is being prepared; they appear in the camera&apos;s Recent Sessions as <b>Pending</b> and inference has not been run.
              {result.skipped > 0 && ` ${result.skipped} range${result.skipped === 1 ? ' was' : 's were'} skipped because a job for the same time already exists.`}
            </p>
          </div>
          <button onClick={onViewJobs} className="w-full rounded-xl bg-[#2457d6] py-3 font-semibold text-white dark:bg-[#6f95ff] dark:text-[#0b1020]">View jobs</button>
        </div>
      ) : (
        <>
          {!items.length && <p className="py-3 text-[12.5px] text-[#6a7485] dark:text-[#9aa4b5]">Nothing selected yet. Tap + in the top bar, then tap a start and an end image.</p>}
          {[...groups.entries()].map(([d, rs]) => (
            <div key={d}>
              <div className="mb-1 mt-3 text-xs font-bold uppercase tracking-wider text-[#6a7485] dark:text-[#9aa4b5]">{dayHeading(d)}</div>
              {rs.map((r) => (
                <div key={r.id} className="my-1.5 flex items-center gap-2 rounded-[10px] border border-[#dfe3ea] p-2.5 dark:border-[#2f3745]">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onJump(r)}>
                    <b className="text-base">{clock(r.s)} → {clock(r.e)}</b>
                    <span className="ml-1.5 rounded-md border border-[#dfe3ea] bg-[#f3f4f7] px-1.5 py-px text-[11px] font-semibold dark:border-[#2f3745] dark:bg-[#12161d]">{r.cameraName}</span>
                    <small className="block text-[#6a7485] dark:text-[#9aa4b5]">{durationText(r.e - r.s)}</small>
                  </div>
                  <button onClick={() => onRemove(r.id)} aria-label="Remove" className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border border-[#dfe3ea] text-red-600 dark:border-[#2f3745] dark:text-red-400">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ))}
            </div>
          ))}

          {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[12.5px] text-[#6a7485] dark:text-[#9aa4b5]">Not saved until you submit.</span>
            {items.length > 0 && <button onClick={onClearAll} disabled={submitting} className="px-1 py-2 text-red-600 disabled:opacity-50 dark:text-red-400">Remove all</button>}
          </div>
          <button
            onClick={onSubmit} disabled={!items.length || submitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2457d6] py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#6f95ff] dark:text-[#0b1020]"
          >
            {submitting ? <Loader size="sm" showText={false} /> : <><span className="material-symbols-outlined">send</span>Submit {items.length ? `${items.length} range${items.length === 1 ? '' : 's'}` : ''}</>}
          </button>
        </>
      )}
    </BottomSheet>
  );
};

export default SelectedRangesSheet;
