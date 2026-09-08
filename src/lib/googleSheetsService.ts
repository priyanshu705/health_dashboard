import { DailyHealthRecord, SheetParseResult, SheetTabInfo } from '../types';
import { parseSheetDate, formatToYmd } from './dateUtils';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

export interface GoogleSheetMetadataResponse {
  spreadsheetId: string;
  properties: {
    title: string;
  };
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
      index?: number;
      gridProperties?: {
        rowCount: number;
        columnCount: number;
      };
    };
  }>;
}

/**
 * Searches user's Google Drive for Google Spreadsheets matching a name query.
 */
export async function searchSheetsByName(
  accessToken: string, 
  query: string = 'Durgesh_ji _Client Health Tracker'
): Promise<GoogleDriveFile[]> {
  try {
    const qParam = encodeURIComponent(
      `mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
    );
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${qParam}&fields=files(id,name,mimeType,modifiedTime)&pageSize=30&orderBy=modifiedTime desc`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Drive search failed with status ${res.status}`);
    }

    const data = await res.json();
    const files: GoogleDriveFile[] = data.files || [];

    // Prioritize files matching user query
    if (query && query.trim()) {
      const cleaned = query.toLowerCase().replace(/[^a-z0-9]/g, '');
      files.sort((a, b) => {
        const matchA = a.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleaned) ? -1 : 1;
        const matchB = b.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleaned) ? -1 : 1;
        return matchA - matchB;
      });
    }

    return files;
  } catch (err: any) {
    console.error('Drive search error:', err);
    throw err;
  }
}

/**
 * Fetches spreadsheet metadata including all sheet tabs
 */
export async function getSpreadsheetDetails(
  accessToken: string, 
  spreadsheetId: string
): Promise<GoogleSheetMetadataResponse> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Failed to fetch sheet details (${res.status})`);
  }

  return await res.json();
}

/**
 * Fetches cell data from a specific sheet range
 */
export async function fetchSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string = 'A1:ZZ1000'
): Promise<any[][]> {
  const encodedRange = encodeURIComponent(range);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueRenderOption=FORMATTED_VALUE`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Failed to fetch cell values (${res.status})`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Batch fetches values for multiple ranges in a single Google Sheets API call
 */
export async function fetchBatchSheetValues(
  accessToken: string,
  spreadsheetId: string,
  ranges: string[]
): Promise<Record<string, any[][]>> {
  if (ranges.length === 0) return {};

  const queryParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryParams}&valueRenderOption=FORMATTED_VALUE`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Failed to batch fetch cell values (${res.status})`);
  }

  const data = await res.json();
  const map: Record<string, any[][]> = {};
  if (data.valueRanges && Array.isArray(data.valueRanges)) {
    data.valueRanges.forEach((vr: any, idx: number) => {
      const requestedRange = ranges[idx];
      map[requestedRange] = vr.values || [];
    });
  }
  return map;
}

/**
 * Discovers and fetches ALL worksheet tabs from the connected Google Spreadsheet.
 * Dynamically parses each tab's schema independently and returns tab-agnostic SheetTabInfo[].
 */
export async function fetchAllSpreadsheetTabs(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; tabs: SheetTabInfo[] }> {
  const details = await getSpreadsheetDetails(accessToken, spreadsheetId);
  const spreadsheetTitle = details.properties?.title || 'Google Sheet';
  const sheets = details.sheets || [];

  if (sheets.length === 0) {
    throw new Error('No worksheets found in this spreadsheet.');
  }

  // Prepare ranges for all worksheets (escaped)
  const ranges = sheets.map(s => `'${s.properties.title.replace(/'/g, "''")}'!A1:ZZ500`);
  let batchData: Record<string, any[][]> = {};

  try {
    batchData = await fetchBatchSheetValues(accessToken, spreadsheetId, ranges);
  } catch (batchErr) {
    console.warn('Batch get failed, falling back to sequential fetch:', batchErr);
    for (let i = 0; i < sheets.length; i++) {
      const title = sheets[i].properties.title;
      try {
        const rows = await fetchSheetValues(accessToken, spreadsheetId, `'${title}'!A1:ZZ500`);
        batchData[ranges[i]] = rows;
      } catch (err) {
        console.warn(`Failed to fetch tab "${title}":`, err);
        batchData[ranges[i]] = [];
      }
    }
  }

  const tabs: SheetTabInfo[] = sheets.map((s, idx) => {
    const title = s.properties.title;
    const sheetId = s.properties.sheetId;
    const rows = batchData[ranges[idx]] || [];
    return parseSheetTab(rows, title, sheetId, idx);
  });

  return {
    title: spreadsheetTitle,
    tabs
  };
}

/**
 * Helper to transpose a 2D matrix (convert rows into columns and vice-versa)
 */
function transposeMatrix(matrix: any[][]): any[][] {
  if (!matrix || matrix.length === 0) return [];
  const maxCols = Math.max(...matrix.map(r => (Array.isArray(r) ? r.length : 0)));
  const transposed: any[][] = [];
  for (let c = 0; c < maxCols; c++) {
    const colRow: any[] = [];
    for (let r = 0; r < matrix.length; r++) {
      colRow.push(matrix[r]?.[c] ?? '');
    }
    transposed.push(colRow);
  }
  return transposed;
}

const HEALTH_KEYWORDS = [
  'date', 'day', 'timestamp', 'time', 'tarikh', 'dt', 'logdate',
  'client', 'name', 'member', 'person', 'patient', 'user', 'naam', 'trainee',
  'weight', 'wt', 'kg', 'bodyweight', 'wazan', 'lbs',
  'step', 'steps', 'walk', 'kadam', 'walking', 'stepcount',
  'pulse', 'heart', 'heartrate', 'rhr', 'bpm',
  'bp', 'pressure', 'bloodpressure', 'sysdia', 'systolic',
  'sleep', 'neend', 'hours', 'sleephours',
  'water', 'hydration', 'paani', 'liters', 'waterintake',
  'diet', 'food', 'meal', 'nutrition', 'khana',
  'workout', 'exercise', 'gym', 'fitness', 'activity', 'training', 'kasrat',
  'calorie', 'calories', 'kcal', 'burn',
  'spo2', 'oxygen', 'o2',
  'sugar', 'glucose', 'bloodsugar',
  'notes', 'note', 'remarks', 'comment', 'feedback', 'status'
];

/**
 * Checks if a cell value represents a pure numeric quantity (e.g. 75, 10500, 120/80)
 */
function isNumericCell(val: any): boolean {
  if (val === undefined || val === null) return false;
  const s = String(val).trim();
  if (!s) return false;
  // standard numbers, decimals, or BP pattern (120/80)
  return /^-?\d+(\.\d+)?$/.test(s) || /^\d{2,3}\/\d{2,3}$/.test(s);
}

/**
 * Parses raw 2D row data for ANY tab into a structured SheetTabInfo object.
 * Tab-agnostic: Works with health data, payments, attendance, invoices, workout, notes, etc.
 * Does NOT throw errors when health columns are absent.
 */
export function parseSheetTab(
  initialRows: any[][],
  tabTitle: string,
  sheetId: number = 0,
  index: number = 0
): SheetTabInfo {
  if (!initialRows || initialRows.length === 0) {
    return {
      sheetId,
      title: tabTitle,
      index,
      rowCount: 0,
      columnCount: 0,
      headers: [],
      records: [],
      hasHealthMetrics: false,
      hasClientColumn: false,
      clients: [],
      hasDateColumn: false,
      dates: [],
      isEmpty: true,
      lastUpdated: Date.now()
    };
  }

  let rows = initialRows;

  // 1. TRANSPOSE CHECK: Detect if metrics are listed down Column 0 with dates as column headers
  if (rows.length >= 3) {
    const col0Cells = rows.slice(0, 15).map(r => String(r[0] || '').toLowerCase().trim());
    const col0Hits = col0Cells.filter(cell => 
      HEALTH_KEYWORDS.some(kw => cell.includes(kw))
    ).length;

    // If 3 or more health parameter names are in column 0, this sheet is transposed!
    if (col0Hits >= 3) {
      rows = transposeMatrix(rows);
    }
  }

  // 2. SMART HEADER ROW SCORING:
  // Instead of naive nonEmpty count (which easily mistakes data rows for headers),
  // we evaluate text labels, health keywords, and penalize numeric/date data rows.
  let headerIndex = 0;
  let bestHeaderScore = -999;
  const maxScanRows = Math.min(rows.length, 15);

  for (let r = 0; r < maxScanRows; r++) {
    const row = rows[r] || [];
    let textCount = 0;
    let numericCount = 0;
    let keywordHits = 0;

    row.forEach(cell => {
      if (cell === undefined || cell === null) return;
      const str = String(cell).trim().toLowerCase();
      if (!str) return;

      if (isNumericCell(str)) {
        numericCount++;
      } else {
        textCount++;
        if (HEALTH_KEYWORDS.some(kw => str.includes(kw))) {
          keywordHits++;
        }
      }
    });

    if (textCount === 0 && numericCount === 0) continue;

    // Scoring formula:
    let score = (keywordHits * 20) + (textCount * 3) - (numericCount * 12);
    
    // Penalty for single-cell title banner (e.g. ["Durgesh_ji _Client Health Tracker"])
    if (textCount === 1 && numericCount === 0) {
      score -= 30;
    }
    // Bonus for standard multi-column headers (3+ text labels)
    if (textCount >= 3) {
      score += 25;
    }
    // Heavy penalty if this is the last row in rows (data row)
    if (r === rows.length - 1 && rows.length > 1) {
      score -= 60;
    }

    if (score > bestHeaderScore) {
      bestHeaderScore = score;
      headerIndex = r;
    }
  }

  // Safety fallback: if no row scored well, pick the first row with >= 2 non-empty cells
  if (bestHeaderScore <= 0) {
    for (let r = 0; r < maxScanRows; r++) {
      const row = rows[r] || [];
      const nonEmpties = row.filter(c => c !== undefined && c !== null && String(c).trim() !== '').length;
      if (nonEmpties >= 2) {
        headerIndex = r;
        break;
      }
    }
  }

  // Extract raw headers from detected header row
  const rawHeadersRow = rows[headerIndex] || [];
  const headers: string[] = [];
  rawHeadersRow.forEach((cell, idx) => {
    const val = cell !== undefined && cell !== null ? String(cell).trim() : '';
    headers.push(val || `Column ${idx + 1}`);
  });

  // If the sheet has only headers and no data rows
  if (rows.length <= headerIndex + 1) {
    return {
      sheetId,
      title: tabTitle,
      index,
      rowCount: 0,
      columnCount: headers.length,
      headers,
      records: [],
      hasHealthMetrics: headers.some(h => HEALTH_KEYWORDS.some(kw => h.toLowerCase().includes(kw))),
      hasClientColumn: false,
      clients: [],
      hasDateColumn: false,
      dates: [],
      isEmpty: true,
      lastUpdated: Date.now()
    };
  }

  // Normalized lowercase header finder
  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const findCol = (keywords: string[]): number => {
    return normalizedHeaders.findIndex(h => 
      keywords.some(k => h.includes(k.toLowerCase().replace(/[^a-z0-9]/g, '')))
    );
  };

  // Detect Client / Entity column with extensive synonyms
  const clientIdx = findCol([
    'clientname', 'client', 'customer', 'member', 'employee', 'patient', 
    'user', 'name', 'person', 'naam', 'trainee', 'athlete', 'fullname'
  ]);
  const hasClientColumn = clientIdx >= 0;
  const clientColumnName = hasClientColumn ? headers[clientIdx] : undefined;

  // Detect Date column with extensive synonyms
  let dateIdx = findCol([
    'date', 'recorddate', 'entrydate', 'createddate', 'paymentdate', 
    'attendancedate', 'joiningdate', 'timestamp', 'day', 'logdate', 
    'transactiondate', 'invoicedate', 'time', 'tarikh', 'datetime', 'dt'
  ]);

  // If no date column found by header name, check if any column contains date formatted strings
  if (dateIdx < 0 && rows.length > headerIndex + 1) {
    const sampleRow = rows[headerIndex + 1] || [];
    for (let c = 0; c < sampleRow.length; c++) {
      if (sampleRow[c] && parseSheetDate(sampleRow[c])) {
        dateIdx = c;
        break;
      }
    }
  }

  const hasDateColumn = dateIdx >= 0;
  const dateColumnName = hasDateColumn ? headers[dateIdx] : undefined;

  // Detect Health Metric columns
  const weightIdx = findCol(['weight', 'wt', 'kg', 'weightkg', 'bodyweight', 'currentweight', 'wazan', 'lbs', 'morningweight']);
  const stepsIdx = findCol(['step', 'steps', 'stepcount', 'walksteps', 'dailysteps', 'stepstaken', 'kadam', 'walk', 'walking']);
  const rhrIdx = findCol(['restinghr', 'rhr', 'restingheartrate', 'pulse', 'heartrate', 'hr', 'bpm', 'restingpulse']);
  const bpIdx = findCol(['bloodpressure', 'bp', 'bpreading', 'sysdia', 'systolic', 'diastolic', 'pressure', 'bplevel']);
  const sleepIdx = findCol(['sleep', 'sleepduration', 'sleephours', 'sleepdurationhrs', 'sleephrs', 'hours', 'neend', 'totalsleep', 'sleepinhrs']);
  const waterIdx = findCol(['water', 'waterintake', 'hydration', 'waterl', 'waterml', 'paani', 'liters', 'waterliters']);
  const dietIdx = findCol(['diet', 'dietfollowed', 'nutrition', 'mealplan', 'food', 'meals', 'khana', 'dietcompliance']);
  const workoutIdx = findCol(['workout', 'exercise', 'activity', 'training', 'gym', 'fitness', 'kasrat', 'workoutdone']);
  const notesIdx = findCol(['note', 'notes', 'remarks', 'comment', 'comments', 'feedback', 'trainer', 'doctor', 'summary']);
  const statusIdx = findCol(['status', 'clientstatus', 'condition', 'tag', 'healthstatus']);
  const spo2Idx = findCol(['spo2', 'oxygen', 'o2', 'pulseox']);
  const calIdx = findCol(['calorie', 'calories', 'activecalories', 'kcal', 'burn', 'caloriesburned']);
  const sugarIdx = findCol(['glucose', 'bloodsugar', 'sugar', 'fastingglucose', 'postprandial', 'fbs', 'ppbs', 'hba1c']);

  const records: DailyHealthRecord[] = [];
  const clientSet = new Set<string>();
  const dateSet = new Set<string>();

  // Default client fallback if client column is omitted
  const fallbackClientName = tabTitle.toLowerCase().includes('durgesh') 
    ? 'Durgesh Ji' 
    : (tabTitle === 'Sheet1' ? 'Main Client' : tabTitle);

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every(cell => cell === undefined || cell === null || String(cell).trim() === '')) {
      continue;
    }

    // Capture complete raw values map for each column heading
    const rawValues: Record<string, string | number> = {};
    headers.forEach((header, colIdx) => {
      const cellVal = row[colIdx];
      rawValues[header] = cellVal !== undefined && cellVal !== null ? String(cellVal).trim() : '';
    });

    // 1. Client / Entity Name
    let clientName = '';
    if (hasClientColumn && row[clientIdx] !== undefined && row[clientIdx] !== null) {
      clientName = String(row[clientIdx]).trim();
    }
    if (!clientName) {
      clientName = fallbackClientName;
    }
    clientSet.add(clientName);

    // 2. Date parsing
    let dateStr = '';
    let rawDateStr = '';
    let dayOfWeek = '';

    if (hasDateColumn && row[dateIdx] !== undefined && row[dateIdx] !== null) {
      rawDateStr = String(row[dateIdx]).trim();
      if (rawDateStr) {
        const parsed = parseSheetDate(rawDateStr);
        if (parsed) {
          dateStr = parsed.canonical;
          dayOfWeek = parsed.dayOfWeek;
        } else {
          dateStr = rawDateStr;
          dayOfWeek = 'Logged';
        }
      }
    }

    // If still no date, scan other cells in this row to see if any cell is a date
    if (!dateStr) {
      for (let c = 0; c < row.length; c++) {
        if (c !== clientIdx && row[c]) {
          const parsed = parseSheetDate(row[c]);
          if (parsed) {
            dateStr = parsed.canonical;
            rawDateStr = String(row[c]).trim();
            dayOfWeek = parsed.dayOfWeek;
            break;
          }
        }
      }
    }

    if (!dateStr) {
      dateStr = `Row ${i + 1}`;
      rawDateStr = dateStr;
      dayOfWeek = 'Entry';
    } else {
      dateSet.add(dateStr);
    }

    // Parse numeric values (strictly undefined if not found or invalid)
    const parseNum = (idx: number): number | undefined => {
      if (idx < 0 || row[idx] === undefined || row[idx] === null) return undefined;
      const strVal = String(row[idx]).trim().replace(/[^0-9.-]/g, '');
      if (!strVal) return undefined;
      const val = parseFloat(strVal);
      return isNaN(val) ? undefined : val;
    };

    const steps = parseNum(stepsIdx);
    const weightKg = parseNum(weightIdx);
    const restingHeartRate = parseNum(rhrIdx);
    const sleepDurationHours = parseNum(sleepIdx);
    const activeCalories = parseNum(calIdx);
    const spo2 = parseNum(spo2Idx);
    const bloodGlucose = parseNum(sugarIdx);

    let waterIntakeMl: number | undefined = undefined;
    if (waterIdx >= 0 && row[waterIdx] !== undefined && row[waterIdx] !== null) {
      const rawWater = parseNum(waterIdx);
      if (rawWater !== undefined) {
        waterIntakeMl = rawWater < 15 ? Math.round(rawWater * 1000) : Math.round(rawWater);
      }
    }

    let bloodPressure: string | undefined = undefined;
    let bloodPressureSystolic: number | undefined = undefined;
    let bloodPressureDiastolic: number | undefined = undefined;

    if (bpIdx >= 0 && row[bpIdx] !== undefined && row[bpIdx] !== null) {
      const bpRaw = String(row[bpIdx]).trim();
      if (bpRaw) {
        bloodPressure = bpRaw;
        const parts = bpRaw.split(/[/ -]/).map(p => parseInt(p.trim(), 10)).filter(n => !isNaN(n));
        if (parts.length >= 2) {
          bloodPressureSystolic = parts[0];
          bloodPressureDiastolic = parts[1];
        }
      }
    }

    const dietFollowed = dietIdx >= 0 && row[dietIdx] ? String(row[dietIdx]).trim() : undefined;
    const workout = workoutIdx >= 0 && row[workoutIdx] ? String(row[workoutIdx]).trim() : undefined;
    const notes = notesIdx >= 0 && row[notesIdx] ? String(row[notesIdx]).trim() : undefined;
    const status = statusIdx >= 0 && row[statusIdx] ? String(row[statusIdx]).trim() : undefined;

    records.push({
      id: `rec-${tabTitle.replace(/[^a-zA-Z0-9]/g, '_')}-${i}-${clientName || 'row'}`,
      date: dateStr,
      rawDate: rawDateStr,
      dayOfWeek,
      clientName,
      steps,
      weightKg,
      restingHeartRate,
      sleepDurationHours,
      bloodPressure,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      waterIntakeMl,
      activeCalories,
      spo2,
      bloodGlucose,
      dietFollowed,
      workout,
      notes,
      status,
      rawValues
    });
  }

  // Detect whether this tab contains health metrics
  const hasHealthColumns = (
    weightIdx >= 0 || stepsIdx >= 0 || rhrIdx >= 0 || bpIdx >= 0 || 
    sleepIdx >= 0 || waterIdx >= 0 || spo2Idx >= 0 || sugarIdx >= 0
  );

  const hasHealthValues = records.some(r => 
    r.steps !== undefined || 
    r.weightKg !== undefined || 
    r.restingHeartRate !== undefined || 
    r.bloodPressure !== undefined || 
    r.sleepDurationHours !== undefined || 
    r.waterIntakeMl !== undefined
  );

  const hasHealthMetrics = hasHealthColumns || hasHealthValues;

  return {
    sheetId,
    title: tabTitle,
    index,
    rowCount: records.length,
    columnCount: headers.length,
    headers,
    records,
    hasHealthMetrics,
    hasClientColumn,
    clientColumnName,
    clients: Array.from(clientSet),
    hasDateColumn,
    dateColumnName,
    dates: Array.from(dateSet).sort().reverse(),
    isEmpty: records.length === 0,
    lastUpdated: Date.now()
  };
}

/**
 * Backward compatibility parser wrapper for single-tab calls
 */
export function parseSheetRowsToHealthRecords(
  rows: any[][], 
  sheetTitle: string = 'Google Sheet'
): SheetParseResult {
  const tabInfo = parseSheetTab(rows, sheetTitle);
  return {
    headers: tabInfo.headers,
    records: tabInfo.records,
    clients: tabInfo.clients
  };
}
