import { useState } from "react";
import TimeSelector from "./TimeSelector";
import TrialBreakSelector from "./TrialBreakSelector";
import TrialBreakTimePicker from "./TrialBreakTimePicker";
import { addTimeInIntervals, formatTime, getNextBreakTime, getNextFutureBreakTime, roundToNearestQuarter } from "../utils/timeHelpers";

function PopupMenu({ isOpen, onClose, tableNumber, status, tableData, onUpdateTable }) {
    if (!isOpen) return null;

    const [showTimeSelector, setShowTimeSelector] = useState(false);
    const [showBreakTypeChoice, setShowBreakTypeChoice] = useState(false);
    const [showTrialBreakSelector, setShowTrialBreakSelector] = useState(false);
    const [showTrialTimePicker, setShowTrialTimePicker] = useState(false);
    const [selectedTrialSettings, setSelectedTrialSettings] = useState(null);

    const popupStyle = {
        position: 'absolute',
        bottom: '80%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '10px'
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

    const handleOpenTable = selectedTime => {
        const currentTime = roundToNearestQuarter(new Date());
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

    // Break type choice screen
    if (showBreakTypeChoice) {
        return (
            <div style={popupStyle} className="z-50">
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
            <div style={popupStyle} className="z-50">
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
            <div style={popupStyle} className="z-50">
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
            <div style={popupStyle} className="z-50">
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

    return (
        <div style={popupStyle} className="z-50">
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
                            Started: {formatTime(new Date(tableData.startTime))}
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
                    <button 
                        className="w-full py-2 px-3 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        onClick={() => setShowBreakTypeChoice(true)}
                    >
                        Set to Open
                    </button>

                    <button
                        className="w-full py-1 px-3 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                        onClick={handleSetToClosed}
                    >
                        Set to Closed
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PopupMenu;