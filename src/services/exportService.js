import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { getCurrentGamingDay, getGamingDayString } from './gamingDayService';
import { checkBreakInInterval } from '../utils/timeHelpers';

const TABLE_COLORS = {
  '3301': { bg: 'E3F2FD', border: '1976D2' }, // Light Blue
  '3302': { bg: 'FFF3E0', border: 'F57C00' }, // Light Orange
  '3303': { bg: 'E8F5E8', border: '388E3C' }, // Light Green
  '3304': { bg: 'FCE4EC', border: 'E91E63' }, // Light Pink
  '3305': { bg: 'F1F8E9', border: '689F38' }, // Light Lime
  '3306': { bg: 'E0F2F1', border: '00796B' }, // Light Teal
  '3307': { bg: 'F9FBE7', border: 'AFB42B' }, // Light Yellow-Green
  '3308': { bg: 'FEF7E0', border: 'FFA000' }, // Light Amber
  '3309': { bg: 'F3E5F5', border: '7B1FA2' }, // Light Purple
  '3310': { bg: 'E8EAF6', border: '3F51B5' }, // Light Indigo
  '3311': { bg: 'E3F2FD', border: '2196F3' }, // Light Blue (different shade)
  '3312': { bg: 'E0F7FA', border: '00BCD4' }, // Light Cyan
  '3313': { bg: 'E4F3E7', border: '4CAF50' }, // Light Green (different)
  '3314': { bg: 'FEF9C3', border: 'CDDC39' }, // Light Lime (different)
  '3315': { bg: 'FEFEFE', border: '9E9E9E' }, // Light Grey
  '3316': { bg: 'F8BBD9', border: 'E91E63' }, // Light Pink (different)
  '3317': { bg: 'E1F5FE', border: '03A9F4' }, // Light Sky Blue
  '3318': { bg: 'E8F5E8', border: '66BB6A' }, // Light Green (another shade)
  '3319': { bg: 'FFF3E0', border: 'FF9800' }, // Light Deep Orange
  '3320': { bg: 'F3E5F5', border: '9C27B0' }, // Light Purple (different)
  '3321': { bg: 'E0F2F1', border: '26A69A' }, // Light Teal (different)
  '3322': { bg: 'FCE4EC', border: 'F06292' }, // Light Pink (another)
  '3323': { bg: 'E8F5E8', border: '81C784' }, // Light Green (another)
  '3324': { bg: 'F1F8E9', border: '8BC34A' }, // Light Light Green
  '3325': { bg: 'FEF7E0', border: 'FFB74D' }, // Light Amber (different)
  '3326': { bg: 'E3F2FD', border: '42A5F5' }, // Light Blue (another)
  '3327': { bg: 'F9FBE7', border: 'C0CA33' }, // Light Lime (another)
  '3328': { bg: 'FEF9C3', border: 'D4E157' }, // Light Lime Yellow
  '3329': { bg: 'E0F7FA', border: '26C6DA' }, // Light Cyan (different)
  '3330': { bg: 'F3E5F5', border: 'BA68C8' }, // Light Purple (another)
  '3331': { bg: 'E8EAF6', border: '5C6BC0' }, // Light Indigo (different)
  '3332': { bg: 'E4F3E7', border: '66BB6A' }, // Light Green (repeat)
  '3333': { bg: 'FFD54F', border: 'FF8F00' }, // Gold (Final Table)
  '3335': { bg: 'EDE7F6', border: '673AB7' }, // Light Deep Purple
  '3336': { bg: 'E8F5E8', border: '4CAF50' }  // Light Green (final)
};

const getTableColor = (tableNumber) => {
  return TABLE_COLORS[tableNumber] || { bg: 'F5F5F5', border: '757575' };
};

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

export const exportTimelineExcel = (historyData, tables) => {
  try {
    const gamingDay = getCurrentGamingDay();
    const timeIntervals = [];

    // Generate 15-minute intervals from 12pm to 4am
    const start = new Date(gamingDay);
    start.setHours(12, 0, 0, 0);
    const end = new Date(gamingDay);
    end.setDate(end.getDate() + 1);
    end.setHours(4, 0, 0, 0);

    let current = new Date(start);
    while (current < end) {
      timeIntervals.push(new Date(current));
      current.setMinutes(current.getMinutes() + 15);
    }

    // Create header row
    const headerRow = ['Table', ...timeIntervals.map(time => 
      time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      })
    )];

    // Group sessions by table
    const tableSessionsMap = {};
    historyData.forEach(session => {
      if (!tableSessionsMap[session.tableNumber]) {
        tableSessionsMap[session.tableNumber] = [];
      }
      tableSessionsMap[session.tableNumber].push(session);
    });

    const activeTables = Object.keys(tableSessionsMap).sort((a, b) => parseInt(a) - parseInt(b));

    if (activeTables.length === 0) {
      alert('No tables have been opened yet today. Nothing to export.');
      return;
    }

    const excelData = [headerRow];

    // Build data rows
    activeTables.forEach((tableNumber) => {
      const sessions = tableSessionsMap[tableNumber] || [];
      const row = [tableNumber];

      timeIntervals.forEach(intervalTime => {
        const intervalEnd = new Date(intervalTime.getTime() + (1000 * 60 * 15));
        const activeSession = sessions.find(session => {
          const openTime = session.openTime;
          const closeTime = session.closeTime || new Date();
          return openTime <= intervalEnd && closeTime > intervalTime;
        });

        if (!activeSession) {
          row.push(''); // Empty for closed
        } else {
          const mockTable = {
            startTime: activeSession.openTime,
            isTrialBreak: false
          };

          const hadBreakInInterval = checkBreakInInterval(mockTable, intervalTime, intervalEnd);

          if (hadBreakInInterval) {
            row.push('X'); // X for break
          } else {
            row.push('●'); // Dot for open
          }
        }
      });

      excelData.push(row);
    });

    // ✅ Create ExcelJS workbook with proper styling
    const wb = new ExcelJS.Workbook();
    wb.creator = 'TableFlow System';
    wb.created = new Date();
    wb.title = 'Table Timeline';

    const ws = wb.addWorksheet('Table Timeline', {
      views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
      properties: { defaultRowHeight: 25 },
      pageSetup: { 
        margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      }
    });

    // ✅ Set column widths
    ws.columns = [
      { width: 12 },
      ...timeIntervals.map(() => ({ width: 10 }))
    ];

    // ✅ Add data with styling
    excelData.forEach((row, rIdx) => {
      const excelRow = ws.addRow(row);
      excelRow.alignment = { vertical: 'middle', horizontal: 'center' };

      row.forEach((cellValue, cIdx) => {
        const cell = excelRow.getCell(cIdx + 1);

        if (rIdx === 0) {
          // ✅ Header row styling
          cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
          cell.fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: 'FF1F2937' } 
          };
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            bottom: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'medium', color: { argb: 'FF000000' } },
            right: { style: 'medium', color: { argb: 'FF000000' } }
          };
          cell.alignment = { 
            vertical: 'middle', 
            horizontal: 'center',
            wrapText: false
          };
        } else {
          // ✅ Data rows
          const tableNumber = String(excelData[rIdx][0]);
          const tableColor = getTableColor(tableNumber);
          const bgColor = `FF${tableColor.bg}`;
          const borderColor = `FF${tableColor.border}`;

          if (cIdx === 0) {
            // ✅ Table number column
            cell.font = { bold: true, size: 14, color: { argb: 'FF000000' } };
            cell.fill = { 
              type: 'pattern', 
              pattern: 'solid', 
              fgColor: { argb: bgColor } 
            };
            cell.border = {
              top: { style: 'medium', color: { argb: borderColor } },
              bottom: { style: 'medium', color: { argb: borderColor } },
              left: { style: 'medium', color: { argb: borderColor } },
              right: { style: 'medium', color: { argb: borderColor } }
            };
          } else {
            // ✅ Time slot cells
            if (cellValue === 'X') {
              // Break cells - Red
              cell.font = { bold: true, size: 16, color: { argb: 'FFC62828' } };
              cell.fill = { 
                type: 'pattern', 
                pattern: 'solid', 
                fgColor: { argb: 'FFFFCDD2' } 
              };
              // Keep borders for break cells
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
              };
            } else if (cellValue === '●') {
              // Open cells - Table color
              cell.font = { bold: true, size: 18, color: { argb: borderColor } };
              cell.fill = { 
                type: 'pattern', 
                pattern: 'solid', 
                fgColor: { argb: bgColor } 
              };
              // Keep borders for open cells
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
              };
            } else {
              cell.font = { size: 10, color: { argb: 'FFFFFFFF' } }; // White text (invisible)
              cell.fill = { 
                type: 'pattern', 
                pattern: 'solid', 
                fgColor: { argb: 'FF000000' } // Pitch black
              };
              // ✅ NO BORDERS for closed cells - cleaner look
              // cell.border is intentionally not set, leaving cells borderless
            }
          }
        }
      });
    });

    // ✅ Export file
    const gamingDayStr = getGamingDayString();
    const fileName = `TableFlow_Timeline_${gamingDayStr}.xlsx`;
    
    wb.xlsx.writeBuffer().then(buffer => {
      saveAs(new Blob([buffer]), fileName);
      console.log(`✅ ExcelJS export completed: ${fileName} (${activeTables.length} tables)`);
      alert(`Exported timeline for ${activeTables.length} active tables for ${gamingDayStr}`);
    }).catch(error => {
      console.error('❌ ExcelJS export failed:', error);
      alert('Failed to export Excel file. Please try again.');
    });
  } catch (error) {
    console.error('❌ ExcelJS export failed:', error);
    console.error('Error details:', error.stack);
    alert('Failed to export Excel file. Please try again.');
  }
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