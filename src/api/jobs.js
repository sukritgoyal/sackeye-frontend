import api from './axiosConfig';

/** A frame from the job's footage, used to mark the detection area. Returns the image as a data URL. */
export const fetchFrameForMarking = async (cameraId, startTime, endTime) => {
  const res = await api.post('/api/cameras/get-image', { cameraId, startTime, endTime });
  return res.data.imageUrl;
};

/** Start inference on a pending job. points: [{x, y}] (0..1), strict: boolean. Returns the updated job. */
export const runInference = async (jobId, { points, strict }) => {
  const res = await api.post(`/api/jobs/${jobId}/run-inference`, { points, strict });
  return res.data.job;
};
