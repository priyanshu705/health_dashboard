/**
 * Robust date utilities for parsing Google Sheet dates and calculating week (Mon-Sun) and month ranges
 */

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Parses any common Google Sheet date string into canonical 'YYYY-MM-DD' and Date object.
 * Handles:
 * - DD/MM/YYYY or DD-MM-YYYY (e.g. 08/09/2026, 8/9/2026)
 * - YYYY-MM-DD (e.g. 2026-09-08)
 * - MM/DD/YYYY (e.g. 09/08/2026)
 * - Excel/Sheets serial numbers (e.g. 46273)
 * - Standard Date.parse strings
 */
export function parseSheetDate(val: any): { canonical: string; dayOfWeek: string; dateObj: Date } | null {
  if (val === undefined || val === null) return null;

  // If already a valid Date object
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      const canonical = formatToYmd(val);
      return { canonical, dayOfWeek: DAY_NAMES[val.getDay()], dateObj: val };
    }
    return null;
  }

  const str = String(val).trim();
  if (!str) return null;

  // Check if it's an Excel/Sheets numeric serial date (e.g., 35000 to 65000)
  if (/^\d{4,6}(\.\d+)?$/.test(str)) {
    const serial = parseFloat(str);
    const days = Math.floor(serial);
    // Excel base date is Dec 30, 1899. Using year, month, date avoids DST skew.
    const dateObj = new Date(1899, 11, 30 + days);
    const frac = serial - days;
    if (frac > 0) {
      const ms = Math.round(frac * 86400000);
      dateObj.setMilliseconds(dateObj.getMilliseconds() + ms);
    }
    if (!isNaN(dateObj.getTime())) {
      const canonical = formatToYmd(dateObj);
      return { canonical, dayOfWeek: DAY_NAMES[dateObj.getDay()], dateObj };
    }
  }

  // Check YYYY-MM-DD or YYYY/MM/DD (with optional timestamp)
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10) - 1;
    const d = parseInt(ymdMatch[3], 10);
    const dateObj = new Date(y, m, d);
    if (!isNaN(dateObj.getTime())) {
      const canonical = formatToYmd(dateObj);
      return { canonical, dayOfWeek: DAY_NAMES[dateObj.getDay()], dateObj };
    }
  }

  // Check DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (with optional timestamp)
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    let part1 = parseInt(dmyMatch[1], 10);
    let part2 = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);

    let d = part1;
    let m = part2 - 1;

    // Fallback: if part2 > 12 and part1 <= 12, then it's MM/DD/YYYY
    if (part2 > 12 && part1 <= 12) {
      m = part1 - 1;
      d = part2;
    }

    const dateObj = new Date(y, m, d);
    if (!isNaN(dateObj.getTime())) {
      const canonical = formatToYmd(dateObj);
      return { canonical, dayOfWeek: DAY_NAMES[dateObj.getDay()], dateObj };
    }
  }

  // Fallback to native Date parser
  const nativeParsed = new Date(str);
  if (!isNaN(nativeParsed.getTime())) {
    const canonical = formatToYmd(nativeParsed);
    return { canonical, dayOfWeek: DAY_NAMES[nativeParsed.getDay()], dateObj: nativeParsed };
  }

  return null;
}

export function formatToYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns Monday 00:00:00 and Sunday 23:59:59 for any specified date
 */
export function getWeekBoundsForDate(targetDate: Date): { monday: Date; sunday: Date; mondayYmd: string; sundayYmd: string } {
  const current = new Date(targetDate);
  const day = current.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    monday,
    sunday,
    mondayYmd: formatToYmd(monday),
    sundayYmd: formatToYmd(sunday)
  };
}

/**
 * Returns Monday 00:00:00 and Sunday 23:59:59 for a given reference date (default = now)
 */
export function getCurrentWeekBounds(refDate: Date = new Date()): { monday: Date; sunday: Date; mondayYmd: string; sundayYmd: string } {
  return getWeekBoundsForDate(refDate);
}

/**
 * Checks if a given YYYY-MM-DD or date is within a specific week (Monday -> Sunday)
 */
export function isDateInWeek(dateInput: string | Date, mondayYmd: string): boolean {
  let d: Date;
  if (typeof dateInput === 'string') {
    const parsed = parseSheetDate(dateInput);
    if (!parsed) return false;
    d = parsed.dateObj;
  } else {
    d = dateInput;
  }

  const monParsed = parseSheetDate(mondayYmd);
  if (!monParsed) return false;
  const bounds = getWeekBoundsForDate(monParsed.dateObj);
  const time = d.getTime();
  return time >= bounds.monday.getTime() && time <= bounds.sunday.getTime();
}

/**
 * Checks if a given YYYY-MM-DD or date is within the current week (Monday -> Sunday)
 */
export function isDateInCurrentWeek(dateInput: string | Date, refDate: Date = new Date()): boolean {
  let d: Date;
  if (typeof dateInput === 'string') {
    const parsed = parseSheetDate(dateInput);
    if (!parsed) return false;
    d = parsed.dateObj;
  } else {
    d = dateInput;
  }

  const { monday, sunday } = getCurrentWeekBounds(refDate);
  const time = d.getTime();
  return time >= monday.getTime() && time <= sunday.getTime();
}

/**
 * Checks if a given date is strictly within a specific calendar month (e.g. '2026-09')
 */
export function isDateInMonth(dateInput: string | Date, yearMonthKey: string): boolean {
  let d: Date;
  if (typeof dateInput === 'string') {
    const parsed = parseSheetDate(dateInput);
    if (!parsed) return false;
    d = parsed.dateObj;
  } else {
    d = dateInput;
  }

  const [yStr, mStr] = yearMonthKey.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10) - 1;
  return d.getFullYear() === y && d.getMonth() === m;
}

/**
 * Checks if a given date is within the current calendar month
 */
export function isDateInCurrentMonth(dateInput: string | Date, refDate: Date = new Date()): boolean {
  let d: Date;
  if (typeof dateInput === 'string') {
    const parsed = parseSheetDate(dateInput);
    if (!parsed) return false;
    d = parsed.dateObj;
  } else {
    d = dateInput;
  }

  return d.getFullYear() === refDate.getFullYear() && d.getMonth() === refDate.getMonth();
}

/**
 * Checks if a date was within the last N days
 */
export function isDateWithinPastDays(dateInput: string | Date, days: number, refDate: Date = new Date()): boolean {
  let d: Date;
  if (typeof dateInput === 'string') {
    const parsed = parseSheetDate(dateInput);
    if (!parsed) return false;
    d = parsed.dateObj;
  } else {
    d = dateInput;
  }

  const cutoff = new Date(refDate);
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  const end = new Date(refDate);
  end.setHours(23, 59, 59, 999);

  const time = d.getTime();
  return time >= cutoff.getTime() && time <= end.getTime();
}
