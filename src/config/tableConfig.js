import { getDefaultTableProperties } from '../services/storageService';

export const INITIAL_TABLES = [
  // Column 1 (left to right, top to bottom)
  { tableNumber: "3330", ...getDefaultTableProperties(), position: { col: 1, row: 1 } },
  { tableNumber: "3328", ...getDefaultTableProperties(), position: { col: 1, row: 2 } },
  { tableNumber: "3326", ...getDefaultTableProperties(), position: { col: 1, row: 3 } },
  { tableNumber: "3324", ...getDefaultTableProperties(), position: { col: 1, row: 4 }, rotation: 315 },
  { tableNumber: "3322", ...getDefaultTableProperties(), position: { col: 1, row: 5 }, rotation: 45 },
  { tableNumber: "3320", ...getDefaultTableProperties(), position: { col: 1, row: 6 } },
  
  // Column 2
  { tableNumber: "3329", ...getDefaultTableProperties(), position: { col: 2, row: 1 } },
  { tableNumber: "3327", ...getDefaultTableProperties(), position: { col: 2, row: 2 } },
  { tableNumber: "3325", ...getDefaultTableProperties(), position: { col: 2, row: 3 } },
  { tableNumber: "3323", ...getDefaultTableProperties(), position: { col: 2, row: 4 }, rotation: 45 },
  { tableNumber: "3321", ...getDefaultTableProperties(), position: { col: 2, row: 5 }, rotation: 315 },
  { tableNumber: "3319", ...getDefaultTableProperties(), position: { col: 2, row: 6 } },
  
  // Column 3
  { tableNumber: "3314", ...getDefaultTableProperties(), position: { col: 3, row: 1 } },
  { tableNumber: "3316", ...getDefaultTableProperties(), position: { col: 3, row: 2 } },
  { tableNumber: "3317", ...getDefaultTableProperties(), position: { col: 3, row: 3 } },
  { tableNumber: "3318", ...getDefaultTableProperties(), position: { col: 3, row: 4 } },
  { tableNumber: "3333", ...getDefaultTableProperties(), position: { col: 3, row: 5, isFinalTable: true }, rotation: 180 }, // Final table
  { tableNumber: "3336", ...getDefaultTableProperties(), position: { col: 3, row: 6 }, rotation: 315 },
  
  // Column 4
  { tableNumber: "3313", ...getDefaultTableProperties(), position: { col: 4, row: 1 } },
  { tableNumber: "3315", ...getDefaultTableProperties(), position: { col: 4, row: 2 } },
  { tableNumber: "3331", ...getDefaultTableProperties(), position: { col: 4, row: 3 } },
  { tableNumber: "3332", ...getDefaultTableProperties(), position: { col: 4, row: 4 } },
  { tableNumber: "3335", ...getDefaultTableProperties(), position: { col: 4, row: 6 }, rotation: 45 },
  
  // Column 5
  { tableNumber: "3312", ...getDefaultTableProperties(), position: { col: 5, row: 1 } },
  { tableNumber: "3310", ...getDefaultTableProperties(), position: { col: 5, row: 2 } },
  { tableNumber: "3308", ...getDefaultTableProperties(), position: { col: 5, row: 3 } },
  { tableNumber: "3306", ...getDefaultTableProperties(), position: { col: 5, row: 4 }, rotation: 315 },
  { tableNumber: "3304", ...getDefaultTableProperties(), position: { col: 5, row: 5 }, rotation: 45 },
  { tableNumber: "3302", ...getDefaultTableProperties(), position: { col: 5, row: 6 } },
  
  // Column 6
  { tableNumber: "3311", ...getDefaultTableProperties(), position: { col: 6, row: 1 } },
  { tableNumber: "3309", ...getDefaultTableProperties(), position: { col: 6, row: 2 } },
  { tableNumber: "3307", ...getDefaultTableProperties(), position: { col: 6, row: 3 } },
  { tableNumber: "3305", ...getDefaultTableProperties(), position: { col: 6, row: 4 }, rotation: 45 },
  { tableNumber: "3303", ...getDefaultTableProperties(), position: { col: 6, row: 5 }, rotation: 315 },
  { tableNumber: "3301", ...getDefaultTableProperties(), position: { col: 6, row: 6 } }
];

export const STORAGE_VERSION = 'v1';