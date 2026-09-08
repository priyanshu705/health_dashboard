import { DailyHealthRecord, SheetParseResult, SheetTabInfo } from '../types';
import { parseSheetRowsToHealthRecords, parseSheetTab } from '../lib/googleSheetsService';

export const EMPTY_SHEET_DATA: SheetParseResult = {
  headers: [],
  records: [],
  clients: []
};

/**
 * Parses raw CSV or TSV content into a full SheetTabInfo object
 */
export function parseSheetCsvToTabInfo(csvText: string, title: string = 'Imported Sheet'): SheetTabInfo {
  if (!csvText || !csvText.trim()) {
    return parseSheetTab([], title);
  }

  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return parseSheetTab([], title);
  }

  // Auto-detect delimiter
  const sample = lines.slice(0, 5).join('\n');
  const tabCount = (sample.match(/\t/g) || []).length;
  const commaCount = (sample.match(/,/g) || []).length;
  const semicolonCount = (sample.match(/;/g) || []).length;
  const pipeCount = (sample.match(/\|/g) || []).length;

  let delimiter = ',';
  if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = '\t';
  } else if (semicolonCount > commaCount && semicolonCount > tabCount) {
    delimiter = ';';
  } else if (pipeCount > commaCount && pipeCount > tabCount) {
    delimiter = '|';
  }

  const rows: string[][] = [];
  for (const line of lines) {
    let cleanLine = line;
    if (delimiter === '|' && cleanLine.startsWith('|') && cleanLine.endsWith('|')) {
      cleanLine = cleanLine.slice(1, -1);
    }

    const row: string[] = [];
    let insideQuote = false;
    let currentCell = '';

    for (let i = 0; i < cleanLine.length; i++) {
      const char = cleanLine[i];
      if (char === '"') {
        if (insideQuote && cleanLine[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === delimiter && !insideQuote) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());

    if (row.every(c => /^[-:|=]+$/.test(c.trim()))) {
      continue;
    }

    if (row.some(c => c.length > 0)) {
      rows.push(row);
    }
  }

  return parseSheetTab(rows, title);
}

/**
 * Parses raw CSV or TSV content into a SheetParseResult
 */
export function parseSheetCsvData(csvText: string, title: string = 'Imported Sheet'): SheetParseResult {
  const tabInfo = parseSheetCsvToTabInfo(csvText, title);
  return {
    headers: tabInfo.headers,
    records: tabInfo.records,
    clients: tabInfo.clients
  };
}
