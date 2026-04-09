/**
 * Format duration from seconds to readable format (h:m:s)
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string (e.g., "1h 32m 45s" or "5m 30s")
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0s';

  // Round off to remove decimals
  const totalSeconds = Math.round(seconds);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(' ');
};
