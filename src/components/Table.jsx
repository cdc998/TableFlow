import { useState } from 'react';
import PopupMenu from './PopupMenu';

import greenTableSvg from '../assets/table_green.svg';
import orangeTableSvg from '../assets/table_orange.svg';
import greyTableSvg from '../assets/table_grey.svg';

function Table({ tableNumber, status }) {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const getTableSvg = (status) => {
        switch(status) {
            case 'open': return greenTableSvg;
            case 'on-break': return orangeTableSvg;
            default: return greyTableSvg;
        }
    };

    const tableSvg = getTableSvg(status);

    const tableData = {
        tableNumber: tableNumber,
        status: status,
        startTime: null,
        breakTime: null,
        nextBreakTime: null
    };

    return (
        <div 
            className='relative w-96 h-96 cursor-pointer'
            onClick={() => setIsPopupOpen(true)}
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
            </div>
            
            <PopupMenu
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                tableNumber={tableNumber}
                status={status}
            />
        </div>
    );
}

export default Table;