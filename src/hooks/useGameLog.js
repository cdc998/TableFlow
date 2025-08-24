import { useState, useCallback } from 'react';
import { getCurrentGamingDay, getGamingDayString } from '../services/gamingDayService';

export const useGameLog = (tables) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const getHistoryData = useCallback(() => {
    const gamingDayStr = getGamingDayString();
    const logKey = `tableflow-logs-${gamingDayStr}`;
    const logs = JSON.parse(localStorage.getItem(logKey) || '[]');

    const sessions = {};

    logs.forEach(log => {
      if (log.action === 'open') {
        const sessionId = log.id;
        sessions[sessionId] = {
          sessionId: sessionId,
          tableNumber: log.table,
          openLog: log,
          closeLog: null
        };
      } else if (log.action === 'close') {
        // find most recent open without close
        const tableOpenSessions = Object.values(sessions).filter(s =>
          s.tableNumber === log.table && !s.closeLog
        );

        if (tableOpenSessions.length > 0) {
          const mostRecentSession = tableOpenSessions.sort((a, b) =>
            new Date(b.openLog.timestamp) - new Date(a.openLog.timestamp)
          )[0];

          mostRecentSession.closeLog = log;
        }
      }
    });

    // currently open tables not in logs
    tables.forEach(table => {
      if (table.startTime && table.status !== 'closed') {
        const sessionId = `current-${table.tableNumber}-${table.startTime.getTime()}`;

        const existingSession = Object.values(sessions).find(s =>
          s.tableNumber === table.tableNumber &&
          s.openLog.startTime === table.startTime.toISOString() &&
          !s.closeLog
        );

        if (!existingSession) {
          sessions[sessionId] = {
            sessionId: sessionId,
            tableNumber: table.tableNumber,
            openLog: {
              id: sessionId,
              timestamp: table.startTime.toISOString(),
              table: table.tableNumber,
              action: 'open',
              startTime: table.startTime.toISOString(),
              isTrialBreak: table.isTrialBreak,
              trialSeats: table.trialSeats,
              trialStartSeat: table.trialStartSeat
            },
            closeLog: null
          };
        }
      }
    });

    const historyItems = Object.values(sessions).map(session => {
      const currentTable = tables.find(t => t.tableNumber === session.tableNumber);
      const isCurrentlyOpen = currentTable && currentTable.status !== 'closed' && !session.closeLog;

      return {
        sessionId: session.sessionId,
        tableNumber: session.tableNumber,
        openTime: new Date(session.openLog.startTime),
        closeTime: session.closeLog ? new Date(session.closeLog.timestamp) : null,
        duration: session.closeLog ? session.closeLog.duration : null,
        breakType: session.openLog.isTrialBreak ? `Trial (${session.openLog.trialSeats} seats)` : 'Regular',
        status: isCurrentlyOpen ? 'Open' : 'Closed',
        isCompleteSession: !!session.closeLog
      };
    });

    return historyItems.sort((a, b) => b.openTime - a.openTime);
  }, [tables, refreshTrigger]);

  const deleteSession = useCallback((sessionId) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    const gamingDayStr = getGamingDayString();
    const logKey = `tableflow-logs-${gamingDayStr}`;
    const logs = JSON.parse(localStorage.getItem(logKey) || '[]');

    const updatedLogs = logs.filter(log => {
      // remove logs that belong to this session
      if (log.id === sessionId) return false;
      
      // Close logs to find matching open log sessionId
      if (log.action === 'close') {
        const openLog = logs.find(l =>
          l.action === 'open' &&
          l.table === log.table &&
          l.id === sessionId
        );
        if (openLog) return false;
      }

      return true;
    });

    localStorage.setItem(logKey, JSON.stringify(updatedLogs));
    setRefreshTrigger(prev => prev + 1); // Force re-render
  }, []);

  return {
    historyData: getHistoryData(),
    deleteSession,
    getHistoryData
  };
};