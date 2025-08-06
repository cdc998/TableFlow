import { useState } from "react";
import TimeSelector from "./TimeSelector";
import { addTimeInIntervals, formatTime, getNextBreakTime, roundToNearestQuarter } from "../utils/timeHelpers";

function PopupMenu({ isOpen, onClose, tableNumber, status, tableData, onUpdateTable }) {
    if (!isOpen) return null;

    const [showTimeSelector, setShowTimeSelector] = useState(false);

    const popupStyle = {
        position: 'absolute',
        bottom: '80%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '10px'
    };

    {/* Helper functions for status updates */}
    const handleSetToClosed = () => {
        onUpdateTable(tableNumber, {
            status: 'closed',
            startTime: null,
            breakTime: null,
            nextBreakTime: null
        });
        onClose();
    };

    const handleOpenTable = selectedTime => {
        const currentTime = roundToNearestQuarter(new Date());
        const selectedDateTime = new Date(selectedTime);

        const timeDiff = currentTime.getTime() - selectedDateTime.getTime();
        const hoursElapsed = timeDiff / (1000 * 60 * 60);

        if (hoursElapsed >= 3) {
            const breakStartTime = addTimeInIntervals(selectedDateTime, 3, 0);
            const breakEndTime = addTimeInIntervals(breakStartTime, 0, 15);

            onUpdateTable(tableNumber, {
                status: 'on-break',
                startTime: selectedTime,
                breakTime: breakStartTime,
                nextBreakTime: breakEndTime
            });
        } else {
            const nextBreakTime = getNextBreakTime(selectedTime);

            onUpdateTable(tableNumber, {
                status: 'open',
                startTime: selectedTime,
                breakTime: null,
                nextBreakTime: nextBreakTime
            });
        }

        setShowTimeSelector(false);
        onClose();
    };

    if (showTimeSelector) {
        return (
            <div style={popupStyle} className="z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg w-64" onClick={(e) => e.stopPropagation()}>
                    <TimeSelector
                        onSelectTime={(time) => {
                            handleOpenTable(time);
                        }}
                        onCancel={() => setShowTimeSelector(false)}
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
                    <p className="mb-1 text-sm">Current status: <span className="font-semibold">{status}</span></p>

                    {tableData.startTime && (
                        <p className="text-xs text-gray-600">
                            Started: {formatTime(new Date(tableData.startTime))}
                        </p>
                    )}

                    {tableData.nextBreakTime && status === 'open' && (
                        <p className="text-xs text-gray-600">
                            Next break: {formatTime(new Date(tableData.nextBreakTime))}
                        </p>
                    )}

                    {tableData.breakTime && status === 'on-break' && (
                        <p className="text-xs text-gray-600">
                            Break ends: {formatTime(new Date(tableData.nextBreakTime))}
                        </p>
                    )}
                </div>

                {/* Action buttons */}
                <div className="mt-3 space-y-2">
                    <button 
                        className="w-full py-1 px-3 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        onClick={() => setShowTimeSelector(true)}
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