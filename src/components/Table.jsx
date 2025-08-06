import { useState, useEffect } from 'react';
import PopupMenu from './PopupMenu';

import greenTableSvg from '../assets/table_green.svg';
import orangeTableSvg from '../assets/table_orange.svg';
import greyTableSvg from '../assets/table_grey.svg';
import { formatCountdown, getTimeRemaining } from '../utils/timeHelpers';

function Table({ tableNumber, status, tableData, rotation = 90, isPopupOpen, onOpenPopup, onClosePopup, onUpdateTable }) {
    const [countdown, setCountdown] = useState("00:00");
    const [countdownLabel, setCountdownLabel] = useState("");

    useEffect(() => {
        const updateCountdown = () => {
            if (status === 'open' && tableData.nextBreakTime) {
                const remaining = getTimeRemaining(tableData.nextBreakTime);
                setCountdown(formatCountdown(remaining));
                setCountdownLabel('Until Break');
            } else if (status === 'on-break' && tableData.nextBreakTime) {
                const remaining = getTimeRemaining(tableData.nextBreakTime);

                if (remaining <= 0) {
                    const newBreakTime = new Date(Date.now() + 1000 * 60 * 60 * 3);
                    onUpdateTable(tableNumber, {
                        status: 'open',
                        nextBreakTime: newBreakTime
                    });
                    return;
                }

                setCountdown(formatCountdown(remaining));
                setCountdownLabel('Break Ends');
            } else {
                setCountdown('');
                setCountdownLabel('');
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [status, tableData.nextBreakTime, tableNumber, onUpdateTable]);

    const getTableSvg = (status) => {
        switch(status) {
            case 'open': return greenTableSvg;
            case 'on-break': return orangeTableSvg;
            default: return greyTableSvg;
        }
    };

    const tableSvg = getTableSvg(status);

    return (
        <div 
            className='relative w-40 h-40 cursor-pointer'
            onClick={() => onOpenPopup(tableNumber)}
        >
            <img 
                src={tableSvg}
                alt={`Table ${tableNumber}`}
                className='w-full h-full relative z-10'
                style={{ transform: `rotate(${rotation}deg)` }}
            />
            <div
                className='absolute inset-0 flex flex-col items-center justify-center z-20'
            >
                <div className='bg-black bg-opacity-40 rounded-lg px-3 py-2 text-center'>
                    <span className='text-sm font-bold text-white mb-1 block'>
                    {tableNumber}
                </span>

                <span className='text-xs font-medium text-gray-300 uppercase tracking-wide block'>
                    {status.replace('-', ' ')}
                </span>

                {countdown && (
                    <div className='text-center mt-1'>
                        <div className='text-xs text-gray-300'>
                            {countdownLabel}
                        </div>
                        <div className='text-xs font-semibold text-white'>
                            {countdown}
                        </div>
                    </div>
                )}
                </div>
            </div>
            
            <PopupMenu
                isOpen={isPopupOpen}
                onClose={onClosePopup}
                tableNumber={tableNumber}
                status={status}
                tableData={tableData}
                onUpdateTable={onUpdateTable}
            />
        </div>
    );
}

export default Table;