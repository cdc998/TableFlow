import { useState } from 'react';

// Hooks
import { useTableData } from './hooks/useTableData';
import { useGameLog } from './hooks/useGameLog';

// Services
import { exportTimelineExcel, exportBackupLogs, exportUpcomingBreaks } from './services/exportService';

// Components
import TopMenuBar from './components/TopMenuBar';
import TableGrid from './components/TableGrid';
import HistoryScreen from './components/HistoryScreen';
import ResetConfirmModal from './components/ResetConfirmModal';
import UpcomingBreaksBar from './components/UpcomingBreaksBar';

function App() {
  // states
  const [currentScreen, setCurrentScreen] = useState('tables');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { tables, updateTable, resetAllTables, cancelPlannedOpen, refreshHistoryTrigger } = useTableData();
  const { historyData, deleteSession } = useGameLog(tables, refreshHistoryTrigger);

  // Event handlers
  const handleExport = () => {
    exportTimelineExcel(historyData, tables);
  };
  
  const handleBackupExport = () => {
    exportBackupLogs();
  };

  const handleUpcomingBreaksExport = () => {
    exportUpcomingBreaks(historyData, tables);
  };

  const handleResetConfirm = () => {
    const gamingDayStr = resetAllTables();
    setShowResetConfirm(false);
    alert(`All tables and gaming day ${gamingDayStr} logs have been cleared.`);
  };

  return (
    <div className="min-h-screen bg-gray-800">
      <ResetConfirmModal 
        isOpen={showResetConfirm}
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
      />

      <TopMenuBar 
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        onExport={handleExport}
        onBackupExport={handleBackupExport}
        onUpcomingBreaksExport={handleUpcomingBreaksExport}
        onReset={() => setShowResetConfirm(true)}
      />

      <UpcomingBreaksBar
        historyData={historyData}
        tables={tables}
      />

      <div className='p-8'>
        {currentScreen === 'tables' ? (
          <TableGrid
            tables={tables}
            onUpdateTable={updateTable}
            onCancelPlannedOpen={cancelPlannedOpen}
          />
        ) : (
          <HistoryScreen historyData={historyData} onDeleteSession={deleteSession}/>
        )}
      </div>
    </div>
  );
}

export default App;