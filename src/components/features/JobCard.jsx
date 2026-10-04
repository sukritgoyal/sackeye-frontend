import React from 'react';
import { formatDateSmart } from '../../utils/formatDate';
import { jobDisplayState } from '../../utils/jobState';

// Every state uses the same plain card; only the small status label changes.
const STATES = {
  preparing: { label: 'Preparing video', dot: 'bg-blue-500 animate-pulse', text: 'text-blue-600 dark:text-blue-400' },
  pending: { label: 'Pending', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  running: { label: 'Running', dot: 'bg-blue-500 animate-pulse', text: 'text-blue-600 dark:text-blue-400' },
  done: { label: 'Done', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  failed: { label: 'Failed', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
};

const JobCard = ({ job, onClick }) => {
  const jobDate = new Date(job.startTime);
  const dateStr = formatDateSmart(jobDate, 'Asia/Kolkata');
  const startTimeStr = jobDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

  const endTime = job.endTime ? new Date(job.endTime) : null;
  const endTimeStr = endTime ? endTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : null;

  const getDurationStr = () => {
    if (!endTime) return null;
    const durationMs = endTime - jobDate;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const durationStr = getDurationStr();
  const state = STATES[jobDisplayState(job)] || STATES.done;

  return (
    <div
      onClick={onClick}
      className={`group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-colors hover:shadow-md active:bg-slate-50 dark:border-slate-700 dark:bg-slate-800`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-900 dark:text-white font-bold text-sm">{dateStr}</span>
          {durationStr && (
            <>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-slate-500 text-xs font-medium">{durationStr}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Start:</span>
          <span className="text-slate-900 dark:text-white font-semibold">{startTimeStr}</span>
        </div>
        {endTimeStr && (
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">End:</span>
            <span className="text-slate-900 dark:text-white font-semibold">{endTimeStr}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${state.text}`}>
          <span className={`size-1.5 rounded-full ${state.dot}`} />
          {state.label}
        </span>
        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
      </div>
    </div>
  );
};

export default JobCard;
