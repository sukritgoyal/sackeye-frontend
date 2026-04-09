/**
 * Formats a date intelligently
 * Returns "today" for today's date
 * Returns "yesterday" for yesterday's date
 * Returns "D MMM" for dates in the current year
 * Returns "D MMM YYYY" for dates in past years
 * @param {Date} date - The date to format
 * @param {string} timeZone - The timezone (default: 'Asia/Kolkata')
 * @returns {string} - The formatted date string
 */
export const formatDateSmart = (date, timeZone = 'Asia/Kolkata') => {
  const now = new Date();
  
  // Get today's date in the specified timezone
  const todayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const todayParts = todayFormatter.formatToParts(now);
  const dateParts = dateFormatter.formatToParts(date);
  
  const todayKey = `${todayParts.find(p => p.type === 'year').value}-${todayParts.find(p => p.type === 'month').value}-${todayParts.find(p => p.type === 'day').value}`;
  const dateKey = `${dateParts.find(p => p.type === 'year').value}-${dateParts.find(p => p.type === 'month').value}-${dateParts.find(p => p.type === 'day').value}`;
  
  // Check if it's today
  if (todayKey === dateKey) {
    return 'today';
  }
  
  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const yesterdayParts = yesterdayFormatter.formatToParts(yesterday);
  const yesterdayKey = `${yesterdayParts.find(p => p.type === 'year').value}-${yesterdayParts.find(p => p.type === 'month').value}-${yesterdayParts.find(p => p.type === 'day').value}`;
  
  if (yesterdayKey === dateKey) {
    return 'yesterday';
  }
  
  // Get current year
  const currentYear = todayParts.find(p => p.type === 'year').value;
  const dateYear = dateParts.find(p => p.type === 'year').value;
  
  // Format with month abbreviation
  const monthFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric'
  });
  
  const formattedBase = monthFormatter.format(date);
  
  // If it's from a past year, add the year
  if (dateYear !== currentYear) {
    return `${formattedBase} ${dateYear}`;
  }
  
  return formattedBase;
};
