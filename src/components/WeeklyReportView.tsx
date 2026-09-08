import React, { useState, useMemo } from 'react';
import { 
  CalendarRange, 
  Users, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  FileSpreadsheet,
  Activity,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { DailyHealthRecord, ClientProfileSummary } from '../types';
import { getCurrentWeekBounds, getWeekBoundsForDate, isDateInWeek, parseSheetDate, formatToYmd } from '../lib/dateUtils';
import { ManagementOverviewStats } from '../lib/clientAnalytics';

interface WeeklyReportViewProps {
  records: DailyHealthRecord[];
  stats: ManagementOverviewStats;
  headers: string[];
  selectedClient?: string;
  onSelectClient: (clientName: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const WeeklyReportView: React.FC<WeeklyReportViewProps> = ({
  records,
  stats,
  headers,
  selectedClient = 'ALL',
  onSelectClient,
  onNavigateTab
}) => {
  const currentWeekBounds = getCurrentWeekBounds();

  // Discover all distinct weeks available in records
  const availableWeeks = useMemo(() => {
    const weekMap = new Map<string, { mondayYmd: string; sundayYmd: string; label: string; count: number }>();
    records.forEach(r => {
      const parsed = parseSheetDate(r.date);
      if (parsed) {
        const bounds = getWeekBoundsForDate(parsed.dateObj);
        const key = bounds.mondayYmd;
        if (!weekMap.has(key)) {
          weekMap.set(key, {
            mondayYmd: bounds.mondayYmd,
            sundayYmd: bounds.sundayYmd,
            label: `${bounds.mondayYmd} to ${bounds.sundayYmd}`,
            count: 0
          });
        }
        weekMap.get(key)!.count++;
      }
    });

    // Ensure current week is in list if not empty
    if (!weekMap.has(currentWeekBounds.mondayYmd)) {
      weekMap.set(currentWeekBounds.mondayYmd, {
        mondayYmd: currentWeekBounds.mondayYmd,
        sundayYmd: currentWeekBounds.sundayYmd,
        label: `${currentWeekBounds.mondayYmd} to ${currentWeekBounds.sundayYmd} (Current Week)`,
        count: 0
      });
    }

    return Array.from(weekMap.values()).sort((a, b) => b.mondayYmd.localeCompare(a.mondayYmd));
  }, [records, currentWeekBounds.mondayYmd, currentWeekBounds.sundayYmd]);

  const [selectedMonday, setSelectedMonday] = useState<string>(() => {
    // If current week has records, default to current week; else first week with records
    const hasCurrent = availableWeeks.find(w => w.mondayYmd === currentWeekBounds.mondayYmd && w.count > 0);
    return hasCurrent ? currentWeekBounds.mondayYmd : (availableWeeks[0]?.mondayYmd || currentWeekBounds.mondayYmd);
  });

  const activeWeek = useMemo(() => {
    const found = availableWeeks.find(w => w.mondayYmd === selectedMonday);
    if (found) return found;
    const parsed = parseSheetDate(selectedMonday);
    if (parsed) {
      const b = getWeekBoundsForDate(parsed.dateObj);
      return { mondayYmd: b.mondayYmd, sundayYmd: b.sundayYmd, label: `${b.mondayYmd} to ${b.sundayYmd}`, count: 0 };
    }
    return { mondayYmd: currentWeekBounds.mondayYmd, sundayYmd: currentWeekBounds.sundayYmd, label: `${currentWeekBounds.mondayYmd} to ${currentWeekBounds.sundayYmd}`, count: 0 };
  }, [selectedMonday, availableWeeks, currentWeekBounds]);

  // Filter records belonging strictly to this selected week (Monday 00:00:00 to Sunday 23:59:59)
  const thisWeekRecords = useMemo(() => {
    return records.filter(r => isDateInWeek(r.date, activeWeek.mondayYmd));
  }, [records, activeWeek.mondayYmd]);

  // Group this week's records by client
  const clientWeekMap = useMemo(() => {
    const map = new Map<string, DailyHealthRecord[]>();
    thisWeekRecords.forEach(r => {
      const c = r.clientName || 'Unknown';
      if (!map.has(c)) map.set(c, []);
      map.get(c)!.push(r);
    });
    return map;
  }, [thisWeekRecords]);

  const totalClientsThisWeek = clientWeekMap.size;
  const totalLogsThisWeek = thisWeekRecords.length;

  // New clients whose first-ever record in the sheet was during this week
  const newClientsThisSelectedWeek = useMemo(() => {
    return stats.clientSummaries.filter(c => isDateInWeek(c.firstDate, activeWeek.mondayYmd));
  }, [stats.clientSummaries, activeWeek.mondayYmd]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-6">
      
      {/* Header Banner with Week Selector */}
      <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                Weekly Performance Report (Saptahik Report)
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">
                {activeWeek.mondayYmd} → {activeWeek.sundayYmd}
              </span>
              {selectedClient !== 'ALL' && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Client: {selectedClient}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
              Weekly Calendar Summary (Monday → Sunday)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Calculated dynamically from Google Sheet entries strictly between Monday 00:00:00 and Sunday 23:59:59.
            </p>
          </div>

          {/* Week Selector Dropdown */}
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <CalendarRange className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={selectedMonday}
              onChange={(e) => setSelectedMonday(e.target.value)}
              className="bg-transparent text-emerald-300 font-mono text-xs focus:outline-none cursor-pointer"
            >
              {availableWeeks.map(w => (
                <option key={w.mondayYmd} value={w.mondayYmd} className="bg-slate-900 text-slate-200">
                  Week: {w.mondayYmd} to {w.sundayYmd} ({w.count} logs)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5 Key Metric Cards for THIS WEEK */}
      <div className="p-5 sm:p-6 space-y-6">
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          
          {/* 1. Total Clients Recorded This Week */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Clients Logged
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {totalClientsThisWeek}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Of {stats.totalClients} total clients
            </span>
          </div>

          {/* 2. New Clients This Week (First record in sheet falls in this week) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
              New Clients
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {newClientsThisSelectedWeek.length}
            </div>
            <span className="text-[10px] text-slate-400 block">
              First log in this week
            </span>
          </div>

          {/* 3. Total Records / Logs */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
              Total Logs
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {totalLogsThisWeek}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Entries in this week
            </span>
          </div>

          {/* 4. Active Clients */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block">
              Active Logs
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {stats.activeClients.length}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Recent activity
            </span>
          </div>

          {/* 5. Clients With No Log This Week */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
              Pending Log
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {Math.max(0, stats.totalClients - totalClientsThisWeek)}
            </div>
            <span className="text-[10px] text-slate-400 block">
              No entry in this week
            </span>
          </div>

        </div>

        {/* Client-Wise Weekly Activity Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Client-Wise Weekly Activity Breakdown
            </h3>
            <span className="text-[11px] text-slate-400">
              Week: {activeWeek.mondayYmd} to {activeWeek.sundayYmd}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3 font-semibold">Client</th>
                  <th className="p-3 font-semibold">This Week Logs</th>
                  <th className="p-3 font-semibold">Latest Date</th>
                  <th className="p-3 font-semibold">Progress (from Sheet Columns)</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
                {stats.clientSummaries.map((client) => {
                  const weekLogs = clientWeekMap.get(client.name) || [];
                  const latest = client.latestRecord;
                  
                  return (
                    <tr 
                      key={client.name}
                      onClick={() => {
                        onSelectClient(client.name);
                        onNavigateTab('client-progress');
                      }}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="p-3 font-bold text-white whitespace-nowrap font-sans">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-xs text-emerald-400">
                            {client.name[0] || 'C'}
                          </div>
                          <span>{client.name}</span>
                          {client.isNewThisWeek && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                              NEW
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          weekLogs.length > 0 
                            ? 'bg-slate-950 text-white border border-slate-800' 
                            : 'bg-amber-950/40 text-amber-400 border border-amber-800/50'
                        }`}>
                          {weekLogs.length} {weekLogs.length === 1 ? 'log' : 'logs'}
                        </span>
                      </td>

                      <td className="p-3 text-slate-300 whitespace-nowrap">
                        {client.latestDate}
                      </td>

                      <td className="p-3 text-slate-300 font-sans">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {client.weightChange !== undefined ? (
                            <span className={`font-mono font-bold ${client.weightChange <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              Weight: {client.weightChange <= 0 ? `${client.weightChange} kg` : `+${client.weightChange} kg`}
                            </span>
                          ) : latest?.weightKg ? (
                            <span className="font-mono text-teal-300">
                              Weight: {latest.weightKg} kg
                            </span>
                          ) : null}

                          {latest?.steps !== undefined && (
                            <span className="font-mono text-slate-300">
                              • Steps: {latest.steps.toLocaleString()}
                            </span>
                          )}

                          {latest?.bloodPressure && (
                            <span className="font-mono text-rose-300">
                              • BP: {latest.bloodPressure}
                            </span>
                          )}

                          {latest?.notes && (
                            <span className="text-slate-400 truncate max-w-xs block italic text-[11px]">
                              ({latest.notes})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        <span className="text-xs font-semibold text-emerald-400 group-hover:underline flex items-center justify-end gap-1">
                          <span>View Report</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
