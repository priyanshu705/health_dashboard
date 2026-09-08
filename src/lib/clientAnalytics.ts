import { DailyHealthRecord, ClientProfileSummary } from '../types';
import { isDateInCurrentWeek, isDateInCurrentMonth, isDateWithinPastDays, getCurrentWeekBounds, formatToYmd } from './dateUtils';

export interface ManagementOverviewStats {
  totalClients: number;
  newClientsThisWeek: ClientProfileSummary[];
  newClientsThisMonth: ClientProfileSummary[];
  activeClients: ClientProfileSummary[];
  recentActivityClients: ClientProfileSummary[];
  inactiveClients: ClientProfileSummary[];
  totalRecords: number;
  clientSummaries: ClientProfileSummary[];
  currentWeekLabel: string;
}

/**
 * Derives management-level metrics and client profiles strictly from Google Sheet records.
 * If a metric column does not exist or has no values, it is not fabricated.
 */
export function computeManagementOverview(records: DailyHealthRecord[]): ManagementOverviewStats {
  const weekBounds = getCurrentWeekBounds();
  const currentWeekLabel = `${formatToYmd(weekBounds.monday)} to ${formatToYmd(weekBounds.sunday)}`;

  if (!records || records.length === 0) {
    return {
      totalClients: 0,
      newClientsThisWeek: [],
      newClientsThisMonth: [],
      activeClients: [],
      recentActivityClients: [],
      inactiveClients: [],
      totalRecords: 0,
      clientSummaries: [],
      currentWeekLabel
    };
  }

  // Group records by clientName
  const clientMap = new Map<string, DailyHealthRecord[]>();
  for (const r of records) {
    const name = r.clientName || 'Unknown Client';
    if (!clientMap.has(name)) {
      clientMap.set(name, []);
    }
    clientMap.get(name)!.push(r);
  }

  const clientSummaries: ClientProfileSummary[] = [];

  clientMap.forEach((clientRecs, clientName) => {
    // Sort chronologically (oldest to newest)
    clientRecs.sort((a, b) => a.date.localeCompare(b.date));

    const firstRec = clientRecs[0];
    const latestRec = clientRecs[clientRecs.length - 1];

    const firstDate = firstRec.date;
    const latestDate = latestRec.date;

    // A client is "New This Week" if their very first record ever recorded in the sheet is in the current week (Mon-Sun)
    const isNewThisWeek = isDateInCurrentWeek(firstDate);
    // A client is "New This Month" if their very first record is in the current calendar month
    const isNewThisMonth = isDateInCurrentMonth(firstDate);

    // Active this week: has logged at least 1 record in the past 7 days
    const isActiveThisWeek = isDateWithinPastDays(latestDate, 7);
    // Recent activity: logged within the past 3 days
    const hasRecentActivity = isDateWithinPastDays(latestDate, 3);
    // Inactive: latest log is older than 7 days
    const hasNoRecentActivity = !isActiveThisWeek;

    // Weight progress (only if weight exists in records)
    const recordsWithWeight = clientRecs.filter(r => r.weightKg !== undefined && r.weightKg > 0);
    let weightChange: number | undefined = undefined;
    if (recordsWithWeight.length >= 2) {
      const startW = recordsWithWeight[0].weightKg!;
      const endW = recordsWithWeight[recordsWithWeight.length - 1].weightKg!;
      weightChange = Number((endW - startW).toFixed(1));
    }

    // Steps average (only if steps logged)
    const recordsWithSteps = clientRecs.filter(r => r.steps !== undefined);
    const avgSteps = recordsWithSteps.length > 0 
      ? Math.round(recordsWithSteps.reduce((acc, r) => acc + r.steps!, 0) / recordsWithSteps.length) 
      : undefined;

    // Sleep average (only if sleep logged)
    const recordsWithSleep = clientRecs.filter(r => r.sleepDurationHours !== undefined);
    const avgSleep = recordsWithSleep.length > 0
      ? Number((recordsWithSleep.reduce((acc, r) => acc + r.sleepDurationHours!, 0) / recordsWithSleep.length).toFixed(1))
      : undefined;

    clientSummaries.push({
      name: clientName,
      firstDate,
      latestDate,
      totalRecords: clientRecs.length,
      isNewThisWeek,
      isNewThisMonth,
      isActiveThisWeek,
      hasRecentActivity,
      hasNoRecentActivity,
      latestRecord: latestRec,
      firstRecord: firstRec,
      weightChange,
      avgSteps,
      avgSleep,
      latestBp: latestRec.bloodPressure,
      latestDiet: latestRec.dietFollowed,
      latestWorkout: latestRec.workout,
      latestNotes: latestRec.notes || latestRec.status
    });
  });

  // Sort summaries alphabetically or by latest date
  clientSummaries.sort((a, b) => b.latestDate.localeCompare(a.latestDate));

  const newClientsThisWeek = clientSummaries.filter(c => c.isNewThisWeek);
  const newClientsThisMonth = clientSummaries.filter(c => c.isNewThisMonth);
  const activeClients = clientSummaries.filter(c => c.isActiveThisWeek);
  const recentActivityClients = clientSummaries.filter(c => c.hasRecentActivity);
  const inactiveClients = clientSummaries.filter(c => c.hasNoRecentActivity);

  return {
    totalClients: clientSummaries.length,
    newClientsThisWeek,
    newClientsThisMonth,
    activeClients,
    recentActivityClients,
    inactiveClients,
    totalRecords: records.length,
    clientSummaries,
    currentWeekLabel
  };
}
