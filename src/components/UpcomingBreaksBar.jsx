import React, { useState, useEffect } from 'react';
import { getCurrentGamingDay } from '../services/gamingDayService';
import { checkBreakInInterval } from '../utils/timeHelpers';

function UpcomingBreaksBar({ historyData, tables }) {
  const [selectedTrialTable, setSelectedTrialTable] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

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

  const calculateTrialCountdown = (startTime, currentTime) => {
    const elapsedMs = currentTime - startTime;
    const elapsedTotalSeconds = Math.ceil(elapsedMs / 1000);
    
    // Trial breaks are every 20 minutes = 1200 seconds
    const cycleLength = 20 * 60; // 1200 seconds
    const secondsInCurrentCycle = elapsedTotalSeconds % cycleLength;
    const secondsUntilNext = cycleLength - secondsInCurrentCycle;
    
    const minutesUntilNext = Math.floor(secondsUntilNext / 60);
    const remainingSeconds = secondsUntilNext % 60;
    
    return {
      minutesUntilNext,
      secondsUntilNext: remainingSeconds,
      totalSecondsUntilNext: secondsUntilNext,
      isFlashing: secondsUntilNext <= 60
    };
  };

  // Get trial breaks in next intervals
  const getTrialBreakRotations = () => {
    const activeTrialTables = [];

    historyData.forEach(session => {
      if (session.breakType && session.breakType.includes('Trial') && !session.closeTime) {
        activeTrialTables.push({
          number: session.tableNumber,
          startTime: session.openTime,
          trialSeats: session.trialSeats || 9,
          trialStartSeat: session.trialStartSeat || 1,
        });
      }
    });

    if (activeTrialTables.length === 0) return [];

    const trialRotations = activeTrialTables.map(table => {
      const elapsed = Math.floor((currentTime - table.startTime) / (1000 * 60));
      const currentCycle = Math.floor(elapsed / 20);
      
      const totalSeats = table.trialSeats;
      const startSeat = table.trialStartSeat;
      const currentBreakingSeat = startSeat + (currentCycle % totalSeats);
      const nextBreakingSeat = startSeat + ((currentCycle + 1) % totalSeats);

      const countdown = calculateTrialCountdown(table.startTime, currentTime);

      return {
        tableNumber: table.number,
        currentSeat: currentBreakingSeat,
        nextSeat: nextBreakingSeat,
        minutesUntilNext: countdown.minutesUntilNext,
        secondsUntilNext: countdown.secondsUntilNext,
        totalSecondsUntilNext: countdown.totalSecondsUntilNext,
        isFlashing: countdown.isFlashing
      };
    });

    return trialRotations.sort((a, b) => parseInt(a.tableNumber) - parseInt(b.tableNumber));
  };

  const intervals = getNext3Intervals();
  const trialRotations = getTrialBreakRotations();

  useEffect(() => {
    if (trialRotations.length > 0 && !selectedTrialTable) {
      setSelectedTrialTable(trialRotations[0].tableNumber);
    }
  }, [trialRotations, selectedTrialTable]);

  const selectedRotation = trialRotations.find(r => r.tableNumber === selectedTrialTable);

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
          {trialRotations.length > 0 && (
            <div className="flex items-center space-x-4">
              
              {/* Table Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-300 text-sm font-semibold">Trial:</span>
                <select
                  value={selectedTrialTable || ''}
                  onChange={(e) => setSelectedTrialTable(e.target.value)}
                  className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                >
                  {trialRotations.map(rotation => (
                    <option key={rotation.tableNumber} value={rotation.tableNumber}>
                      Table {rotation.tableNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trial Break Display with Flashing Background */}
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

                  {/* Arrow */}
                  <span className="text-white text-sm">→</span>

                  {/* Next Break Info */}
                  <div className="flex items-center space-x-1">
                    <span className="text-white text-xs font-medium">Next:</span>
                    <span className="text-white text-sm font-bold">
                      Seat {selectedRotation.nextSeat}
                    </span>
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex items-center space-x-1 ml-2 pl-2 border-l border-white/30">
                    <span className="text-white text-xs font-medium">in</span>
                    <span className='text-lg font-bold text-white'>
                      {selectedRotation.minutesUntilNext}:
                      {selectedRotation.secondsUntilNext.toString().padStart(2, '0')}
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