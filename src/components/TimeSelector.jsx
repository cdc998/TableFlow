import { useState } from "react";
import { formatTime, getPreviousIntervals } from "../utils/timeHelpers";
import CustomTimePicker from "./CustomTimePicker";

function TimeSelector({ onSelectTime, onCancel }) {
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const currentTime = new Date();
    const suggestedTimes = getPreviousIntervals(currentTime, 3);

    if (showCustomPicker) {
        return (
            <CustomTimePicker
                onSelectTime={onSelectTime}
                onCancel={() => setShowCustomPicker(false)}
            />
        )
    }

    return (
        <div className="space-y-2">
            <h3 className="font-semibold text-sm mb-2">Select start time:</h3>

            {/* Suggested times */}
            {suggestedTimes.map((time, index) => (
                <button
                    key={index}
                    onClick={() => onSelectTime(time)}
                    className="w-full py-1 px-3 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {formatTime(time)}
                </button>
            ))}

            {/* Custom time button */}
            <button
                className="w-full py-1 px-3 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
                onClick={() => setShowCustomPicker(true)}
            >
                Custom Time
            </button>

            <button
                onClick={onCancel}
                className="w-full py-1 px-3 text-sm bg-gray-400 text-white rounded hover:bg-gray-500"
            >
                Cancel
            </button>
        </div>
    )
}

export default TimeSelector;