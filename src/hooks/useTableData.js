import { useState, useEffect, useRef } from 'react';
import { saveTablesState, loadTablesState, logTableActivity, clearCurrentGameDayStorage, removeTableActivityLog } from '../services/storageService';
import { INITIAL_TABLES } from '../config/tableConfig';
import { formatCountdown, generateSequence, getCurrentBreakInfo, getTimeRemaining } from '../utils/timeHelpers';

export const useTableData = () => {
  const loggedActionsRef = useRef(new Set());
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);

  const getInitialTables = () => {
    const savedTables = loadTablesState();
    if (savedTables && savedTables.length > 0) {
      return savedTables;
    }
    return INITIAL_TABLES;
  };

  const [tables, setTables] = useState(getInitialTables);

  useEffect(() => {
    saveTablesState(tables);
  }, [tables]);

  useEffect(() => {
    const updateAllCountdowns = () => {
      const now = new Date();

      setTables(prevTables =>
        prevTables.map(table => {
          if (table.status === 'closed' || !table.startTime) return table;

          let updatedTable = { ...table };

          // Trial Break
          if (table.isTrialBreak) {
            const sequence = generateSequence(table.trialSeats || 9, table.trialStartSeat || 9);
            const startTime = new Date(table.startTime);

            if (now < startTime) {
              updatedTable.status = 'trial-break';
              updatedTable.currentBreakSeat = null;
              updatedTable.nextBreakTime = startTime;

              const remaining = getTimeRemaining(startTime);
              if (remaining && remaining.hours >= 0 && remaining.minutes >= 0 && remaining.seconds >= 0) {
                updatedTable.countdown = formatCountdown(remaining);
                updatedTable.countdownLabel = 'Starts In';
              }
            } else {
              const elapsedMs = now.getTime() - startTime.getTime();
              const totalElapsedSeconds = Math.floor(elapsedMs / 1000);
              const currentBlock = Math.floor(totalElapsedSeconds / (20 * 60));
              const seatIndex = currentBlock % sequence.length;
              const currentBreakSeat = sequence[seatIndex];

              const nextBlockNumber = currentBlock + 1;
              const nextChangeTime = new Date(startTime.getTime() + (nextBlockNumber * 20 * 60 * 1000));

              updatedTable.currentBreakSeat = currentBreakSeat;
              updatedTable.nextBreakTime = nextChangeTime;
              updatedTable.status = 'trial-break';

              const remaining = getTimeRemaining(nextChangeTime);
              if (remaining && remaining.minutes >= 0 && remaining.seconds >= 0) {
                updatedTable.countdown = formatCountdown(remaining);
                updatedTable.countdownLabel = `Seat ${currentBreakSeat} Break Ends`;
              }
            }

          } else {
            // 3 Hour 15 Minutes Table Break
            const startTime = new Date(table.startTime);

            if (now < startTime) {
              updatedTable.status = 'open';
              updatedTable.nextBreakTime = startTime;

              const remaining = getTimeRemaining(startTime);
              if (remaining && remaining.hours >= 0 && remaining.minutes >= 0 && remaining.seconds >= 0) {
                updatedTable.countdown = formatCountdown(remaining);
                updatedTable.countdownLabel = 'Starts In';
              }
            } else {
              const breakInfo = getCurrentBreakInfo(table.startTime, now);

              updatedTable.status = breakInfo.status;
              updatedTable.nextBreakTime = breakInfo.nextBreakTime;

              if (breakInfo.nextBreakTime) {
                const remaining = getTimeRemaining(breakInfo.nextBreakTime);
                if (remaining && remaining.hours >= 0 && remaining.minutes >= 0 && remaining.seconds >= 0) {
                  updatedTable.countdown = formatCountdown(remaining);

                  const totalMinutesRemaining = (remaining.hours * 60) + remaining.minutes;

                  if (breakInfo.status === 'open') {
                    if (totalMinutesRemaining <= 14) {
                      updatedTable.status = 'warning-break';
                      updatedTable.countdownLabel = 'Until Break';
                    } else {
                      updatedTable.status = 'open';
                      updatedTable.countdownLabel = 'Until Break';
                    }
                  } else {
                    updatedTable.status = 'on-break';
                    updatedTable.countdownLabel = 'Break Ends';
                  }
                } else {
                  updatedTable.countdown = '';
                  updatedTable.countdownLabel = '';
                }
              }
            }
          }
          return updatedTable;
        })
      );
    };

    const interval = setInterval(updateAllCountdowns, 1000);
    updateAllCountdowns();
    return () => clearInterval(interval);
  }, []);

  const updateTable = (tableNumber, updates) => {
    setTables(prevTables => {
      const currentTable = prevTables.find(t => t.tableNumber === tableNumber);

      // unique keys for logs
      const openKey = `${tableNumber}-open-${updates.startTime?.getTime() || 'none'}`;

      const actualCloseTime = updates.closeTime || new Date();
      const closeKey = `${tableNumber}-close-${actualCloseTime.getTime()}`;

      // log open
      if (updates.startTime && !currentTable.startTime && !loggedActionsRef.current.has(openKey)) {
        loggedActionsRef.current.add(openKey);
        logTableActivity(tableNumber, 'open', {
          startTime: updates.startTime.toISOString(),
          isTrialBreak: updates.isTrialBreak || false,
          trialSeats: updates.trialSeats,
          trialStartSeat: updates.trialStartSeat
        });
      }

      // log close with custom time support
      if (updates.status === 'closed' && currentTable.status !== 'closed' && !loggedActionsRef.current.has(closeKey)) {
        loggedActionsRef.current.add(closeKey);
        
        const startTime = currentTable.startTime ? new Date(currentTable.startTime) : new Date();
        const duration = Math.round((actualCloseTime.getTime() - startTime.getTime()) / (1000 * 60));
        
        logTableActivity(tableNumber, 'close', {
          timestamp: actualCloseTime.toISOString(),
          duration: `${duration} minutes`
        });
      }

      const updatedTables = prevTables.map(table =>
        table.tableNumber === tableNumber ? { ...table, ...updates } : table
      );
      return updatedTables;
    });
  };

  const resetAllTables = () => {
    const gamingDayStr = clearCurrentGameDayStorage();
    
    // Reset tables to default state
    const resetTables = INITIAL_TABLES;
    setTables(resetTables);
    
    // Clear logged actions
    loggedActionsRef.current.clear();
    
    return gamingDayStr;
  };

    const cancelPlannedOpen = (tableNumber) => {
        setTables(prevTables => {
            const currentTable = prevTables.find(t => t.tableNumber === tableNumber);

            if (currentTable && currentTable.startTime) {
                const openKey = `${tableNumber}-open-${currentTable.startTime.getTime()}`;

                loggedActionsRef.current.delete(openKey);

                removeTableActivityLog(tableNumber, 'open', currentTable.startTime);

                const updatedTables = prevTables.map(table =>
                    table.tableNumber === tableNumber ? {
                    ...table,
                    status: 'closed',
                    startTime: null,
                    breakTime: null,
                    nextBreakTime: null,
                    countdown: '',
                    countdownLabel: '',
                    isTrialBreak: false,
                    trialSeats: null,
                    trialStartSeat: null,
                    currentBreakSeat: null
                    } : table
                );

                setRefreshHistoryTrigger(prev => prev + 1);

                return updatedTables;
            }

            return prevTables;
        });
    };

    return {
        tables,
        updateTable,
        resetAllTables,
        cancelPlannedOpen,
        refreshHistoryTrigger
    };
};