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