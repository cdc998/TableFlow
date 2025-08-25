import { getCurrentGamingDay, getGamingDayString } from "./gamingDayService";

const STORAGE_VERSION = 'v1';

export const saveTablesState = (tables) => {
    try {
      const dataToSave = {
        version: STORAGE_VERSION,
        timestamp: new Date().toISOString(),
        tables: tables
      };
      localStorage.setItem('tableflow-tables', JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Failed to save tables to localStorage:', error);
    }
};

export const loadTablesState = () => {
    try {
      const savedData = localStorage.getItem('tableflow-tables');
      if (savedData) {
        const parsed = JSON.parse(savedData);

        const tables = parsed.version ? parsed.tables : parsed;

        return tables.map(table => ({
          ...getDefaultTableProperties(),
          ...table,
          startTime: table.startTime ? new Date(table.startTime) : null,
          breakTime: table.breakTime ? new Date(table.breakTime) : null,
          nextBreakTime: table.nextBreakTime ? new Date(table.nextBreakTime) : null
        }));
      }
    } catch (error) {
      console.warn('Failed to load tables from localStorage:', error);
    }
    return null;
};

export const getDefaultTableProperties = () => ({
    status: "closed",
    startTime: null,
    breakTime: null,
    nextBreakTime: null,
    countdown: '',
    countdownLabel: '',
    isTrialBreak: false,
    trialSeats: null,
    trialStartSeat: null,
    currentBreakSeat: null
});

export const logTableActivity = (tableNumber, action, details = {}) => {
    try {
      const gamingDayStr = getGamingDayString();

      const logEntry = {
        id: `${tableNumber}-${action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        gamingDay: gamingDayStr,
        table: tableNumber,
        action: action,
        ...details
      };

      const logKey = `tableflow-logs-${gamingDayStr}`;
      const existingLogs = JSON.parse(localStorage.getItem(logKey) || '[]');

      existingLogs.push(logEntry);

      localStorage.setItem(logKey, JSON.stringify(existingLogs));

      console.log('Table activity logged:', logEntry);
    } catch (error) {
      console.error('Failed to log table activity:', error);
    }
};

export const clearCurrentGameDayStorage = () => {
    const gamingDayStr = getGamingDayString();

    localStorage.removeItem('tableflow-tables');
    localStorage.removeItem(`tableflow-logs-${gamingDayStr}`);

    return gamingDayStr;
};

export const removeTableActivityLog = (tableNumber, action, timestamp) => {
  try {
    const gamingDayStr = getGamingDayString();
    const logKey = `tableflow-logs-${gamingDayStr}`;
    const existingLogs = JSON.parse(localStorage.getItem(logKey) || '[]');

    console.log('BEFORE removal:', {
      logKey,
      totalLogs: existingLogs.length,
      searchingFor: {
        tableNumber,
        action,
        timestamp: timestamp ? new Date(timestamp).toISOString() : 'none'
      },
      allLogs: existingLogs
    });

    // Filter out the specific log entry
    const updatedLogs = existingLogs.filter(log => {
      // Match by table and action first
      if (log.table === tableNumber && log.action === action) {
        if (timestamp && action === 'open') {
          // ✅ For open logs, compare with startTime field in the log details
          const logStartTime = new Date(log.startTime);
          const targetStartTime = new Date(timestamp);
          const timesMatch = logStartTime.getTime() === targetStartTime.getTime();
          
          console.log('Comparing open log:', {
            logId: log.id,
            logStartTime: logStartTime.toISOString(),
            targetStartTime: targetStartTime.toISOString(),
            timesMatch,
            shouldRemove: timesMatch
          });
          
          return !timesMatch; // Keep if times DON'T match (remove if they DO match)
        } else if (action === 'close') {
          // For close logs, compare with timestamp field
          const logTime = new Date(log.timestamp);
          const targetTime = new Date(timestamp);
          const timesMatch = logTime.getTime() === targetTime.getTime();
          
          console.log('Comparing close log:', {
            logId: log.id,
            logTime: logTime.toISOString(),
            targetTime: targetTime.toISOString(),
            timesMatch,
            shouldRemove: timesMatch
          });
          
          return !timesMatch;
        } else {
          // If no timestamp specified, remove all logs of this action for this table
          console.log('Removing log (no timestamp):', log.id);
          return false; // Remove this log
        }
      }
      return true; // Keep other logs
    });

    localStorage.setItem(logKey, JSON.stringify(updatedLogs));
    
    console.log('AFTER removal:', {
      originalCount: existingLogs.length,
      newCount: updatedLogs.length,
      removed: existingLogs.length - updatedLogs.length,
      updatedLogs
    });
    
    return updatedLogs.length < existingLogs.length;
  } catch (error) {
    console.error('Failed to remove table activity log:', error);
    return false;
  }
};