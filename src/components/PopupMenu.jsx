import { useState } from "react";
import TimeSelector from "./TimeSelector";
import TrialBreakSelector from "./TrialBreakSelector";
import TrialBreakTimePicker from "./TrialBreakTimePicker";
import { formatTime } from "../utils/timeHelpers";
import { isValidCloseTime } from "../services/gamingDayService";

function PopupMenu({ isOpen, onClose, tableNumber, status, tableData, onUpdateTable, onCancelPlannedOpen }) {
    if (!isOpen) return null;

    const [showTimeSelector, setShowTimeSelector] = useState(false);
    const [showBreakTypeChoice, setShowBreakTypeChoice] = useState(false);
    const [showTrialBreakSelector, setShowTrialBreakSelector] = useState(false);
    const [showTrialTimePicker, setShowTrialTimePicker] = useState(false);
    const [selectedTrialSettings, setSelectedTrialSettings] = useState(null);
    const [showCloseTypeChoice, setShowCloseTypeChoice] = useState(false);
    const [showCustomCloseTimeSelector, setShowCustomCloseTimeSelector] = useState(false);

    const getPopupStyle = () => {
        const style = {
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50
        };

        const tableElement = document.getElementById(`table-${tableNumber}`);
        if (!tableElement) {
            style.bottom = '80%';
            style.marginBottom = '10px';
            return style;
        }
        
        const tableRect = tableElement.getBoundingClientRect();
        const popupHeight = 280;
        const viewportHeight = window.innerHeight;
        
        // Check if there's enough space above the table
        if (tableRect.top > popupHeight + 20) {
            // Position above the table (original behavior)
            style.bottom = '80%';
            style.marginBottom = '10px';
        } else {
            // Not enough space above, position below the table
            style.top = '80%';
            style.marginTop = '10px';
        }
        
        return style;
    };

    const isPlannedForFuture = () => {
        if (!tableData.startTime) return false;
        const now = new Date();
        const startTime = new Date(tableData.startTime);
        return startTime > now;
    };
    
    const handleOpenTable = selectedTime => {
        const selectedDateTime = new Date(selectedTime);

        const tableUpdate = {
            startTime: selectedDateTime,
            breakTime: null,
            nextBreakTime: null
        };

        if (!selectedTrialSettings) {
            tableUpdate.status = 'open';
            tableUpdate.isTrialBreak = false;
        } else {
            tableUpdate.status = 'trial-break';
            tableUpdate.isTrialBreak = true;
            tableUpdate.trialSeats = selectedTrialSettings.totalSeats;
            tableUpdate.trialStartSeat = selectedTrialSettings.startingSeat;
        }

        onUpdateTable(tableNumber, tableUpdate);
        
        // Reset states
        setShowTimeSelector(false);
        setShowTrialTimePicker(false);
        setSelectedTrialSettings(null);
        onClose();
    };

    const handleSetToClosed = () => {
        onUpdateTable(tableNumber, {
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
        });
        onClose();
    };

    const handleCloseNow = () => {
        const now = new Date();

        if (isPlannedForFuture()) {
            const startTime = new Date(tableData.startTime);
            const confirmed = confirm(
                `This table is scheduled to open at ${formatTime(startTime)}. \n\n` +
                `Clicking "Close Now" will cancel this planned opening. \n\n` +
                `Are you sure you want to cancel the planned opening?`
            );

            if (!confirmed) return;

            onCancelPlannedOpen(tableNumber);
            onClose();
            return;
        }

        onUpdateTable(tableNumber, {
            status: 'closed',
            startTime: null,
            breakTime: null,
            nextBreakTime: null,
            countdown: '',
            countdownLabel: '',
            isTrialBreak: false,
            trialSeats: null,
            trialStartSeat: null,
            currentBreakSeat: null,
            closeTime: new Date()
        });
        onClose();
    };

    const handleCustomCloseTime = (selectedTime) => {
        const openTime = tableData.startTime ? new Date(tableData.startTime) : null;
        const validation = isValidCloseTime(selectedTime, openTime);

        if (!validation.valid) {
            alert(validation.reason);
            return;
        }

        if (isPlannedForFuture()) {
            alert('Cannot set custom close time for tables scheduled to open in the future. Use "Close Now" to cancel the planned opening instead.')
            return;
        }

        onUpdateTable(tableNumber, {
            status: 'closed',
            startTime: null,
            breakTime: null,
            nextBreakTime: null,
            countdown: '',
            countdownLabel: '',
            isTrialBreak: false,
            trialSeats: null,
            trialStartSeat: null,
            currentBreakSeat: null,
            closeTime: selectedTime
        });

        setShowCustomCloseTimeSelector(false);
        setShowCloseTypeChoice(false);
        onClose();
    };

    // Break type choice screen
    if (showBreakTypeChoice) {
        return (
            <div style={getPopupStyle()} className="z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg w-64" onClick={(e) => e.stopPropagation()}>
                    <h3 className="font-semibold text-sm mb-3">Choose Break System:</h3>
                    
                    <div className="space-y-2">
                        <button
                            onClick={() => {
                                setShowBreakTypeChoice(false);
                                setShowTimeSelector(true);
                            }}
                            className="w-full py-2 px-3 text-sm bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center"
                        >
                            <span>Table Break</span>
                            <span className="text-xs ml-2">(15 min whole table)</span>
                        </button>
                        
                        <button
                            onClick={() => {
                                setShowBreakTypeChoice(false);
                                setShowTrialBreakSelector(true);
                            }}
                            className="w-full py-2 px-3 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                        >
                            <span>Trial Break</span>
                            <span className="text-xs ml-2">(20 min per seat)</span>
                        </button>
                        
                        <button
                            onClick={() => setShowBreakTypeChoice(false)}
                            className="w-full py-1 px-3 text-sm bg-gray-400 text-white rounded hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Trial break selector
    if (showTrialBreakSelector) {
        return (
            <div style={getPopupStyle()} className="z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg w-80" onClick={(e) => e.stopPropagation()}>
                    <TrialBreakSelector
                        onSelect={(settings) => {
                            setSelectedTrialSettings(settings);
                            setShowTrialBreakSelector(false);
                            setShowTrialTimePicker(true);
                        }}
                        onCancel={() => setShowTrialBreakSelector(false)}
                    />
                </div>
            </div>
        );
    }

    // Trial break time picker (only :00, :20, :40)
    if (showTrialTimePicker) {
        return (
            <div style={getPopupStyle()} className="z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg w-80" onClick={(e) => e.stopPropagation()}>
                    <TrialBreakTimePicker
                        onSelectTime={(time) => {
                            handleOpenTable(time);
                        }}
                        onCancel={() => {
                            setShowTrialTimePicker(false);
                            setSelectedTrialSettings(null);
                        }}
                    />
                </div>
            </div>
        );
    }

    if (showTimeSelector) {
        return (
            <div style={getPopupStyle()} className="z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg w-64" onClick={(e) => e.stopPropagation()}>
                    <TimeSelector
                        onSelectTime={(time) => {
                            handleOpenTable(time);
                        }}
                        onCancel={() => {
                            setShowTimeSelector(false);
                            setSelectedTrialSettings(null);
                        }}
                    />
                </div>
            </div>
        )
    }

    // Close type choice
    if (showCloseTypeChoice) {
        const isPlanned = isPlannedForFuture();

        return (
            <div style={getPopupStyle()} className="z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg w-64" onClick={(e) => e.stopPropagation()}>
                    <h3 className="font-semibold text-sm mb-3">
                        {isPlanned ? 'Cancel Planned Opening?' : 'Choose Close Time:'}
                    </h3>

                    {isPlanned && (
                        <div className="mb-3 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                            ⚠️ Table scheduled to open at {formatTime(new Date(tableData.startTime))}
                        </div>
                    )}

                    <div className="space-y-2">
                        <button
                            onClick={handleCloseNow}
                            className={`w-full py-2 px-3 text-sm text-white rounded flex items-center justify-center ${
                                isPlanned
                                    ? 'bg-orange-500 hover:bg-orange-600'
                                    : 'bg-red-500 hover:bg-red-600'
                            }`}
                        >
                            <span>{isPlanned ? 'Cancel Planned Opening' : 'Close Now'}</span>
                            {!isPlanned && (
                                <span className="text-xs ml-2">({new Date().toLocaleTimeString()})</span>
                            )}
                        </button>

                        {!isPlanned && (
                            <button
                                onClick={() => {
                                    setShowCloseTypeChoice(false);
                                    setShowCustomCloseTimeSelector(true);
                                }}
                                className="w-full py-2 px-3 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                            >
                                Custom Close Time
                            </button>
                        )}

                        <button
                            onClick={() => setShowCloseTypeChoice(false)}
                            className="w-full py-1 px-3 text-sm bg-gray-400 text-white rounded hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Custom close time selector
    if (showCustomCloseTimeSelector && !isPlannedForFuture()) {
        return (
            <div style={getPopupStyle()} className="z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg w-64" onClick={(e) => e.stopPropagation()}> 
                    <div className="mb-3">
                        <h3 className="font-semibold text-sm mb-1">Close Table {tableNumber}</h3>
                        {tableData.startTime && (
                            <p className="text-xs text-gray-600">
                                Opened: {formatTime(new Date(tableData.startTime))}
                            </p>
                        )}
                    </div>

                    <TimeSelector 
                        onSelectTime={handleCustomCloseTime}
                        onCancel={() => {
                            setShowCustomCloseTimeSelector(false);
                            setShowCloseTypeChoice(true);
                        }}
                        maxTime={new Date(new Date().getTime() + 1000 * 60 * 60 * 24)}
                        minTime={tableData.startTime ? new Date(tableData.startTime) : null}
                    />
                </div>
            </div>
        )
    }

    return (
        <div style={getPopupStyle()} className="z-50">
            <div
                className="bg-white p-4 rounded-lg shadow-lg w-64"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-bold">Table {tableNumber}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                {/* Status Display */}
                <div className="mb-3">
                    <p className="mb-1 text-sm">
                        Status: <span className="font-semibold capitalize">{status.replace('-', ' ')}</span>
                    </p>

                    {tableData.isTrialBreak && (
                        <p className="text-xs text-blue-600 font-medium">
                            Trial Break Mode ({tableData.trialSeats} seats, start: {tableData.trialStartSeat})
                        </p>
                    )}

                    {tableData.currentBreakSeat && (
                        <p className="text-xs text-orange-600 font-medium">
                            Seat {tableData.currentBreakSeat} on break
                        </p>
                    )}

                    {tableData.startTime && (
                        <p className="text-xs text-gray-600">
                            {isPlannedForFuture() ? 'Scheduled: ' : 'Started '}
                            {formatTime(new Date(tableData.startTime))}
                        </p>
                    )}

                    {tableData.nextBreakTime && (
                        <p className="text-xs text-gray-600">
                            Next change: {formatTime(new Date(tableData.nextBreakTime))}
                        </p>
                    )}
                </div>

                {/* Action buttons */}
                <div className="mt-3 space-y-2">
                    {status === 'closed' && (
                        <button 
                            className="w-full py-2 px-3 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                            onClick={() => setShowBreakTypeChoice(true)}
                        >
                            Set to Open
                        </button>
                    )}

                    {status !== 'closed' && (
                        <button
                            className={`w-full py-1 px-3 text-sm text-white rounded ${
                                isPlannedForFuture()
                                    ? 'bg-orange-500 hover:bg-orange-600'
                                    : 'bg-gray-500 hover:bg-gray-600'
                            }`}
                            onClick={() => setShowCloseTypeChoice(true)}
                        >
                            {isPlannedForFuture() ? 'Cancel/Close' : 'Set to Closed'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PopupMenu;