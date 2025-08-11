import { useState } from 'react';
import { generateSequence } from '../utils/timeHelpers';

function TrialBreakSelector({ onSelect, onCancel }) {
    const [totalSeats, setTotalSeats] = useState(9);
    const [startingSeat, setStartingSeat] = useState(9);

    const handleConfirm = () => {
        onSelect({
            totalSeats,
            startingSeat
        });
    };

    return (
        <div className='space-y-4'>
            <h3 className='font-semibold text-sm mb-2'>Trial Break Setup:</h3>
            <p className='text-xs text-gray-600 mb-3'>
                Individual breaks cycling every 20 minutes (:00, :20, :40)
            </p>

            <div className='grid grid-cols-2 gap-3'>
                <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                        Total Seats:
                    </label>
                    <select
                        value={totalSeats}
                        onChange={(e) => setTotalSeats(parseInt(e.target.value))}
                        className='w-full px-2 py-1 text-sm border rounded'
                    >
                        {[7, 8, 9, 10].map(num => (
                            <option key={num} value={num}>{num} seats</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                        Start Seat:
                    </label>
                    <select
                        value={startingSeat}
                        onChange={(e) => setStartingSeat(parseInt(e.target.value))}
                        className='w-full px-2 py-1 text-sm border rounded'
                    >
                        {Array.from({length: totalSeats}, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>Seat {num}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className='text-xs text-gray-600 p-2 bg-blue-50 rounded border-l-4 border-blue-400'>
                <p className='font-medium text-blue-800'>Break sequence:</p>
                <p className='text-blue-700'>
                    {generateSequence(totalSeats, startingSeat).join(' → ')}
                </p>
                <p className='mt-1 text-blue-600'>
                    Changes at :00, :20, :40 past each hour
                </p>
            </div>

            <div className='flex space-x-2'>
                <button
                    onClick={handleConfirm}
                    className='flex-1 py-2 px-3 text-sm bg-blue-500 text-white rounded hover:bg-blue-600'
                >
                    Start Trial Break
                </button>

                <button
                    onClick={onCancel}
                    className='flex-1 py-2 px-3 text-sm bg-gray-400 text-white rounded hover:bg-gray-500'
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default TrialBreakSelector;