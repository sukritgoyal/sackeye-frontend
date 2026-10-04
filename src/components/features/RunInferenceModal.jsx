import React, { useState } from 'react';
import Loader from '../common/Loader';
import AlertDialog from '../common/AlertDialog';
import ImagePointMarker from './ImagePointMarker';
import { fetchFrameForMarking, runInference } from '../../api/jobs';
import { istStamp } from '../../utils/timeRange';

const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

/**
 * Starts inference on a pending job. The detection area (points) and Strict are chosen here, because they are
 * only needed when inference actually runs. A job can be run once, so a confirmation comes before the request.
 */
const RunInferenceModal = ({ isOpen, job, onClose, onStarted }) => {
  const [strict, setStrict] = useState(false);
  const [points, setPoints] = useState([]);
  const [marking, setMarking] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [loadingImage, setLoadingImage] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !job) return null;

  const close = () => {
    if (running) return;
    setStrict(false); setPoints([]); setMarking(false); setImageUrl(''); setConfirmOpen(false); setError('');
    onClose();
  };

  const loadFrame = async () => {
    setLoadingImage(true); setError('');
    try {
      setImageUrl(await fetchFrameForMarking(job.camera, istStamp(new Date(job.startTime).getTime()), istStamp(new Date(job.endTime).getTime())));
    } catch (err) {
      setError(err.response?.data?.msg || 'Could not load a frame to mark. You can still run without marking the area.');
      setMarking(false);
    } finally {
      setLoadingImage(false);
    }
  };

  const start = async () => {
    setRunning(true); setError('');
    try {
      const updated = await runInference(job._id, { points, strict });
      setConfirmOpen(false); setRunning(false);
      setStrict(false); setPoints([]); setMarking(false); setImageUrl('');
      onStarted(updated);
    } catch (err) {
      setConfirmOpen(false); setRunning(false);
      setError(err.response?.data?.msg || err.message);
    }
  };

  const minutes = Math.round((new Date(job.endTime) - new Date(job.startTime)) / 60000);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm" onClick={close} />

      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-t-3xl bg-white p-6 dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-3">
          {marking && (
            <button onClick={() => setMarking(false)} disabled={loadingImage} title="Back" className="material-symbols-outlined rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800">
              arrow_back
            </button>
          )}
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{marking ? 'Mark Detection Points' : 'Run Inference'}</h2>
        </div>

        {!marking ? (
          <div className="mb-6 space-y-4">
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Time range</p>
              <p className="mt-1 text-lg font-bold">{timeOf(job.startTime)} → {timeOf(job.endTime)}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{minutes} min</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Strict</label>
                <button
                  role="switch" aria-checked={strict} onClick={() => setStrict(!strict)} title="Toggle strict mode"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${strict ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${strict ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <button
                onClick={() => { setMarking(true); loadFrame(); }}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-base">draw</span>
                {points.length ? `${points.length} points marked` : 'Mark area (optional)'}
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 flex flex-1 flex-col">
            <ImagePointMarker
              imageUrl={imageUrl} isLoading={loadingImage} points={points} onRefresh={loadFrame}
              onPointsSubmit={(marked) => { setPoints(marked); setMarking(false); }}
            />
          </div>
        )}

        {!marking && (
          <div className="flex gap-3">
            <button onClick={close} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button onClick={() => setConfirmOpen(true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800">
              <span className="material-symbols-outlined">play_arrow</span>
              Run
            </button>
          </div>
        )}

        <AlertDialog
          isOpen={confirmOpen} onClose={() => !running && setConfirmOpen(false)} onConfirm={start}
          title="Start inference?" message="This starts a cloud run on this job's video. Inference can only be run once for a job, and it cannot be repeated if it fails."
          cancelText="Cancel" confirmText={running ? 'Starting…' : 'Start'} isLoading={running} icon="play_circle" variant="blue"
        />
        {running && <div className="absolute inset-0 z-[210] flex items-center justify-center rounded-t-3xl bg-white/60 dark:bg-slate-900/60"><Loader size="md" showText={false} /></div>}
      </div>
    </div>
  );
};

export default RunInferenceModal;
