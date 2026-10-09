import api from './axiosConfig';
import { toIso } from '../utils/timeRange';

/** Frames (with detected truck boxes) of a camera between two instants (ms). */
export const fetchFrames = async (cameraId, fromMs, toMs, signal) => {
  const res = await api.get(`/api/time-ranges/${cameraId}/frames`, { params: { from: toIso(fromMs), to: toIso(toMs) }, signal });
  return res.data.frames;
};

/** Signed links for frame image paths: { [path]: url } */
export const fetchImageUrls = async (cameraId, paths) => {
  const res = await api.post(`/api/time-ranges/${cameraId}/image-urls`, { paths });
  return res.data.urls;
};

/** Run truck detection for the frames in the window that have none yet. Returns the run: { id, status, ... } */
export const startDetection = async (cameraId, fromMs, toMs) => {
  const res = await api.post(`/api/time-ranges/${cameraId}/run-detection`, { from: toIso(fromMs), to: toIso(toMs) });
  return res.data.run;
};

export const fetchDetectionRun = async (cameraId, runId) => {
  const res = await api.get(`/api/time-ranges/${cameraId}/run-detection/${runId}`);
  return res.data.run;
};

/** Create one job (video only, inference pending) per range. ranges: [{ startTime, endTime }] as "YYYY-MM-DD HH:MM:SS" */
export const submitTimeRanges = async (cameraId, ranges) => {
  const res = await api.post('/api/jobs/time-ranges', { cameraId, ranges });
  return res.data;
};
