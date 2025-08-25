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
    newDate.setHours(newDate.getHours() + hours, newDate.getMinutes() + minutes, 0, 0);
    return roundToNearestQuarter(newDate);
};

export const shouldBeOnBreak = (startTime, currentTime = new Date()) => {
    if (!startTime) return false;

    const timeDiff = currentTime.getTime() - new Date(startTime).getTime();
    const hoursElapsed = timeDiff / (1000 * 60 * 60);

    if (hoursElapsed < 3) return false;

    const cyclePosition = hoursElapsed % 3.25;
    return cyclePosition >= 3 && cyclePosition < 3.25;
};

export const getCurrentBreakInfo = (startTime, currentTime = new Date()) => {
    if (!startTime) return { status: 'closed' };

    const timeDiff = currentTime.getTime() - new Date(startTime).getTime();
    const hoursElapsed = timeDiff / (1000 * 60 * 60);

    if (hoursElapsed < 3) {
        const firstBreakTime = new Date(new Date(startTime).getTime() + (1000 * 60 * 60 * 3));
        return {
            status: 'open',
            nextBreakTime: firstBreakTime,
            currentBreakNumber: 0
        };
    }

    const completeCycles = Math.floor(hoursElapsed / 3.25);
    const cyclePosition = hoursElapsed % 3.25;

    if (cyclePosition >= 3 && cyclePosition < 3.25) {
        const cycleStartTime = new Date(new Date(startTime).getTime() + (completeCycles * 3.25 * 60 * 60 * 1000));
        const breakEndTime = new Date(cycleStartTime.getTime() + (3.25 * 60 * 60 * 1000));

        return {
            status: 'on-break',
            nextBreakTime: breakEndTime,
            currentBreakNumber: completeCycles + 1
        };
    } else {
        const nextCycleStart = new Date(new Date(startTime).getTime() + ((completeCycles + 1) * 3.25 * 60 * 60 * 1000));
        const nextBreakTime = new Date(nextCycleStart.getTime() - (0.25 * 60 * 60 * 1000));

        return {
            status: 'open',
            nextBreakTime: nextBreakTime,
            currentBreakNumber: completeCycles + 1
        };
    }
}

export const getNextBreakTime = startTime => {
    if (!startTime) return null;

    const start = new Date(startTime);
    return addTimeInIntervals(start, 3, 0);
};

export const getBreakEndTime = breakStartTime => {
    if (!breakStartTime) return null;

    const breakStart = new Date(breakStartTime);
    return addTimeInIntervals(breakStart, 0, 15);
};

export const getTimeRemaining = (targetTime, currentTime = new Date()) => {
    if (!targetTime) return null;

    const diff = new Date(targetTime).getTime() - currentTime.getTime();

    if (diff <= 0) return { hours: 0, minutes: 0, seconds:0 };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff % (1000 * 60 * 60) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
};

export const formatCountdown = timeRemaining => {
    if (!timeRemaining) return "00:00:00";

    const hours = timeRemaining.hours.toString().padStart(2, '0');
    const minutes = timeRemaining.minutes.toString().padStart(2, '0');
    const seconds = timeRemaining.seconds.toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
};

export const getNextFutureBreakTime = (startTime, currentTime = new Date()) => {
  let currentStartTime = new Date(startTime);
  let nextBreak;
  
  let iterations = 0;
  do {
    nextBreak = getNextBreakTime(currentStartTime);
    
    if (nextBreak <= currentTime) {
      currentStartTime = new Date(nextBreak.getTime() + 1000 * 60 * 15);
    }
    
    iterations++;
  } while (nextBreak <= currentTime && iterations < 20);
  
  return nextBreak;
};

export const generateSequence = (totalSeats, startingSeat) => {
    const sequence = [];

    for (let i = 0; i < totalSeats; i++) {
        let currentSeat = startingSeat + i;

        if (currentSeat > totalSeats) {
            currentSeat = currentSeat - totalSeats;
        }

        sequence.push(currentSeat);

        if (currentSeat === totalSeats) {
            sequence.push('dealer');
        }
    }

    return sequence;
};

export const checkBreakInInterval = (table, intervalStart, intervalEnd) => {
    if (!table.startTime || table.isTrialBreak) return false;

    const startTime = new Date(table.startTime);

    const elapsedMs = intervalStart.getTime() - startTime.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

    if (elapsedMinutes < 180) return false;

    const cycleNumber = Math.floor(elapsedMinutes / 195); // 195 = 180 play + 15 break
    const minutesInCurrentCycle = elapsedMinutes % 195;

    // Break occurs from minute 180 to 195 in each cycle
    const isInBreakPeriod = minutesInCurrentCycle >= 180;

    if (isInBreakPeriod) {
        const breakStartTime = new Date(startTime.getTime() + ((cycleNumber * 195 + 180) * 60 * 1000));
        const breakEndTime = new Date(startTime.getTime() + ((cycleNumber * 195 + 195) * 60 * 1000));

        return intervalStart < breakEndTime && intervalEnd > breakStartTime;
    }

    return false;
};