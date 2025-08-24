import { useState, useEffect} from 'react';
import Table from './components/Table';
import { formatCountdown, generateSequence, getCurrentBreakInfo, getTimeRemaining } from './utils/timeHelpers';

function App() {
  // Version check
  const STORAGE_VERSION = 'v1';

  // localstorage + loading tables on load
  const saveTablesState = (tables) => {
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
  const loadTablesState = () => {
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
  const getDefaultTableProperties = () => ({
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
  const getInitialTables = () => {
    const savedTables = loadTablesState();
    if (savedTables && savedTables.length > 0) {
      return savedTables;
    }

    return [
      // Column 1 (left to right, top to bottom)
      { tableNumber: "3330", ...getDefaultTableProperties(), position: { col: 1, row: 1 } },
      { tableNumber: "3328", ...getDefaultTableProperties(), position: { col: 1, row: 2 } },
      { tableNumber: "3326", ...getDefaultTableProperties(), position: { col: 1, row: 3 } },
      { tableNumber: "3324", ...getDefaultTableProperties(), position: { col: 1, row: 4 }, rotation: 315 },
      { tableNumber: "3322", ...getDefaultTableProperties(), position: { col: 1, row: 5 }, rotation: 45 },
      { tableNumber: "3320", ...getDefaultTableProperties(), position: { col: 1, row: 6 } },
      
      // Column 2
      { tableNumber: "3329", ...getDefaultTableProperties(), position: { col: 2, row: 1 } },
      { tableNumber: "3327", ...getDefaultTableProperties(), position: { col: 2, row: 2 } },
      { tableNumber: "3325", ...getDefaultTableProperties(), position: { col: 2, row: 3 } },
      { tableNumber: "3323", ...getDefaultTableProperties(), position: { col: 2, row: 4 }, rotation: 45 },
      { tableNumber: "3321", ...getDefaultTableProperties(), position: { col: 2, row: 5 }, rotation: 315 },
      { tableNumber: "3319", ...getDefaultTableProperties(), position: { col: 2, row: 6 } },
      
      // Column 3
      { tableNumber: "3314", ...getDefaultTableProperties(), position: { col: 3, row: 1 } },
      { tableNumber: "3316", ...getDefaultTableProperties(), position: { col: 3, row: 2 } },
      { tableNumber: "3317", ...getDefaultTableProperties(), position: { col: 3, row: 3 } },
      { tableNumber: "3318", ...getDefaultTableProperties(), position: { col: 3, row: 4 } },
      { tableNumber: "3333", ...getDefaultTableProperties(), position: { col: 3, row: 5, isFinalTable: true }, rotation: 180 }, // Final table
      { tableNumber: "3336", ...getDefaultTableProperties(), position: { col: 3, row: 6 }, rotation: 315 },
      
      // Column 4
      { tableNumber: "3313", ...getDefaultTableProperties(), position: { col: 4, row: 1 } },
      { tableNumber: "3315", ...getDefaultTableProperties(), position: { col: 4, row: 2 } },
      { tableNumber: "3331", ...getDefaultTableProperties(), position: { col: 4, row: 3 } },
      { tableNumber: "3332", ...getDefaultTableProperties(), position: { col: 4, row: 4 } },
      { tableNumber: "3335", ...getDefaultTableProperties(), position: { col: 4, row: 6 }, rotation: 45 },
      
      // Column 5
      { tableNumber: "3312", ...getDefaultTableProperties(), position: { col: 5, row: 1 } },
      { tableNumber: "3310", ...getDefaultTableProperties(), position: { col: 5, row: 2 } },
      { tableNumber: "3308", ...getDefaultTableProperties(), position: { col: 5, row: 3 } },
      { tableNumber: "3306", ...getDefaultTableProperties(), position: { col: 5, row: 4 }, rotation: 315 },
      { tableNumber: "3304", ...getDefaultTableProperties(), position: { col: 5, row: 5 }, rotation: 45 },
      { tableNumber: "3302", ...getDefaultTableProperties(), position: { col: 5, row: 6 } },
      
      // Column 6
      { tableNumber: "3311", ...getDefaultTableProperties(), position: { col: 6, row: 1 } },
      { tableNumber: "3309", ...getDefaultTableProperties(), position: { col: 6, row: 2 } },
      { tableNumber: "3307", ...getDefaultTableProperties(), position: { col: 6, row: 3 } },
      { tableNumber: "3305", ...getDefaultTableProperties(), position: { col: 6, row: 4 }, rotation: 45 },
      { tableNumber: "3303", ...getDefaultTableProperties(), position: { col: 6, row: 5 }, rotation: 315 },
      { tableNumber: "3301", ...getDefaultTableProperties(), position: { col: 6, row: 6 } }
    ];
  }

  // states
  const [currentScreen, setCurrentScreen] = useState('tables');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const [tables, setTables] = useState(getInitialTables);
  const [activePopupTable, setActivePopupTable] = useState(null);



  // Gaming day = 12pm to next day 4am
  const getCurrentGamingDay = () => {
    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour < 12) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }

    return now;
  };

  // logging with unique session ID
  const loggedActions = new Set();
  const logTableActivity = (tableNumber, action, details = {}) => {
    try {
      const gamingDay = getCurrentGamingDay();
      const gamingDayStr = `${gamingDay.getFullYear()}-${String(gamingDay.getMonth() + 1).padStart(2, '0')}-${String(gamingDay.getDate()).padStart(2, '0')}`;

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

  // history data for display
  const getHistoryData = () => {
    const gamingDay = getCurrentGamingDay();
    const gamingDayStr = `${gamingDay.getFullYear()}-${String(gamingDay.getMonth() + 1).padStart(2, '0')}-${String(gamingDay.getDate()).padStart(2, '0')}`;

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
  };
  const renderHistoryScreen = () => {
    const historyData = getHistoryData();
    const gamingDay = getCurrentGamingDay();

    return (
      <div className='max-w-6xl mx-auto'>
        <div className='bg-gray-900 rounded-lg p-6'>
          <h2 className='text-2xl font-bold text-white mb-6'>
            Table History - Gaming Day: {gamingDay.toLocaleDateString()}
          </h2>

          {historyData.length === 0 ? (
            <div className='text-gray-400 text-center py-8'>
              No table activity found for this gaming day.
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-white'>
                <thead>
                  <tr className='border-b border-gray-700'>
                    <th className='text-left py-3 px-4'>Table</th>
                    <th className='text-left py-3 px-4'>Status</th>
                    <th className='text-left py-3 px-4'>Break Type</th>
                    <th className='text-left py-3 px-4'>Opened At</th>
                    <th className='text-left py-3 px-4'>Closed At</th>
                    <th className='text-left py-3 px-4'>Duration</th>
                    <th className='text-left py-3 px-4'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((item, index) => (
                    <tr key={index} className='border-b border-gray-800 hover:bg-gray-800'>
                      <td className='py-3 px-4 font-semibold'>{item.tableNumber}</td>
                      <td className='py-3 px-4'>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.status === 'Open'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className='py-3 px-4 text-gray-300'>{item.breakType}</td>
                      <td className='py-3 px-4 text-gray-300'>{item.openTime.toLocaleString()}</td>
                      <td className='py-3 px-4 text-gray-300'>
                        {item.closeTime ? item.closeTime.toLocaleString() : 'Still Open'}</td>
                      <td className='py-3 px-4 text-gray-300'>
                        {item.duration ||
                          `${Math.round((new Date().getTime() - item.openTime.getTime()) / (1000 * 60))} minutes`}
                      </td>
                      <td className='py-3 px-4'>
                          {item.isCompleteSession && (
                            <button
                              onClick={() => deleteSession(item.sessionId)}
                              className='px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors'
                              title='Delete this session'
                            >
                              Delete
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // delete session function
  const deleteSession = (sessionId) => {
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      const gamingDay = getCurrentGamingDay();
      const gamingDayStr = `${gamingDay.getFullYear()}-${String(gamingDay.getMonth() + 1).padStart(2, '0')}-${String(gamingDay.getDate()).padStart(2, '0')}`;

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

      setCurrentScreen('history');
    }
  };

  // csv export
  const handleExport = () => {
    setIsDropdownOpen(false);

    const gamingDay = getCurrentGamingDay();
    const gamingDayStr = `${gamingDay.getFullYear()}-${String(gamingDay.getMonth() + 1).padStart(2, '0')}-${String(gamingDay.getDate()).padStart(2, '0')}`;

    const gamingDayStart = new Date(gamingDay);
    gamingDayStart.setHours(12, 0, 0, 0);

    const gamingDayEnd = new Date(gamingDay);
    gamingDayEnd.setDate(gamingDayEnd.getDate() + 1);
    gamingDayEnd.setHours(4, 0, 0, 0);

    const timeIntervals = [];
    const intervalHeaders = ['Table'];

    for (let i = 0; i < 64; i++) {
      const intervalTime = new Date(gamingDayStart.getTime() + (i * 1000 * 60 * 15));
      const timeStr = intervalTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      timeIntervals.push(intervalTime);
      intervalHeaders.push(timeStr);
    }

    const historyData = getHistoryData();
    const regularSessions = historyData.filter(session => session.breakType === 'Regular');

    if (regularSessions.length === 0) {
      const csvContent = [intervalHeaders].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `TableFlow_Timeline_${gamingDayStr}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`No tables opened during gaming day ${gamingDayStr}`);
      return;
    }

    // group sessions by table number
    const tableSessionsMap = {};
    regularSessions.forEach(session => {
      if (!tableSessionsMap[session.tableNumber]) {
        tableSessionsMap[session.tableNumber] = [];
      }
      tableSessionsMap[session.tableNumber].push(session);
    });

    const csvData = [intervalHeaders];

    Object.entries(tableSessionsMap).forEach(([tableNumber, sessions]) => {
      const row = [tableNumber];

      timeIntervals.forEach(intervalTime => {
        const intervalEnd = new Date(intervalTime.getTime() + (1000 * 60 * 15));
        const activeSession = sessions.find(session => {
          const openTime = session.openTime;
          const closeTime = session.closeTime || new Date();
  
          return openTime <= intervalEnd && closeTime > intervalTime;
        });
  
        if (!activeSession) {
          row.push('■');
        } else {
          const mockTable = {
            startTime: activeSession.openTime,
            isTrialBreak: false
          };
  
          const hadBreakInInterval = checkBreakInInterval(mockTable, intervalTime, intervalEnd);
  
          if (hadBreakInInterval) {
            row.push('X');
          } else {
            row.push('O');
          }
        }
      });

      csvData.push(row);
    });

    const csvContent = csvData.map(row =>
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `TableFlow_Timeline_${gamingDayStr}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`Exported ${Object.keys(tableSessionsMap).length} table(s) timeline for gaming day ${gamingDayStr}`);
  };
  const checkBreakInInterval = (table, intervalStart, intervalEnd) => {
    if (table.isTrialBreak) {
      return false;
    }

    if (!table.startTime) return false;

    const startTime = new Date(table.startTime);

    if (intervalEnd <= startTime) return false;

    const tableStartMs = startTime.getTime();
    const intervalStartMs = intervalStart.getTime();
    const intervalEndMs = intervalEnd.getTime();

    let breakNumber = 0;

    while (true) {
      let breakStartMs;

      if (breakNumber === 0) {
        breakStartMs = tableStartMs + (1000 * 60 * 60 * 3);
      } else {
        breakStartMs = tableStartMs + (1000 * 60 * 60 * 3) + (breakNumber * 1000 * 60 * 60 * 3.25);
      }

      const breakEndMs = breakStartMs + (1000 * 60 * 15);

      if (breakStartMs >= intervalEndMs) {
        break;
      }

      if (breakStartMs < intervalEndMs && breakEndMs > intervalStartMs) {
        return true;
      }

      breakNumber++;

      if (breakNumber > 20) break;
    }

    return false;
  };
  const exportBackupLogs = () => {
    setIsDropdownOpen(false);

    const gamingDay = getCurrentGamingDay();
    const gamingDayStr = `${gamingDay.getFullYear()}-${String(gamingDay.getMonth() + 1).padStart(2, '0')}-${String(gamingDay.getDate()).padStart(2, '0')}`;
    
    const logKey = `tableflow-logs-${gamingDayStr}`;
    const logs = JSON.parse(localStorage.getItem(logKey) || '[]');

    if (logs.length === 0) {
      alert(`No activity logs found for gaming day ${gamingDayStr}`);
      return;
    }

    const backupContent = [
      `TableFlow Activity Logs - Gaming Day: ${gamingDayStr}`,
      `Generated: ${new Date().toISOString()}`,
      `Total Entries: ${logs.length}`,
      '',
      '='.repeat(60),
      ''
    ];

    logs.forEach(log => {
      backupContent.push(`[${log.timestamp}] Table ${log.table} - ${log.action.toUpperCase()}`);

      if (log.startTime) {
        backupContent.push(`   Start Time: ${new Date(log.startTime).toLocaleString()}`);
      }
      if (log.duration) {
        backupContent.push(`   Duration: ${log.duration}`);
      }
      if (log.isTrialBreak) {
        backupContent.push(`   Type: Trial Break (${log.trialSeats} seats, start: ${log.trialStartSeat})`);
      }
      backupContent.push('');
    });

    const blob = new Blob([backupContent.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `TableFlow_BackupLogs_${gamingDayStr}.txt`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`Exported ${logs.length} activity logs for gaming day ${gamingDayStr}`);
  };

  // reflect table updates
  useEffect(() => {
    saveTablesState(tables);
  }, [tables]);
  
  // countdown
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsDropdownOpen(false);
    };

    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // update Table
  const updateTable = (tableNumber, updates) => {
    setTables(prevTables => {
      const currentTable = prevTables.find(t => t.tableNumber === tableNumber);

      // unique keys for logs
      const openKey = `${tableNumber}-open-${updates.startTime?.getTime() || 'none'}`;
      const closeKey = `${tableNumber}-close-${Date.now()}`;

      // log open
      if (updates.startTime && !currentTable.startTime && !loggedActions.has(openKey)) {
        loggedActions.add(openKey);
        logTableActivity(tableNumber, 'open', {
          startTime: updates.startTime.toISOString(),
          isTrialBreak: updates.isTrialBreak || false,
          trialSeats: updates.trialSeats,
          trialStartSeat: updates.trialStartSeat
        });
      }

      // log close
      if (updates.status === 'closed' && currentTable.status !== 'closed' && !loggedActions.has(closeKey)) {
        loggedActions.add(closeKey);
        logTableActivity(tableNumber, 'close', {
          duration: currentTable.startTime ?
            Math.round((new Date().getTime() - new Date(currentTable.startTime).getTime()) / (1000 * 60)) + ' minutes' : 'unknown'
        });
      }

      const updatedTables = prevTables.map(table =>
        table.tableNumber === tableNumber ? { ...table, ...updates } : table
      );
      return updatedTables;
    });
  };

  // reset function
  const handleResetConfirm = () => {
    const gamingDay = getCurrentGamingDay();
    const gamingDayStr = `${gamingDay.getFullYear()}-${String(gamingDay.getMonth() + 1).padStart(2, '0')}-${String(gamingDay.getDate()).padStart(2, '0')}`;

    // clear tables
    const resetTables = tables.map(table => ({
      ...table,
      ...getDefaultTableProperties()
    }));
    setTables(resetTables);

    // clear storage
    localStorage.removeItem('tableflow-tables');
    localStorage.removeItem(`tableflow-logs-${gamingDayStr}`);

    // clear logged set
    loggedActions.clear();

    setShowResetConfirm(false);

    alert(`All tables and gaming day ${gamingDayStr} logs have been cleared.`)
  };
  const clearAllTables = () => {
    setShowResetConfirm(true);
  };

  // popup props
  const handleOpenPopup = tableNumber => {
    setActivePopupTable(tableNumber);
  };

  const handleClosePopup = () => {
    setActivePopupTable(null);
  };

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-gray-900 rounded-lg p-6 max-w-md mx-4'>
            <h3 className='text-xl font-bold text-white mb-4'>Confirm Reset</h3>
            <p className='text-gray-300 mb-6'>
              This will permanently:
              <br />• Close all open tables
              <br />• Clear all table states
              <br />• Delete today's gaming day Logs
              <br /><br />
              This action cannot be undone. Are you sure?
            </p>
            <div className='flex space-x-4'>
              <button
                onClick={handleResetConfirm}
                className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium'
              >
                Yes, Reset Everything
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-medium'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top menu bar */}
      <div className='w-full bg-gray-900 border-b border-gray-700 px-6 py-3'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <div className='flex items-center space-x-6'>
            {/* Title */}
            <h1 className='text-xl font-bold text-white'>TableFlow</h1>

            {/* Navigation */}
            <nav className='flex space-x-4'>
              <button
                onClick={() => setCurrentScreen('tables')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  currentScreen === 'tables'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Tables
              </button>
              <button
                onClick={() => setCurrentScreen('history')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  currentScreen === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                History
              </button>
            </nav>
          </div>

          <div className='flex items-center space-x-4'>
            {/* Export */}
            <div className='relative'>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium transition-colors flex items-center space-x-2'
                >
                  <span>Export</span>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50'>
                    <button
                      onClick={handleExport}
                      className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-200'
                    >
                      Export CSV Timeline
                    </button>
                    <button
                      onClick={exportBackupLogs}
                      className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-200'
                    >
                      Export Backup Logs
                    </button>
                  </div>
                )}
            </div>

            {/* Reset Button */}
            <button
              onClick={clearAllTables}
              className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition-colors'
              title='Reset all tables to closed'
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main contents */}
      <div className="p-8">
        {currentScreen === 'tables' ? (
          /* Tables view */
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-6 gap-4">
              {tables.map(table => (
                <div 
                  key={table.tableNumber}
                  className={table.position.isFinalTable ? 'col-span-2 px-20' : ''}
                  style={{
                    gridColumn: table.position.col,
                    gridRow: table.position.row
                  }}
                >
                  <Table
                    tableNumber={table.tableNumber}
                    status={table.status}
                    tableData={table}
                    rotation={table.rotation || 90}
                    isPopupOpen={activePopupTable === table.tableNumber}
                    onOpenPopup={handleOpenPopup}
                    onClosePopup={handleClosePopup}
                    onUpdateTable={updateTable}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* History view */
          renderHistoryScreen()
        )}
      </div>
    </div>
  )
}

export default App
