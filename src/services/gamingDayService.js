export const getCurrentGamingDay = (time = new Date()) => {
  const currentHour = time.getHours();
  const currentMinutes = time.getMinutes();

  if (currentHour <= 4) {
    const yesterday = new Date(time);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  if (currentHour < 11 || (currentHour === 11 && currentMinutes < 30)) {
    const yesterday = new Date(time);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  // After 12pm = current gaming day
  return time;
};

export const getGamingDayString = (date = getCurrentGamingDay()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const isValidGamingHour = (time) => {
  const hour = time.getHours();
  return hour >= 12 || hour <= 4;
};

export const isValidCloseTime = (closeTime, openTime = null) => {
  const now = new Date();

  if (openTime && closeTime < openTime) {
    return { valid: false, reason: 'Cannot close table before it opened' };
  }

  if (!isValidGamingHour(closeTime)) {
    return { valid: false, reason: 'Cannot close table outside gaming hours (12:00 PM - 4:00 AM)' };
  }

  const currentGamingDay = getCurrentGamingDay();
  const closeTimeGamingDay = getCurrentGamingDay(closeTime);

  if (currentGamingDay.toDateString() !== closeTimeGamingDay.toDateString()) {
    return { valid: false, reason: 'Can only close table within the current gaming day' };
  }

  return { valid: true };
};