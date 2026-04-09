export const SOCKET_EVENTS = {
  JOIN_JOB: 'join_job',         // User enters a specific camera room
  LEAVE_JOB: 'leave_job',       // User exits the monitor
  COUNT_UPDATE: 'count_update', // Live detection number
  FRAME_UPDATE: 'frame_update', // Live image data
  JOB_ERROR: 'job_error',       // Python worker crash
};