import { useState } from "react";
import { formatTime, roundToNearestQuarter } from "../utils/timeHelpers";

function CustomTimePicker({ onSelectTime, onCancel }) {
    const [selectedHour, setSelectedHour] = useState(12);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [selectedPeriod, setSelectedPeriod] = useState('PM');
    const [selectedDay, setSelectedDay] = useState('today');

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);

    const minutes = [0, 15, 30, 45];

    const handleConfirm = () => {
        const now = new Date();
        let hour = selectedHour;

        if (selectedPeriod === 'PM' && hour !== 12) hour += 12;
        if (selectedPeriod === 'AM' && hour !== 12) hour = 0;

        let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, selectedMinute, 0, 0);

        if (selectedDay === 'yesterday') {
            targetDate.setDate(targetDate.getDate() - 1);
        }

        const roundedTime = roundToNearestQuarter(targetDate);

        onSelectTime(roundedTime);
    };

    const previewTime = new Date();
    let previewHour = selectedPeriod === 'PM' && selectedHour !== 12 ? selectedHour + 12:
                    selectedPeriod === 'AM' && selectedHour === 12 ? 0 :
                    selectedHour;

    previewTime.setHours(previewHour, selectedMinute, 0, 0);

    if (selectedDay === 'yesterday') {
        previewTime.setDate(previewTime.getDate() - 1);
    }

    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-sm mb-2">Custom Time:</h3>

            <div className="text-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{formatTime(previewTime)}</span>
                <div className="text-xs text-gray-500 mt-1">
                    {selectedDay === 'today' ? 'Today' : 'Yesterday'}
                </div>
            </div>

            <div className="flex space-x-2">
                <select
                    value={selectedDay}
                    onChange={e => setSelectedDay(e.target.value)}
                    className="w-full p-1 border rounded text-sm"
                >
                    <option value="today">Today - {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</option>
                    <option value="yesterday">Yesterday - {new Date(Date.now() - 1000 * 60 * 60 * 24).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit' })}</option>
                </select>
            </div>

            <div className="flex space-x-2">
                <select
                    value={selectedHour}
                    onChange={e => setSelectedHour(parseInt(e.target.value))}
                    className="flex-1 p-1 border rounded text-sm"
                >
                    {hours.map(hour => (
                        <option key={hour} value={hour}>{hour}</option>
                    ))}
                </select>

                <select
                    value={selectedMinute}
                    onChange={e => setSelectedMinute(parseInt(e.target.value))}
                    className="flex-1 p-1 border rounded text-sm"
                >
                    {minutes.map(minute => (
                        <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                    ))}
                </select>

                <select
                    value={selectedPeriod}
                    onChange={e => setSelectedPeriod(e.target.value)}
                    className="flex-1 p-1 border rounded text-sm"
                >   
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
            </div>

            <div className="space-y-2">
                <button
                    onClick={handleConfirm}
                    className="w-full py-2 px-3 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Confirm Time
                </button>
                <button
                    onClick={onCancel}
                    className="w-full py-1 px-3 text-sm bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
};

export default CustomTimePicker;