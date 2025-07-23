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