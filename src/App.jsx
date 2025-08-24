import { useState } from 'react';

// Hooks
import { useTableData } from './hooks/useTableData';
import { useGameLog } from './hooks/useGameLog';

// Services
import { exportTimelineExcel, exportBackupLogs } from './services/exportService';

// Components
import TopMenuBar from './components/TopMenuBar';
import TableGrid from './components/TableGrid';
import HistoryScreen from './components/HistoryScreen';
import ResetConfirmModal from './components/ResetConfirmModal';

function App() {
  // states
  const [currentScreen, setCurrentScreen] = useState('tables');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { tables, updateTable, resetAllTables } = useTableData();
  const { historyData, deleteSession } = useGameLog(tables);

  // Event handlers
  const handleExport = () => {
    exportTimelineExcel(historyData, tables);
  };
  
  const handleBackupExport = () => {
    exportBackupLogs();
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
        onReset={() => setShowResetConfirm(true)}
      />

      <div className='p-8'>
        {currentScreen === 'tables' ? (
          <TableGrid tables={tables} onUpdateTable={updateTable}/>
        ) : (
          <HistoryScreen historyData={historyData} onDeleteSession={deleteSession}/>
        )}
      </div>
    </div>
  );
}

export default App;