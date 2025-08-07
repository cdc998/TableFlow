import { useState, useEffect } from 'react';
import Table from './components/Table';
import { addTimeInIntervals, formatCountdown, getBreakEndTime, getNextBreakTime, getNextFutureBreakTime, getTimeRemaining, roundToNearestQuarter, shouldBeOnBreak } from './utils/timeHelpers';

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

          const shouldBreak = shouldBeOnBreak(table.startTime, roundedNow);

          let updatedTable = { ...table };

          if (table.nextBreakTime) {
            const remaining = getTimeRemaining(table.nextBreakTime);
            if (remaining && remaining.hours >= 0 && remaining.minutes >= 0 && remaining.seconds >= 0) {
              updatedTable.countdown = formatCountdown(remaining);
              updatedTable.countdownLabel = table.status === 'open' ? 'Until Break' : 'Break Ends';
            } else {
              updatedTable.countdown = '';
              updatedTable.countdownLabel = '';
            }
          } else {
            updatedTable.countdown = '';
            updatedTable.countdownLabel = '';
          }

          if (shouldBreak && table.status === 'open') {
            const breakStartTime = roundToNearestQuarter(roundedNow);
            const breakEndTime = addTimeInIntervals(breakStartTime, 0, 15);
            return {
              ...updatedTable,
              status: 'on-break',
              breakTime: null,
              nextBreakTime: breakEndTime
            };
          }

          if (table.status === 'on-break' && table.nextBreakTime && table.nextBreakTime <= now) {
            const nextBreakTime = getNextFutureBreakTime(table.startTime, now);
            return {
              ...updatedTable,
              status: 'open',
              breakTime: null,
              nextBreakTime: nextBreakTime
            };
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
