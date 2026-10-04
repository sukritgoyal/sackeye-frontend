import React from 'react';

const COPY = {
  preparing: { title: 'Preparing video', text: 'The clip is being cut from the recordings. This page updates by itself.', accent: 'border-l-blue-400', dot: 'bg-blue-500 animate-pulse' },
  pending: {},
  running: { title: 'Inference running', text: 'Detections appear below as they are found.', accent: 'border-l-blue-400', dot: 'bg-blue-500 animate-pulse' },
  failed: { title: 'Inference failed', text: 'This job could not be processed. Inference cannot be run again for it.', accent: 'border-l-red-400', dot: 'bg-red-500' },
};

/** Where the job stands, with the Run inference button for a pending one. Nothing is shown for a finished job. */
const InferenceBanner = ({ job, onRun }) => {
  if (!job) return null;
  const key = job.status === 'processing' ? 'preparing'
    : job.inference_state === 'pending' && job.status === 'completed' ? 'pending'
    : job.inference_state === 'running' ? 'running'
    : job.inference_state === 'failed' ? 'failed' : null;
  if (!key) return null;
  const { title, text, accent, dot } = COPY[key];

  if (key === 'pending') {                                   // nothing to explain: just the button
    return (
      <div className="mx-6 mt-4">
        <button
          onClick={onRun}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
        >
          <span className="material-symbols-outlined">play_arrow</span>
          Run inference
        </button>
      </div>
    );
  }

  return (
    <div className={`mx-6 mt-4 rounded-2xl border border-l-4 border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${accent}`}>
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${dot}`} />
        <p className="text-sm font-bold">{title}</p>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
};

export default InferenceBanner;
