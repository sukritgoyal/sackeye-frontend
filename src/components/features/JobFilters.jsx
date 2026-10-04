import React from 'react';

const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick} aria-pressed={active}
    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active
      ? 'border-blue-600 bg-blue-600 text-white'
      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
  >
    {children}
  </button>
);

/** Day chips (Today / Yesterday / Earlier) and state chips (Pending / Running / Done / Failed). Several can be on at once. */
const JobFilters = ({ days, states, dayCounts, stateCounts, onToggleDay, onToggleState }) => (
  <div className="mb-5 space-y-2">
    <div className="flex gap-2 overflow-x-auto">
      {[['today', 'Today'], ['yesterday', 'Yesterday'], ['earlier', 'Earlier']].map(([key, label]) => (
        <Chip key={key} active={days.has(key)} onClick={() => onToggleDay(key)}>{label} · {dayCounts[key] || 0}</Chip>
      ))}
    </div>
    <div className="flex gap-2 overflow-x-auto">
      {[['pending', 'Pending'], ['running', 'Running'], ['done', 'Done'], ['failed', 'Failed']]
        .filter(([key]) => key === 'pending' || key === 'done' || stateCounts[key] > 0 || states.has(key))
        .map(([key, label]) => (
          <Chip key={key} active={states.has(key)} onClick={() => onToggleState(key)}>{label} · {stateCounts[key] || 0}</Chip>
        ))}
    </div>
  </div>
);

export default JobFilters;
