import { useCallback, useEffect, useState } from 'react';
import { fetchFrames } from '../api/timeRanges';

const NONE = [];
const prepare = (frames) => frames.map((f) => ({ ...f, ms: Date.parse(f.minute), boxes: f.boxes || [] }));   // boxes is null until detection has run

/** Loads every frame of one camera for [fromMs, toMs). Returns { frames, loading, error, reload } (reload refreshes quietly). */
export const useDayFrames = (cameraId, fromMs, toMs) => {
  const key = cameraId && fromMs < toMs ? `${cameraId}|${fromMs}|${toMs}` : null;
  const [result, setResult] = useState({ key: null, frames: NONE, error: '' });

  useEffect(() => {
    if (!key) return undefined;
    const ctrl = new AbortController();
    fetchFrames(cameraId, fromMs, toMs, ctrl.signal)
      .then((frames) => setResult({ key, frames: prepare(frames), error: '' }))
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        const msg = err.response?.status === 404 ? 'No truck-detection data for this camera.' : (err.response?.data?.msg || err.message);
        setResult({ key, frames: NONE, error: msg });
      });
    return () => ctrl.abort();
  }, [key, cameraId, fromMs, toMs]);

  const reload = useCallback(async () => {
    if (!key) return;
    const frames = await fetchFrames(cameraId, fromMs, toMs);
    setResult({ key, frames: prepare(frames), error: '' });
  }, [key, cameraId, fromMs, toMs]);

  const ready = result.key === key;
  return { frames: ready ? result.frames : NONE, loading: key !== null && !ready, error: ready ? result.error : '', reload };
};
