import { useState, useEffect } from 'react';
import PopupMenu from './PopupMenu';

import greenTableSvg from '../assets/table_green.svg';
import orangeTableSvg from '../assets/table_orange.svg';
import greyTableSvg from '../assets/table_grey.svg';
import { formatCountdown, getTimeRemaining } from '../utils/timeHelpers';

function Table({ tableNumber, status, tableData, rotation = 90, isPopupOpen, onOpenPopup, onClosePopup, onUpdateTable }) {
    const getTableSvg = (status) => {
        switch(status) {
            case 'open': return greenTableSvg;
            case 'on-break': return orangeTableSvg;
            default: return greyTableSvg;
        }
    };

    const tableSvg = getTableSvg(status);

    const isLargerTable = tableData.position?.isFinalTable;
    const tableSize = isLargerTable ? 'w-52 h-40' : 'w-40 h-40';

    return (
        <div 
            className={`relative ${tableSize} cursor-pointer`}
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

                {tableData.countdown && (
                    <div className='text-center mt-1'>
                        <div className='text-xs text-gray-300'>
                            {tableData.countdownLabel}
                        </div>
                        <div className='text-xs font-semibold text-white'>
                            {tableData.countdown}
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