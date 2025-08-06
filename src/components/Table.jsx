import { useState, useEffect } from 'react';
import PopupMenu from './PopupMenu';

import greenTableSvg from '../assets/table_green.svg';
import orangeTableSvg from '../assets/table_orange.svg';
import greyTableSvg from '../assets/table_grey.svg';
import { formatCountdown, getTimeRemaining } from '../utils/timeHelpers';

function Table({ tableNumber, status, tableData, isPopupOpen, onOpenPopup, onClosePopup, onUpdateTable }) {
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
    }, [status, tableData.nextBreakTime]);

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
            className='relative w-96 h-96 cursor-pointer'
            onClick={() => onOpenPopup(tableNumber)}
        >
            <img 
                src={tableSvg}
                alt={`Table ${tableNumber}`}
                className='w-full h-full relative z-10'
            />
            <div className='absolute inset-0 flex items-center justify-center z-20'>
                <span className="text-lg font-bold text-gray-800">
                    {tableNumber}
                </span>
                {countdown && (
                    <div className='text-center'>
                        <div className='text-sm font-semibold text-gray-700'>
                            {countdown}
                        </div>
                        <div className='text-xs text-gray-600'>
                            {countdownLabel}
                        </div>
                    </div>
                )}
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