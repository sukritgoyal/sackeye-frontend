import React from 'react';
import { clock, durationText } from '../../../utils/timeRange';

const iconBtn = 'relative flex h-11 min-w-11 items-center justify-center rounded-[10px] text-white';

/** Fixed top bar: saved-ranges list (left), what to do / the range being made (middle), add or confirm/cancel (right). */
const TimeRangeNav = ({ step, start, end, count, onOpenList, onAdd, onConfirm, onCancel }) => {
  const lo = Math.min(start ?? 0, end ?? 0);
  const hi = Math.max(start ?? 0, end ?? 0);

  let line1 = 'Select a time range';
  let line2 = count ? `${count} selected · tap + to add another` : 'tap + to start';
  if (step === 'start') { line1 = 'Tap an image: START'; line2 = 'first time of the range'; }
  if (step === 'end') { line1 = `Start ${clock(start)}`; line2 = 'now tap an image for the END'; }
  if (step === 'ready') { line1 = durationText(hi - lo); line2 = `${clock(lo)} → ${clock(hi)}`; }

  return (
    <header className="fixed left-1/2 top-0 z-[100] w-full max-w-md -translate-x-1/2 bg-[#1c2430] pt-[env(safe-area-inset-top)] text-white dark:bg-[#0c1016]">
      <div className="grid h-14 grid-cols-[64px_1fr_auto] items-center gap-1.5 px-1.5">
        <button onClick={onOpenList} aria-label="Selected time ranges" className={`${iconBtn} bg-white/10`}>
          <span className="material-symbols-outlined">format_list_bulleted</span>
          {count > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#2457d6] px-1 text-[11px] font-bold text-white dark:bg-[#6f95ff] dark:text-[#0b1020]">{count}</span>
          )}
        </button>

        <div className="min-w-0 text-center leading-tight">
          <div className="truncate text-base font-bold">{line1}</div>
          <div className="truncate text-xs opacity-80">{line2}</div>
        </div>

        <div className="flex gap-1.5">
          {step === 'idle' ? (
            <button onClick={onAdd} aria-label="Add time range" className={`${iconBtn} w-11 bg-[#2457d6] dark:bg-[#6f95ff] dark:text-[#0b1020]`}>
              <span className="material-symbols-outlined font-bold">add</span>
            </button>
          ) : (
            <>
              {step === 'ready' && (
                <button onClick={onConfirm} aria-label="Confirm range" className={`${iconBtn} w-11 bg-[#16a34a]`}>
                  <span className="material-symbols-outlined font-bold">check</span>
                </button>
              )}
              <button onClick={onCancel} aria-label="Cancel" className={`${iconBtn} w-11 bg-white/15`}>
                <span className="material-symbols-outlined font-bold">close</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TimeRangeNav;
