import React from 'react';
import Loader from '../../common/Loader';

/** Shown when some frames of the day have no truck detection yet: how many, and a button to run detection for just those. */
const DetectionBar = ({ missing, running, elapsed, error, onRun }) => (
  <div className="mx-3 mt-1.5 rounded-[10px] border border-[#dfe3ea] bg-white p-3 dark:border-[#2f3745] dark:bg-[#1c222c]">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[#1b2330] dark:text-[#e8ecf3]">{missing} frame{missing === 1 ? '' : 's'} not checked for trucks</div>
        <div className="text-[12.5px] text-[#6a7485] dark:text-[#9aa4b5]">{running ? `Running detection… ${elapsed}s` : 'Detection runs only on these frames.'}</div>
      </div>
      <button
        onClick={onRun} disabled={running}
        className="flex min-h-10 flex-none items-center gap-1.5 rounded-[10px] bg-[#2457d6] px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-[#6f95ff] dark:text-[#0b1020]"
      >
        {running ? <Loader size="sm" showText={false} /> : <><span className="material-symbols-outlined !text-[18px]">play_arrow</span>Run detection</>}
      </button>
    </div>
    {error && <div className="mt-2 text-[12.5px] font-medium text-red-600 dark:text-red-400">{error}</div>}
  </div>
);

export default DetectionBar;
