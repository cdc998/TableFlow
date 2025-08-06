import { useState, useEffect } from 'react';
import Table from './components/Table';
import { addTimeInIntervals, getNextBreakTime, roundToNearestQuarter, shouldBeOnBreak } from './utils/timeHelpers';

function App() {
  {/* States */}
    const [tables, setTables] = useState([
    // Column 1 (left to right, top to bottom)
    { tableNumber: "3330", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 1, row: 1 } },
    { tableNumber: "3328", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 1, row: 2 } },
    { tableNumber: "3326", status: "on-break", startTime: null, breakTime: null, nextBreakTime: new Date(Date.now() + 10 * 60 * 1000), position: { col: 1, row: 3 } },
    { tableNumber: "3324", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 1, row: 4 }, rotation: 315 },
    { tableNumber: "3322", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 1, row: 5 }, rotation: 45 },
    { tableNumber: "3320", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 1, row: 6 } },
    
    // Column 2
    { tableNumber: "3329", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 2, row: 1 } },
    { tableNumber: "3327", status: "on-break", startTime: null, breakTime: null, nextBreakTime: new Date(Date.now() + 5 * 60 * 1000), position: { col: 2, row: 2 } },
    { tableNumber: "3325", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 2, row: 3 } },
    { tableNumber: "3323", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 2, row: 4 }, rotation: 45 },
    { tableNumber: "3321", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 2, row: 5 }, rotation: 315 },
    { tableNumber: "3319", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 2, row: 6 } },
    
    // Column 3
    { tableNumber: "3314", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 3, row: 1 } },
    { tableNumber: "3316", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 3, row: 2 } },
    { tableNumber: "3317", status: "on-break", startTime: null, breakTime: null, nextBreakTime: new Date(Date.now() + 8 * 60 * 1000), position: { col: 3, row: 3 } },
    { tableNumber: "3318", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 3, row: 4 } },
    { tableNumber: "3333", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 3, row: 5, isFinalTable: true } }, // Final table
    { tableNumber: "3336", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 3, row: 6 }, rotation: 315 },
    
    // Column 4
    { tableNumber: "3313", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 4, row: 1 } },
    { tableNumber: "3315", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 4, row: 2 } },
    { tableNumber: "3331", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 4, row: 3 } },
    { tableNumber: "3332", status: "on-break", startTime: null, breakTime: null, nextBreakTime: new Date(Date.now() + 12 * 60 * 1000), position: { col: 4, row: 4 } },
    // Note: Row 5 is shared with column 3 final table
    { tableNumber: "3335", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 4, row: 6 }, rotation: 45 },
    
    // Column 5
    { tableNumber: "3312", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 5, row: 1 } },
    { tableNumber: "3310", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 5, row: 2 } },
    { tableNumber: "3308", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 5, row: 3 } },
    { tableNumber: "3306", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 5, row: 4 }, rotation: 315 },
    { tableNumber: "3304", status: "on-break", startTime: null, breakTime: null, nextBreakTime: new Date(Date.now() + 6 * 60 * 1000), position: { col: 5, row: 5 }, rotation: 45 },
    { tableNumber: "3302", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 5, row: 6 } },
    
    // Column 6
    { tableNumber: "3311", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 6, row: 1 } },
    { tableNumber: "3309", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 6, row: 2 } },
    { tableNumber: "3307", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 6, row: 3 } },
    { tableNumber: "3305", status: "closed", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 6, row: 4 }, rotation: 45 },
    { tableNumber: "3303", status: "open", startTime: null, breakTime: null, nextBreakTime: null, position: { col: 6, row: 5 }, rotation: 315 },
    { tableNumber: "3301", status: "on-break", startTime: null, breakTime: null, nextBreakTime: new Date(Date.now() + 15 * 60 * 1000), position: { col: 6, row: 6 } }
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
    const checkBreakTimes = () => {
      const now = roundToNearestQuarter(new Date());

      tables.forEach(table => {
        if (!table.startTime) return;

        const shouldBreak = shouldBeOnBreak(table.startTime, now);

        if (shouldBreak && table.status === 'open') {
          const breakStartTime = roundToNearestQuarter(now);
          const breakEndTime = addTimeInIntervals(breakStartTime, 0, 15);

          updateTable(table.tableNumber, {
            status: 'on-break',
            breakTime: breakStartTime,
            nextBreakTime: breakEndTime
          });
        }

        if (!shouldBreak && table.status === 'on-break') {
          const nextBreakTime = getNextBreakTime(table.startTime);

          updateTable(table.tableNumber, {
            status: 'open',
            breakTime: null,
            nextBreakTime: nextBreakTime
          });
        }
      });
    };

    const interval = setInterval(checkBreakTimes, 60000);

    return () => clearInterval(interval);
  }, [tables, updateTable]);

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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          TableFlow - Poker Table Break Tracker
        </h1>

        {/* Simple Grid Layout */}
        <div className="grid grid-cols-6 gap-4">
          {tables.map(table => (
            <div 
              key={table.tableNumber}
              className={table.position.isFinalTable ? 'col-span-2' : ''}
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
