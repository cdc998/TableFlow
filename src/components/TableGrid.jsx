import { useState, useEffect } from 'react';
import Table from './Table';

function TableGrid({ tables, onUpdateTable, onCancelPlannedOpen }) {
  const [activePopupTable, setActivePopupTable] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOpenPopup = (tableNumber) => {
    setActivePopupTable(tableNumber);
  };

  const handleClosePopup = () => {
    setActivePopupTable(null);
  };

  const finalTable = tables.find(table => table.position.isFinalTable);
  const regularTables = tables.filter(table => !table.position.isFinalTable);
    
  const getFinalTableStyles = () => {
    const screenWidthFactor = windowWidth / 1200;
    
    // Calculate base padding with corrected min/max logic
    const basePadding = Math.min(55, Math.max(40, 45 * screenWidthFactor));

    const rotationOffset = Math.min(25, Math.max(15, 20 * screenWidthFactor));
    
    return {
      gridColumn: "3 / span 2", 
      justifySelf: "center",    
      paddingLeft: `${basePadding - rotationOffset}px`,  // Reduce left padding more
      paddingRight: `${basePadding}px`,
      maxWidth: "fit-content"
    };
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-6 gap-4">
        {/* Regular tables */}
        {regularTables.map(table => (
          <div 
            key={table.tableNumber}
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
        
        {/* Final table - positioned between columns 3 and 4 */}
        {finalTable && (
          <div 
            key={finalTable.tableNumber}
            style={getFinalTableStyles()}
          >
            <Table
              tableNumber={finalTable.tableNumber}
              status={finalTable.status}
              tableData={finalTable}
              rotation={finalTable.rotation || 90}
              isPopupOpen={activePopupTable === finalTable.tableNumber}
              onOpenPopup={handleOpenPopup}
              onClosePopup={handleClosePopup}
              onUpdateTable={onUpdateTable}
              onCancelPlannedOpen={onCancelPlannedOpen}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default TableGrid;