import { useState, useEffect, startTransition } from 'react';
import Table from './components/Table';
import { formatCountdown, generateSequence, getCurrentBreakInfo, getTimeRemaining } from './utils/timeHelpers';

function App() {
  // Version check
  const STORAGE_VERSION = 'v1';

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

  // csv export
  const handleExport = () => {
    const gamingDay = getCurrentGamingDay();
    const yyyy = gamingDay.getFullYear();
    const mm = String(gamingDay.getMonth() + 1).padStart(2, '0');
    const dd = String(gamingDay.getDate()).padStart(2, '0');
    const gamingDayStr = `${yyyy}-${mm}-${dd}`;

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

    // tables from logs
    const logKey = `tableflow-logs-${gamingDayStr}`;
    const logs = JSON.parse(localStorage.getItem(logKey) || '[]');

    // build history from logs
    const tableHistory = {};
    logs.forEach(log => {
      if (!tableHistory[log.table]) {
        tableHistory[log.table] = [];
      }
      tableHistory[log.table].push(log);
    });

    // currently open tables
    tables.forEach(table => {
      if (table.startTime && !table.isTrialBreak) {
        const startTime = new Date(table.startTime);
        if (startTime >= gamingDayStart && startTime < gamingDayEnd) {
          if (!tableHistory[table.tableNumber]) {
            tableHistory[table.tableNumber] = [];
          }

          // check open log
          const hasOpenLog = tableHistory[table.tableNumber].some(log => log.action === 'open');
          if (!hasOpenLog) {
            tableHistory[table.tableNumber].push({
              table: table.tableNumber,
              action: 'open',
              startTime: table.startTime.toISOString(),
              isTrialBreak: table.isTrialBreak
            });
          }
        }
      }
    });

    const openedTables = Object.keys(tableHistory).filter(tableNumber => {
      const tableLogs = tableHistory[tableNumber];
      return tableLogs.some(log => log.action === 'open' && !log.isTrialBreak);
    });

    if (openedTables.length === 0) {
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

    const csvData = [intervalHeaders];

    openedTables.forEach(tableNumber => {
      const row = [tableNumber];
      const tableLogs = tableHistory[tableNumber];
      const openLog = tableLogs.find(log => log.action === 'open');

      if (!openLog) return;

      const tableStartTime = new Date(openLog.startTime);

      const mockTable = {
        startTime: tableStartTime,
        isTrialBreak: false
      };

      timeIntervals.forEach(intervalTime => {
        const intervalEnd = new Date(intervalTime.getTime() + (1000 * 60 * 15));

        if (intervalTime < tableStartTime) {
          row.push('■');
        } else {
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

    alert(`Exported ${openedTables.length} table(s) timeline for gaming day ${gamingDayStr}`);
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

      return false;
    }

    return false;
  };

  const logTableActivity = (tableNumber, action, details = {}) => {
    try {
      const gamingDay = getCurrentGamingDay();
      const gamingDayStr = `${gamingDay.getFullYear()}-${String(gamingDay.getMonth() + 1).padStart(2, '0')}-${String(gamingDay.getDate()).padStart(2, '0')}}`;

      const logEntry = {
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

  const exportBackupLogs = () => {
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

  // Helper for localStorage
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

  const [tables, setTables] = useState(getInitialTables);
  const [activePopupTable, setActivePopupTable] = useState(null);

  useEffect(() => {
    saveTablesState(tables);
  }, [tables]);

    // prevent duplicate logging
  const loggedActions = new Set();

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

  const clearAllTables = () => {
    const resetTables = tables.map(table => ({
      ...table,
      ...getDefaultTableProperties()
    }));
    setTables(resetTables);
  };

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

  const getTable = tableNumber => {
    return tables.find(table => table.tableNumber === tableNumber);
  };

  {/* Popup Menu Logics */}
  const handleOpenPopup = tableNumber => {
    setActivePopupTable(tableNumber);
  };

  const handleClosePopup = () => {
    setActivePopupTable(null);
  };

  return (
    <div className="min-h-screen bg-gray-800 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Export Controls */}
        <div className='mb-6 flex gap-4'>
          <button
            onClick={handleExport}
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
          >
            Export CSV Timeline
          </button>
          <button
            onClick={exportBackupLogs}
            className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
          >
            Export Backup Logs
          </button>
        </div>

        {/* Simple Grid Layout */}
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
    </div>
  )
}

export default App
