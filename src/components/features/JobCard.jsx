import React from 'react';
import { formatDateSmart } from '../../utils/formatDate';

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

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm flex items-center justify-between group active:bg-slate-50 transition-colors cursor-pointer hover:shadow-md"
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
        <span className="text-[10px] font-bold uppercase tracking-tighter px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 capitalize">
          {job.status}
        </span>
        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
      </div>
    </div>
  );
};

export default JobCard;
