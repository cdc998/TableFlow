import { getCurrentGamingDay } from './gamingDayService';
import { checkBreakInInterval } from '../utils/timeHelpers';

export const downloadFile = (content, filename, contentType) => {
  const blob = new Blob([content], { type: contentType + ';charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateTableColors = (count) => {
  const colors = [];
  const hueStep = 360 / count;
  
  for (let i = 0; i < count; i++) {
    const hue = Math.round(i * hueStep);
    const color = `hsl(${hue}, 40%, 85%)`;
    colors.push(color);
  }
  
  return colors;
};

export const createExcelHTML = (data, gamingDayStr, tableColors) => {
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <meta name="ProgId" content="Excel.Sheet">
        <meta name="Generator" content="TableFlow">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>TableFlow Timeline</x:Name>
                <x:WorksheetSource HRef=""/>
                <x:Panes>
                  <x:Pane>
                    <x:Number>3</x:Number>
                    <x:ActiveRow>1</x:ActiveRow>
                    <x:ActiveCol>1</x:ActiveCol>
                    <x:RangeSelection>B2</x:RangeSelection>
                  </x:Pane>
                </x:Panes>
                <x:ProtectObjects>False</x:ProtectObjects>
                <x:ProtectScenarios>False</x:ProtectScenarios>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
            <x:WindowHeight>10005</x:WindowHeight>
            <x:WindowWidth>10005</x:WindowWidth>
            <x:WindowTopX>120</x:WindowTopX>
            <x:WindowTopY>135</x:WindowTopY>
            <x:ProtectStructure>False</x:ProtectStructure>
            <x:ProtectWindows>False</x:ProtectWindows>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { 
            border-collapse: collapse; 
            font-family: Arial, sans-serif; 
            width: 100%;
          }
          
          th, td { 
            border: 1px solid #000; 
            padding: 2px 4px; 
            text-align: center; 
            font-size: 9px;
            width: 60px;
            height: 20px;
          }
          
          th { 
            background-color: #4472C4; 
            color: white; 
            font-weight: bold; 
            font-size: 8px;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          
          .table-header {
            background-color: #70AD47 !important;
            color: white !important;
            font-weight: bold !important;
            font-size: 10px !important;
            width: 80px !important;
            position: sticky;
            left: 0;
            z-index: 20;
          }
          
          .table-header th {
            background-color: #70AD47 !important;
            position: sticky;
            left: 0;
            top: 0;
            z-index: 30;
          }
          
          .closed { 
            background-color: #000000 !important; 
            color: #000000 !important;
          }
          
          .open { 
            background-color: #00B050 !important; 
            color: white !important;
            font-weight: bold;
          }
          
          .break { 
            background-color: #FF0000 !important; 
            color: white !important;
            font-weight: bold;
          }
          
          .freeze-column {
            position: sticky;
            left: 0;
            z-index: 5;
            border-right: 2px solid #000;
          }
        </style>
      </head>
      <body>
        <table>`;

  // Add header row
  let headerRow = '<tr>';
  data[0].forEach((header, index) => {
    if (index === 0) {
      headerRow += `<th class="table-header freeze-column">${header}</th>`;
    } else {
      headerRow += `<th>${header}</th>`;
    }
  });
  headerRow += '</tr>';
  
  // Add data rows
  let dataRows = '';
  data.slice(1).forEach((row, rowIndex) => {
    const tableColor = tableColors[rowIndex % tableColors.length];
    dataRows += '<tr>';
    
    row.forEach((cell, cellIndex) => {
      if (cellIndex === 0) {
        dataRows += `<td class="freeze-column" style="background-color: ${tableColor}; font-weight: bold; color: #000; border-right: 2px solid #000;">${cell}</td>`;
      } else {
        let cellClass = '';
        let cellContent = '';
        let cellStyle = `background-color: ${tableColor};`;
        
        if (cell === 'CLOSED') {
          cellClass = 'closed';
          cellContent = '●';
          cellStyle = 'background-color: #000000; color: #000000;';
        } else if (cell === 'BREAK') {
          cellClass = 'break';
          cellContent = 'X';
          cellStyle = 'background-color: #FF0000; color: white; font-weight: bold;';
        } else if (cell === 'OPEN') {
          cellClass = 'open';
          cellContent = 'O';
          cellStyle = 'background-color: #00B050; color: white; font-weight: bold;';
        } else {
          cellContent = cell;
        }
        
        dataRows += `<td class="${cellClass}" style="${cellStyle}">${cellContent}</td>`;
      }
    });
    dataRows += '</tr>';
  });

  return htmlContent + headerRow + dataRows + `
        </table>
      </body>
    </html>`;
};

export const exportTimelineExcel = (historyData, tables) => {
  const gamingDay = getCurrentGamingDay();
  const gamingDayStr = `${gamingDay.getFullYear()}-${String(gamingDay.getMonth() + 1).padStart(2, '0')}-${String(gamingDay.getDate()).padStart(2, '0')}`;

  // Generate time intervals
  const gamingDayStart = new Date(gamingDay);
  gamingDayStart.setHours(12, 0, 0, 0);

  const timeIntervals = [];
  const intervalHeaders = ['Table'];

  for (let i = 0; i < 64; i++) {
    const intervalTime = new Date(gamingDayStart.getTime() + (i * 1000 * 60 * 15));
    const timeStr = intervalTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    timeIntervals.push(intervalTime);
    intervalHeaders.push(timeStr);
  }

  const regularSessions = historyData.filter(session => session.breakType === 'Regular');

  if (regularSessions.length === 0) {
    const htmlContent = createExcelHTML([intervalHeaders], gamingDayStr, []);
    downloadFile(htmlContent, `TableFlow_Timeline_${gamingDayStr}.xls`, 'application/vnd.ms-excel');
    alert(`No tables opened during gaming day ${gamingDayStr}`);
    return;
  }

  // Group sessions by table number and sort
  const tableSessionsMap = {};
  regularSessions.forEach(session => {
    if (!tableSessionsMap[session.tableNumber]) {
      tableSessionsMap[session.tableNumber] = [];
    }
    tableSessionsMap[session.tableNumber].push(session);
  });

  const sortedTables = Object.keys(tableSessionsMap).sort((a, b) => parseInt(a) - parseInt(b));

  // Create data for Excel
  const excelData = [intervalHeaders];
  const tableColors = generateTableColors(sortedTables.length);

  sortedTables.forEach((tableNumber) => {
    const sessions = tableSessionsMap[tableNumber];
    const row = [tableNumber];

    timeIntervals.forEach(intervalTime => {
      const intervalEnd = new Date(intervalTime.getTime() + (1000 * 60 * 15));
      const activeSession = sessions.find(session => {
        const openTime = session.openTime;
        const closeTime = session.closeTime || new Date();

        return openTime <= intervalEnd && closeTime > intervalTime;
      });

      if (!activeSession) {
        row.push('CLOSED');
      } else {
        const mockTable = {
          startTime: activeSession.openTime,
          isTrialBreak: false
        };

        const hadBreakInInterval = checkBreakInInterval(mockTable, intervalTime, intervalEnd);

        if (hadBreakInInterval) {
          row.push('BREAK');
        } else {
          row.push('OPEN');
        }
      }
    });

    excelData.push(row);
  });

  // Create and download Excel file
  const htmlContent = createExcelHTML(excelData, gamingDayStr, tableColors);
  downloadFile(htmlContent, `TableFlow_Timeline_${gamingDayStr}.xls`, 'application/vnd.ms-excel');
  alert(`Exported ${sortedTables.length} table(s) timeline for gaming day ${gamingDayStr}`);
};

export const exportBackupLogs = () => {
  const gamingDay = getCurrentGamingDay();
  const gamingDayStr = `${gamingDay.getFullYear()}-${String(gamingDay.getMonth() + 1).padStart(2, '0')}-${String(gamingDay.getDate()).padStart(2, '0')}`;
  
  const logKey = `tableflow-logs-${gamingDayStr}`;
  const logs = JSON.parse(localStorage.getItem(logKey) || '[]');

  if (logs.length === 0) {
    alert(`No activity logs found for gaming day ${gamingDayStr}`);
    return;
  }

  const backupContent = [
    `TableFlow Activity Logs - Gaming Day: ${gamingDayStr}`,
    `Generated: ${new Date().toISOString()}`,
    `Total Entries: ${logs.length}`,
    '',
    '='.repeat(60),
    ''
  ];

  logs.forEach(log => {
    backupContent.push(`[${log.timestamp}] Table ${log.table} - ${log.action.toUpperCase()}`);

    if (log.startTime) {
      backupContent.push(`   Start Time: ${new Date(log.startTime).toLocaleString()}`);
    }
    if (log.duration) {
      backupContent.push(`   Duration: ${log.duration}`);
    }
    if (log.isTrialBreak) {
      backupContent.push(`   Type: Trial Break (${log.trialSeats} seats, start: ${log.trialStartSeat})`);
    }
    backupContent.push('');
  });

  downloadFile(backupContent.join('\n'), `TableFlow_BackupLogs_${gamingDayStr}.txt`, 'text/plain');
  alert(`Exported ${logs.length} activity logs for gaming day ${gamingDayStr}`);
};