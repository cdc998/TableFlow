import { useState, useEffect } from 'react';
import Table from './components/Table';
import { addTimeInIntervals, formatCountdown, generateSequence, getBreakEndTime, getCurrentBreakInfo, getNextBreakTime, getNextFutureBreakTime, getTimeRemaining, roundToNearestQuarter, shouldBeOnBreak } from './utils/timeHelpers';

function App() {
  {/* States */}
  const [tables, setTables] = useState([
    // Column 1 (left to right, top to bottom)
    { tableNumber: "3330", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 1, row: 1 } },
    { tableNumber: "3328", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 1, row: 2 } },
    { tableNumber: "3326", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 1, row: 3 } },
    { tableNumber: "3324", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 1, row: 4 }, rotation: 315 },
    { tableNumber: "3322", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 1, row: 5 }, rotation: 45 },
    { tableNumber: "3320", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 1, row: 6 } },
    
    // Column 2
    { tableNumber: "3329", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 2, row: 1 } },
    { tableNumber: "3327", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 2, row: 2 } },
    { tableNumber: "3325", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 2, row: 3 } },
    { tableNumber: "3323", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 2, row: 4 }, rotation: 45 },
    { tableNumber: "3321", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 2, row: 5 }, rotation: 315 },
    { tableNumber: "3319", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 2, row: 6 } },
    
    // Column 3
    { tableNumber: "3314", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 3, row: 1 } },
    { tableNumber: "3316", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 3, row: 2 } },
    { tableNumber: "3317", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 3, row: 3 } },
    { tableNumber: "3318", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 3, row: 4 } },
    { tableNumber: "3333", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 3, row: 5, isFinalTable: true }, rotation: 180 }, // Final table
    { tableNumber: "3336", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 3, row: 6 }, rotation: 315 },
    
    // Column 4
    { tableNumber: "3313", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 4, row: 1 } },
    { tableNumber: "3315", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 4, row: 2 } },
    { tableNumber: "3331", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 4, row: 3 } },
    { tableNumber: "3332", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 4, row: 4 } },
    { tableNumber: "3335", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 4, row: 6 }, rotation: 45 },
    
    // Column 5
    { tableNumber: "3312", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 5, row: 1 } },
    { tableNumber: "3310", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 5, row: 2 } },
    { tableNumber: "3308", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 5, row: 3 } },
    { tableNumber: "3306", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 5, row: 4 }, rotation: 315 },
    { tableNumber: "3304", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 5, row: 5 }, rotation: 45 },
    { tableNumber: "3302", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 5, row: 6 } },
    
    // Column 6
    { tableNumber: "3311", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 6, row: 1 } },
    { tableNumber: "3309", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 6, row: 2 } },
    { tableNumber: "3307", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 6, row: 3 } },
    { tableNumber: "3305", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 6, row: 4 }, rotation: 45 },
    { tableNumber: "3303", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 6, row: 5 }, rotation: 315 },
    { tableNumber: "3301", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 6, row: 6 } }
  ]);

  const [activePopupTable, setActivePopupTable] = useState(null);

  const updateTable = (tableNumber, updates) => {
    setTables(prevTables =>
      prevTables.map(table =>
        table.tableNumber === tableNumber ? { ...table, ...updates } : table
      )
    );
  };

  useEffect(() => {
    const updateAllCountdowns = () => {
      const now = new Date();
      const roundedNow = roundToNearestQuarter(now);

      setTables(prevTables =>
        prevTables.map(table => {
          if (table.status === 'closed' || !table.startTime) return table;

          let updatedTable = { ...table };

          // Trial Break
          if (table.isTrialBreak) {
            const sequence = generateSequence(table.trialSeats || 9, table.trialStartSeat || 9);
            const startTime = new Date(table.startTime);

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
          } else {
            // 3 Hour 15 Minutes Table Break
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

  {/* Popup Menu Logics*/}

  const handleOpenPopup = tableNumber => {
    setActivePopupTable(tableNumber);
  };

  const handleClosePopup = () => {
    setActivePopupTable(null);
  };

  return (
    <div className="min-h-screen bg-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          TableFlow - Poker Table Break Tracker
        </h1>

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
