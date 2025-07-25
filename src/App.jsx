import { useState, useEffect } from 'react';
import Table from './components/Table';
import { addTimeInIntervals, getNextBreakTime, roundToNearestQuarter, shouldBeOnBreak } from './utils/timeHelpers';

function App() {
  {/* States */}
  const [tables, setTables] = useState([
    {
      tableNumber: "3301",
      status: "open",
      startTime: null,
      breakTime: null,
      nextBreakTime: null
    },
    {
      tableNumber: "3302", 
      status: "on-break",
      startTime: null,
      breakTime: null,
      nextBreakTime: null
    },
    {
      tableNumber: "3303",
      status: "closed",
      startTime: null,
      breakTime: null,
      nextBreakTime: null
    }
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          TableFlow - Poker Table Break Tracker
        </h1>

        {tables.map(table => (
          <Table
            key={table.tableNumber}
            tableNumber={table.tableNumber}
            status={table.status}
            tableData={table}
            isPopupOpen={activePopupTable === table.tableNumber}
            onOpenPopup={handleOpenPopup}
            onClosePopup={handleClosePopup}
            onUpdateTable={updateTable}
          />
        ))}
      </div>
    </div>
  )
}

export default App
