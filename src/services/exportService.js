import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { getCurrentGamingDay, getGamingDayString } from './gamingDayService';
import { checkBreakInInterval } from '../utils/timeHelpers';

const TABLE_COLORS = {
  '3301': { bg: 'FFE6E6', border: 'CC0000' }, // Light Red / Dark Red
  '3302': { bg: 'FFF2E6', border: 'FF6600' }, // Light Orange / Dark Orange
  '3303': { bg: 'E6F7E6', border: '00AA00' }, // Light Green / Dark Green
  '3304': { bg: 'F0E6FF', border: '7700AA' }, // Light Purple / Dark Purple
  '3305': { bg: 'E6F0FF', border: '0066CC' }, // Light Blue / Dark Blue
  '3306': { bg: 'FFFFE6', border: 'CCAA00' }, // Light Yellow / Dark Yellow
  '3307': { bg: 'FFE6F7', border: 'CC0066' }, // Light Pink / Dark Pink
  '3308': { bg: 'E6FFFF', border: '006666' }, // Light Cyan / Dark Cyan
  '3309': { bg: 'F7F0E6', border: 'AA5500' }, // Light Brown / Dark Brown
  '3310': { bg: 'E6E6F7', border: '3300AA' }, // Light Indigo / Dark Indigo
  '3311': { bg: 'F7E6E6', border: 'AA0033' }, // Light Crimson / Dark Crimson
  '3312': { bg: 'E6F7F0', border: '00AA55' }, // Light Mint / Dark Mint
  '3313': { bg: 'F0F7E6', border: '66AA00' }, // Light Lime / Dark Lime
  '3314': { bg: 'E6E6FF', border: '0000CC' }, // Light Lavender / Dark Blue
  '3315': { bg: 'F7F7E6', border: 'AAAA00' }, // Light Olive / Dark Olive
  '3316': { bg: 'FFE6E6', border: 'AA3300' }, // Light Coral / Dark Coral
  '3317': { bg: 'E6F0F7', border: '004499' }, // Light Steel / Dark Steel
  '3318': { bg: 'F0E6F7', border: '6600AA' }, // Light Violet / Dark Violet
  '3319': { bg: 'F7E6F0', border: 'AA0055' }, // Light Rose / Dark Rose
  '3320': { bg: 'E6F7FF', border: '0099CC' }, // Light Sky / Dark Sky
  '3321': { bg: 'F7FFE6', border: '99CC00' }, // Light Spring / Dark Spring
  '3322': { bg: 'FFE6F0', border: 'CC0055' }, // Light Magenta / Dark Magenta
  '3323': { bg: 'E6FFE6', border: '00CC00' }, // Light Bright Green / Dark Bright Green
  '3324': { bg: 'F0FFE6', border: '77CC00' }, // Light Chartreuse / Dark Chartreuse
  '3325': { bg: 'FFE6FF', border: 'CC00CC' }, // Light Fuchsia / Dark Fuchsia
  '3326': { bg: 'E6EEFF', border: '0055CC' }, // Light Periwinkle / Dark Periwinkle
  '3327': { bg: 'EEFF E6', border: '55CC00' }, // Light Lawn / Dark Lawn
  '3328': { bg: 'FFE6EE', border: 'CC0077' }, // Light Blush / Dark Blush
  '3329': { bg: 'E6FFEE', border: '00CC77' }, // Light Seafoam / Dark Seafoam
  '3330': { bg: 'EEE6FF', border: '7700CC' }, // Light Amethyst / Dark Amethyst
  '3331': { bg: 'E6EEFF', border: '0077CC' }, // Light Cornflower / Dark Cornflower
  '3332': { bg: 'F7E6FF', border: 'AA00CC' }, // Light Orchid / Dark Orchid
  '3333': { bg: 'FFD700', border: 'B8860B' }, // Gold / Dark Goldenrod (Final Table)
  '3335': { bg: 'E6F7E6', border: '228B22' }, // Light Forest / Forest Green
  '3336': { bg: 'F0F8FF', border: '4169E1' }  // Alice Blue / Royal Blue
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
      if (session.breakType && session.breakType.includes('Trial')) return;

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
          const closeTime = session.closeTime || end;

          return openTime < intervalEnd && closeTime > intervalTime;
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

export const exportUpcomingBreaks = (historyData, tables) => {
  try {
    const now = new Date();
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 8); // Next 8 hours

    if (endTime.getHours() > 4) {
      endTime.setHours(4, 0, 0, 0);
    };
    
    const intervals = [];
    let current = new Date(now);
    
    const minutes = current.getMinutes();
    const nextQuarterMinutes = Math.ceil((minutes + 1) / 15) * 15;
    current.setMinutes(nextQuarterMinutes, 0, 0);
    
    if (nextQuarterMinutes >= 60) {
      current.setHours(current.getHours() + 1);
      current.setMinutes(nextQuarterMinutes - 60, 0, 0);
    }
    
    // Generate ALL 15-minute intervals (even empty ones)
    while (current < endTime) {
      intervals.push(new Date(current));
      current.setMinutes(current.getMinutes() + 15);
    }

    // Group sessions by table (exclude trial breaks)
    const tableSessionsMap = {};
    historyData.forEach(session => {
      if (session.breakType && session.breakType.includes('Trial')) return;
      
      if (!tableSessionsMap[session.tableNumber]) {
        tableSessionsMap[session.tableNumber] = [];
      }
      tableSessionsMap[session.tableNumber].push(session);
    });

    // Build breaks schedule for ALL intervals
    const breaksSchedule = [];
    
    intervals.forEach(intervalTime => {
      const intervalEnd = new Date(intervalTime.getTime() + (15 * 60 * 1000));
      const tablesOnBreak = [];

      // Check each table for breaks
      Object.keys(tableSessionsMap).forEach(tableNumber => {
        const sessions = tableSessionsMap[tableNumber];
        
        // Find active session
        const activeSession = sessions.find(session => {
          const openTime = session.openTime;
          const closeTime = session.closeTime || new Date(2099, 0, 1); // Far future if still open
          return openTime < intervalEnd && closeTime > intervalTime;
        });

        if (activeSession) {
          const mockTable = {
            startTime: activeSession.openTime,
            isTrialBreak: false
          };

          if (checkBreakInInterval(mockTable, intervalTime, intervalEnd)) {
            tablesOnBreak.push(tableNumber);
          }
        }
      });

      breaksSchedule.push({
        time: intervalTime,
        tables: tablesOnBreak.sort((a, b) => parseInt(a) - parseInt(b))
      });
    });

    const content = [
      'TABLEFLOW - UPCOMING TABLE BREAKS SCHEDULE',
      '=' .repeat(45),
      `Generated: ${now.toLocaleString()}`,
      `Next ${Math.min(8, Math.ceil((endTime - now) / (1000 * 60 * 60)))} hours of breaks`,
      '',
    ];

    breaksSchedule.forEach(breakInfo => {
      const timeStr = breakInfo.time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      if (breakInfo.tables.length > 0) {
        content.push(`${timeStr}  -  Tables: ${breakInfo.tables.join(', ')}`);
      } else {
        content.push(`${timeStr}  -  No breaks`);
      }
    });

    content.push('');
    content.push('Notes:');
    content.push('• Each break lasts 15 minutes');
    content.push('• Breaks occur every 3 hours 15 minutes');
    content.push('• Trial break tables excluded');

    // Export file
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `TableFlow_UpcomingBreaks_${timestamp}.txt`;
    
    downloadFile(content.join('\n'), fileName, 'text/plain');
    
    const breakCount = breaksSchedule.filter(b => b.tables.length > 0).length;
    console.log(`✅ Upcoming breaks export completed: ${fileName}`);
    alert(`Exported upcoming breaks schedule\n\n${breakCount} break periods in next 8 hours\nFile: ${fileName}`);

  } catch (error) {
    console.error('❌ Upcoming breaks export failed:', error);
    alert('Failed to export upcoming breaks. Please try again.');
  }
};