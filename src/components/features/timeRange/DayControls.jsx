import React from 'react';
import { dateInputValue, dayStartFromInput, HOUR } from '../../../utils/timeRange';

const field = 'min-h-10 rounded-[10px] border border-[#dfe3ea] bg-white px-2.5 py-1.5 text-[#1b2330] dark:border-[#2f3745] dark:bg-[#1c222c] dark:text-[#e8ecf3]';

/** Back button, Today / Yesterday / date picker and camera selector. */
const DayControls = ({ cameras, cameraId, onCameraChange, dayMs, todayMs, onDayChange, onBack }) => {
  const today = todayMs;
  const yesterday = today - 24 * HOUR;
  const seg = (active) => `min-h-10 whitespace-nowrap px-3 py-2 ${active ? 'bg-[#2457d6] font-semibold text-white dark:bg-[#6f95ff] dark:text-[#0b1020]' : 'text-[#1b2330] dark:text-[#e8ecf3]'}`;

  return (
    <section className="grid gap-2 px-3 pb-1 pt-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={onBack} aria-label="Back" className={`${field} flex w-10 items-center justify-center px-0`}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="inline-flex overflow-hidden rounded-[10px] border border-[#dfe3ea] bg-white dark:border-[#2f3745] dark:bg-[#1c222c]">
          <button onClick={() => onDayChange(today)} className={seg(dayMs === today)}>Today</button>
          <button onClick={() => onDayChange(yesterday)} className={`${seg(dayMs === yesterday)} border-l border-[#dfe3ea] dark:border-[#2f3745]`}>Yesterday</button>
        </div>
        <input
          type="date" aria-label="Pick a date" value={dateInputValue(dayMs)} max={dateInputValue(todayMs)}
          onChange={(e) => e.target.value && onDayChange(dayStartFromInput(e.target.value))}
          className={`${field} ${dayMs !== today && dayMs !== yesterday ? 'border-[#2457d6] ring-1 ring-[#2457d6] dark:border-[#6f95ff] dark:ring-[#6f95ff]' : ''}`}
        />
        <select aria-label="Camera" value={cameraId || ''} onChange={(e) => onCameraChange(e.target.value)} className={field}>
          {cameras.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
    </section>
  );
};

export default DayControls;
