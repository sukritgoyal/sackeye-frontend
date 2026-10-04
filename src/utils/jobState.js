import { dayStartOf, dayLabel, HOUR } from './timeRange';

/** What the jobs list should show for a job: preparing (video being cut), pending, running, done or failed. */
export const jobDisplayState = (job) => {
  if (job.status === 'processing') return 'preparing';
  return job.inference_state || 'done';
};

/** Which day bucket a job belongs to (by the footage time): today / yesterday / earlier. */
export const jobDayBucket = (job, todayMs) => {
  const d = dayStartOf(new Date(job.startTime).getTime());
  if (d === todayMs) return 'today';
  if (d === todayMs - 24 * HOUR) return 'yesterday';
  return 'earlier';
};

export const groupHeading = (job, todayMs) => {
  const bucket = jobDayBucket(job, todayMs);
  return bucket === 'today' ? 'Today' : bucket === 'yesterday' ? 'Yesterday' : dayLabel(new Date(job.startTime).getTime());
};
