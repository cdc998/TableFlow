export const roundToNearestQuarter = (date) => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.floor(minutes / 15) * 15;
    const newDate = new Date(date);
    newDate.setMinutes(roundedMinutes, 0, 0);
    return newDate;
};

export const getPreviousIntervals = (currentTime, count = 3) => {
    const intervals = [];
    let time = roundToNearestQuarter(currentTime);
    time.setMinutes(time.getMinutes() + 15);

    for (let i = 0; i < count; i++) {
        intervals.push(new Date(time));
        time.setMinutes(time.getMinutes() - 15);
    }

    return intervals.reverse();
};

export const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

export const addTimeInIntervals = (startTime, hours, minutes = 0) => {
    const newDate = new Date(startTime);
    newDate.setHours(newDate.getHours() + hours, newDate.getMinutes() + minutes, 0, 0,);
    return roundToNearestQuarter(newDate);
};

export const shouldBeOnBreak = (startTime, currentTime = new Date()) => {
    if (!startTime) return false;

    const timeDiff = currentTime.getTime() - new Date(startTime).getTime();
    const hoursElapsed = timeDiff / (1000 * 60 * 60);

    const cyclePosition = hoursElapsed % 3.25;
    return cyclePosition >= 3 && cyclePosition < 3.25;
};

export const getNextBreakTime = startTime => {
    if (!startTime) return null;

    const start = new Date(startTime);
    return addTimeInIntervals(start, 3, 0);
}

export const getBreakEndTime = breakStartTime => {
    if (!breakStartTime) return null;

    const breakStart = new Date(breakStartTime);
    return addTimeInIntervals(breakStart, 0, 15);
};