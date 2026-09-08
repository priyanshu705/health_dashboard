import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  Users, 
  UserPlus, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react';
import { DailyHealthRecord, ClientProfileSummary } from '../types';
import { isDateInMonth, parseSheetDate, formatToYmd } from '../lib/dateUtils';
import { ManagementOverviewStats } from '../lib/clientAnalytics';

interface MonthlyReportViewProps {
  records: DailyHealthRecord[];
  stats: ManagementOverviewStats;
  headers: string[];
  selectedClient?: string;
  onSelectClient: (clientName: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  records,
  stats,
  headers,
  selectedClient = 'ALL',
  onSelectClient,
  onNavigateTab
}) => {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Discover all distinct calendar months available in records
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, { key: string; label: string; count: number }>();
    records.forEach(r => {
      const parsed = parseSheetDate(r.date);
      if (parsed) {
        const key = `${parsed.dateObj.getFullYear()}-${String(parsed.dateObj.getMonth() + 1).padStart(2, '0')}`;
        if (!monthMap.has(key)) {
          const label = parsed.dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
          monthMap.set(key, { key, label, count: 0 });
        }
        monthMap.get(key)!.count++;
      }
    });

    // Ensure current month is present
    if (!monthMap.has(currentMonthKey)) {
      const label = now.toLocaleString('default', { month: 'long', year: 'numeric' });
      monthMap.set(currentMonthKey, { key: currentMonthKey, label: `${label} (Current)`, count: 0 });
    }

    return Array.from(monthMap.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [records, currentMonthKey]);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    const hasCurrent = availableMonths.find(m => m.key === currentMonthKey && m.count > 0);
    return hasCurrent ? currentMonthKey : (availableMonths[0]?.key || currentMonthKey);
  });

  const activeMonthInfo = useMemo(() => {
    const found = availableMonths.find(m => m.key === selectedMonthKey);
    if (found) return found;
    return { key: selectedMonthKey, label: selectedMonthKey, count: 0 };
  }, [selectedMonthKey, availableMonths]);

  // Filter records belonging strictly to this calendar month (e.g. 01/09 to 30/09, 01/10 excluded)
  const thisMonthRecords = useMemo(() => {
    return records.filter(r => isDateInMonth(r.date, selectedMonthKey));
  }, [records, selectedMonthKey]);

  // Group this month's records by client
  const clientMonthMap = useMemo(() => {
    const map = new Map<string, DailyHealthRecord[]>();
    thisMonthRecords.forEach(r => {
      const c = r.clientName || 'Unknown';
      if (!map.has(c)) map.set(c, []);
      map.get(c)!.push(r);
    });
    return map;
  }, [thisMonthRecords]);

  const totalClientsThisMonth = clientMonthMap.size;
  const totalLogsThisMonth = thisMonthRecords.length;

  // New clients whose earliest record in the entire sheet falls in this selected month
  const newClientsThisSelectedMonth = useMemo(() => {
    return stats.clientSummaries.filter(c => isDateInMonth(c.firstDate, selectedMonthKey));
  }, [stats.clientSummaries, selectedMonthKey]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-6">
      
      {/* Header Banner with Month Selector */}
      <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-teal-400">
                Monthly Performance Report (Masik Report)
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">
                {activeMonthInfo.label}
              </span>
              {selectedClient !== 'ALL' && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
                    Client: {selectedClient}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
              Monthly Health Tracking Summary
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Evaluated strictly from dates in Google Sheet falling inside {activeMonthInfo.label} (calendar month).
            </p>
          </div>

          {/* Month Selector Dropdown */}
          <div className="flex items-center gap-2 text-xs font-mono text-teal-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="bg-transparent text-teal-300 font-mono text-xs focus:outline-none cursor-pointer"
            >
              {availableMonths.map(m => (
                <option key={m.key} value={m.key} className="bg-slate-900 text-slate-200">
                  {m.label} ({m.count} logs)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Monthly KPI Stats */}
      <div className="p-5 sm:p-6 space-y-6">
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Clients Logged (Month)
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {totalClientsThisMonth}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Active in {activeMonthInfo.label}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block">
              New Clients (Month)
            </span>
            <div className="text-2xl font-black text-teal-400 font-mono">
              {newClientsThisSelectedMonth.length}
            </div>
            <span className="text-[10px] text-slate-400 block">
              First joined in {activeMonthInfo.label}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
              Total Month Entries
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {totalLogsThisMonth}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Rows logged in Sheet
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
              Overall Total Clients
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {stats.totalClients}
            </div>
            <span className="text-[10px] text-slate-400 block">
              In entire tracker
            </span>
          </div>

        </div>

        {/* Client-Wise Monthly Activity Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              Client Monthly Activity Breakdown
            </h3>
            <span className="text-[11px] text-slate-400">
              Only records from {activeMonthInfo.label}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3 font-semibold">Client Name</th>
                  <th className="p-3 font-semibold">First Log Date</th>
                  <th className="p-3 font-semibold">Month Logs</th>
                  <th className="p-3 font-semibold">Total Lifetime Logs</th>
                  <th className="p-3 font-semibold">Weight Change (Sheet)</th>
                  <th className="p-3 font-semibold">Avg Steps (Sheet)</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
                {stats.clientSummaries.map((client) => {
                  const monthLogs = clientMonthMap.get(client.name) || [];
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
                          <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-xs text-teal-400">
                            {client.name[0] || 'C'}
                          </div>
                          <span>{client.name}</span>
                          {client.isNewThisMonth && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-950 text-teal-300 border border-teal-800 font-mono">
                              NEW THIS MONTH
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-slate-400 whitespace-nowrap">
                        {client.firstDate}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          monthLogs.length > 0 
                            ? 'bg-slate-950 text-teal-300 border border-slate-800' 
                            : 'bg-slate-950/40 text-slate-500 border border-slate-900'
                        }`}>
                          {monthLogs.length} logs
                        </span>
                      </td>

                      <td className="p-3 text-white whitespace-nowrap">
                        {client.totalRecords}
                      </td>

                      <td className="p-3 whitespace-nowrap font-sans">
                        {client.weightChange !== undefined ? (
                          <span className={`font-mono font-bold ${client.weightChange <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {client.weightChange <= 0 ? `${client.weightChange} kg` : `+${client.weightChange} kg`}
                          </span>
                        ) : client.latestRecord?.weightKg ? (
                          <span className="text-slate-400 font-mono">
                            {client.latestRecord.weightKg} kg (current)
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {client.avgSteps !== undefined ? (
                          <span className="text-slate-200">
                            {client.avgSteps.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="p-3 text-right whitespace-nowrap font-sans">
                        <span className="text-xs font-semibold text-teal-400 group-hover:underline flex items-center justify-end gap-1">
                          <span>Report</span>
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
