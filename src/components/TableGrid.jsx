import { useState } from 'react';
import Table from './Table';

function TableGrid({ tables, onUpdateTable, onCancelPlannedOpen }) {
  const [activePopupTable, setActivePopupTable] = useState(null);

  const handleOpenPopup = (tableNumber) => {
    setActivePopupTable(tableNumber);
  };

  const handleClosePopup = () => {
    setActivePopupTable(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-6 gap-4">
        {tables.map(table => (
          <div 
            key={table.tableNumber}
            className={table.position.isFinalTable ? 'col-span-2 px-20' : ''}
            style={{
              gridColumn: table.position.col,
              gridRow: table.position.row
            }}
          >
            <Table
              tableNumber={table.tableNumber}
              status={table.status}
              tableData={table}
              rotation={table.rotation || 90}
              isPopupOpen={activePopupTable === table.tableNumber}
              onOpenPopup={handleOpenPopup}
              onClosePopup={handleClosePopup}
              onUpdateTable={onUpdateTable}
              onCancelPlannedOpen={onCancelPlannedOpen}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TableGrid;