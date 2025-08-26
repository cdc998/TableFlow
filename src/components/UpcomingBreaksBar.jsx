import React, { useState, useEffect } from 'react';
import { checkBreakInInterval } from '../utils/timeHelpers';

function UpcomingBreaksBar({ historyData, tables }) {
  const [selectedTrialTable, setSelectedTrialTable] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // Get next 3 quarter-hour intervals
  const getNext3Intervals = () => {
    const now = new Date();
    const intervals = [];
    
    // Always start from the NEXT quarter hour
    const nextQuarter = new Date(now);
    const minutes = nextQuarter.getMinutes();
    const nextQuarterMinutes = Math.ceil((minutes + 1) / 15) * 15; // +1 ensures we always get the next one
    nextQuarter.setMinutes(nextQuarterMinutes, 0, 0);
    
    // If we've rolled over to next hour, handle it
    if (nextQuarterMinutes >= 60) {
      nextQuarter.setHours(nextQuarter.getHours() + 1);
      nextQuarter.setMinutes(nextQuarterMinutes - 60, 0, 0);
    }
    
    // Get next 3 intervals
    for (let i = 0; i < 3; i++) {
      const interval = new Date(nextQuarter.getTime() + (i * 15 * 60 * 1000));
      intervals.push(interval);
    }
    
    return intervals;
  };

  // Get tables going on break at specific interval
  const getTablesOnBreak = (intervalTime) => {
    const intervalEnd = new Date(intervalTime.getTime() + (15 * 60 * 1000));
    const tablesOnBreak = [];

    // Group sessions by table (exclude trial breaks)
    const tableSessionsMap = {};
    historyData.forEach(session => {
      if (session.breakType && session.breakType.includes('Trial')) return;
      
      if (!tableSessionsMap[session.tableNumber]) {
        tableSessionsMap[session.tableNumber] = [];
      }
      tableSessionsMap[session.tableNumber].push(session);
    });

    // Check each table for breaks
    Object.keys(tableSessionsMap).forEach(tableNumber => {
      const sessions = tableSessionsMap[tableNumber];
      
      // Find active session
      const activeSession = sessions.find(session => {
        const openTime = session.openTime;
        const closeTime = session.closeTime || new Date(2099, 0, 1); // Far future if still open
        return openTime < intervalEnd && closeTime > intervalTime;
      });

      if (activeSession) {
        const mockTable = {
          startTime: activeSession.openTime,
          isTrialBreak: false
        };

        if (checkBreakInInterval(mockTable, intervalTime, intervalEnd)) {
          tablesOnBreak.push(tableNumber);
        }
      }
    });

    return tablesOnBreak.sort((a, b) => parseInt(a) - parseInt(b));
  };

  // Get trial breaks in next intervals
  const getActiveTrialTables = () => {
    // Find active trial sessions from history data
    const activeTrialSessions = historyData.filter(session => 
      session.breakType && 
      session.breakType.includes('Trial') && 
      !session.closeTime
    );

    // Find trial tables from tables array to get configuration
    const trialTablesMap = tables.reduce((acc, table) => {
      if (table.status === 'trial-break') {
        acc[table.tableNumber] = table;
      }
      return acc;
    }, {});

    const trialTables = activeTrialSessions.map(session => {
      // Get table configuration from tables array
      const tableInfo = trialTablesMap[session.tableNumber];

      // Get starting seat from table configuration
      // Default to seat 9 as starting seat if not found
      const startingSeat = tableInfo?.trialStartSeat || 9;
      const totalSeats = parseInt(session.breakType.match(/\((\d+) seats\)/)?.[1]) || 9;
      
      // Calculate elapsed time in seconds
      const elapsedMs = currentTime - new Date(session.openTime);
      const elapsedSeconds = Math.ceil(elapsedMs / 1000);
      
      // Trial breaks are every 20 minutes = 1200 seconds
      const cycleLength = 20 * 60; // 1200 seconds
      const currentCycle = Math.floor(elapsedSeconds / cycleLength);
      const secondsInCurrentCycle = elapsedSeconds % cycleLength;
      
      // Calculate remaining time properly
      const secondsUntilNext = cycleLength - secondsInCurrentCycle;
      const minutesUntilNext = Math.floor(secondsUntilNext / 60);
      const remainingSeconds = secondsUntilNext % 60;
      
      // Generate seat order based on starting seat
      let seatOrder = [];
      
      // For a 9-seat table, generate the correct rotation
      // If startingSeat is 9, then: [9, D, 1, 2, 3, 4, 5, 6, 7, 8]
      if (startingSeat === 9) {
        seatOrder = ['9', 'D', '1', '2', '3', '4', '5', '6', '7', '8'];
      } else {
        // Generate dynamic seat order for other starting seats
        // Add all seats from startingSeat to 9
        for (let i = startingSeat; i <= totalSeats; i++) {
          seatOrder.push(i.toString());
        }
        
        // Add dealer
        seatOrder.push('D');
        
        // Add seats from 1 to startingSeat-1
        for (let i = 1; i < startingSeat; i++) {
          seatOrder.push(i.toString());
        }
      }
      
      const totalPositions = seatOrder.length; // Should be 10 for a 9-seat table
      const currentPosition = currentCycle % totalPositions;
      const nextPosition = (currentPosition + 1) % totalPositions;
      
      // Get current and next seat from the seat order array
      const currentBreakingSeat = seatOrder[currentPosition];
      const nextBreakingSeat = seatOrder[nextPosition];
      
      const countdownStr = `${minutesUntilNext}:${remainingSeconds.toString().padStart(2, '0')}`;
      
      return {
        tableNumber: session.tableNumber,
        currentSeat: currentBreakingSeat,
        nextSeat: nextBreakingSeat,
        countdown: countdownStr,
        minutesUntilNext,
        secondsUntilNext: remainingSeconds,
        isFlashing: secondsUntilNext <= 60
      };
    });

    return trialTables.sort((a, b) => parseInt(a.tableNumber) - parseInt(b.tableNumber));
  };

  const intervals = getNext3Intervals();
  const activeTrialTables = getActiveTrialTables();

  useEffect(() => {
    if (activeTrialTables.length > 0 && !selectedTrialTable) {
      setSelectedTrialTable(activeTrialTables[0].tableNumber);
    } else if (activeTrialTables.length === 0) {
      setSelectedTrialTable(null);
    }
  }, [activeTrialTables, selectedTrialTable]);

  const selectedRotation = activeTrialTables.find(t => t.tableNumber === selectedTrialTable);

  return (
    <div className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-2">
        <div className="flex items-center justify-between">
          
          {/* LEFT: Regular Table Breaks */}
          <div className="flex items-center space-x-6">
            <span className="text-gray-300 text-sm font-semibold min-w-[130px]">
              Upcoming Breaks:
            </span>
            <div className="flex space-x-6">
              {intervals.map((interval, index) => {
                const tablesOnBreak = getTablesOnBreak(interval);
                const timeStr = interval.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: false 
                });

                return (
                  <div key={index} className="flex items-center">
                    <span className="text-white text-sm font-medium mr-2 min-w-[50px]">
                      {timeStr}:
                    </span>
                    {tablesOnBreak.length > 0 ? (
                      <div className="flex space-x-1">
                        {tablesOnBreak.map(tableNum => (
                          <span 
                            key={tableNum}
                            className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold"
                          >
                            {tableNum}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">None</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Trial Break Selection & Countdown */}
          {activeTrialTables.length > 0 && (
            <div className="flex items-center space-x-4">
              
              {/* Table Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-300 text-sm font-semibold">Trial:</span>
                <select
                  value={selectedTrialTable || ''}
                  onChange={(e) => setSelectedTrialTable(e.target.value)}
                  className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                >
                  {activeTrialTables.map(table => (
                    <option key={table.tableNumber} value={table.tableNumber}>
                      Table {table.tableNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trial Break Display using calculated nextSeat */}
              {selectedRotation && (
                <div 
                  className={`flex items-center space-x-3 px-4 py-0.5 rounded transition-all duration-300 ${
                    selectedRotation.isFlashing 
                      ? 'bg-yellow-500 animate-pulse' 
                      : 'bg-blue-600'
                  }`}
                >
                  {/* Current Breaking Seat */}
                  <div className="flex items-center space-x-1">
                    <span className="text-white text-xs font-medium">Now:</span>
                    <span className="text-white text-sm font-bold">
                      Seat {selectedRotation.currentSeat}
                    </span>
                  </div>

                  {/* Next Break Info */}
                  <span className="text-white text-sm">→</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-white text-xs font-medium">Next:</span>
                    <span className="text-white text-sm font-bold">
                      Seat {selectedRotation.nextSeat}
                    </span>
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex items-center space-x-1 ml-2 pl-2 border-l border-white/30">
                    <span className="text-white text-xs font-medium">in</span>
                    <span className={`text-lg font-bold ${
                      selectedRotation.isFlashing ? 'text-red-800' : 'text-white'
                    }`}>
                      {selectedRotation.countdown}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UpcomingBreaksBar;