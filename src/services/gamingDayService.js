export const getCurrentGamingDay = () => {
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour < 12) {
    // Before 12pm = previous gaming day (started yesterday)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  // After 12pm = current gaming day
  return now;
};

export const getGamingDayString = (date = getCurrentGamingDay()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};