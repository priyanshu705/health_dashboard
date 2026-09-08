import React from 'react';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  FileSpreadsheet, 
  Activity, 
  Calendar,
  Sparkles,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { DailyHealthRecord, ClientProfileSummary } from '../types';
import { ManagementOverviewStats } from '../lib/clientAnalytics';

interface ManagementOverviewProps {
  stats: ManagementOverviewStats;
  headers: string[];
  records: DailyHealthRecord[];
  onSelectClient: (clientName: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const ManagementOverview: React.FC<ManagementOverviewProps> = ({
  stats,
  headers,
  records,
  onSelectClient,
  onNavigateTab
}) => {
  if (stats.totalClients === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 space-y-3">
        <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-white">No client data available in Google Sheet.</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please connect your Google Sheet or paste a spreadsheet link to automatically load clients, health metrics, and reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Management KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Clients */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Clients</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.totalClients}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Unique in Sheet</span>
          </div>
        </div>

        {/* New This Week */}
        <div 
          onClick={() => onNavigateTab('new-clients')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm cursor-pointer hover:border-emerald-500/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">New This Week</span>
            <UserPlus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.newClientsThisWeek.length}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Mon → Sun period</span>
          </div>
        </div>

        {/* New This Month */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">New This Month</span>
            <Calendar className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.newClientsThisMonth.length}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Joined this month</span>
          </div>
        </div>

        {/* Active Clients */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Active Clients</span>
            <UserCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.activeClients.length}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Logged in last 7d</span>
          </div>
        </div>

        {/* Recent Activity (Last 3d) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Recent (≤3d)</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.recentActivityClients.length}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Updated recently</span>
          </div>
        </div>

        {/* Inactive / Update Pending */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">No Recent Log</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{stats.inactiveClients.length}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">&gt;7d since update</span>
          </div>
        </div>

      </div>

      {/* SECTION: NEW CLIENTS THIS WEEK SPOTLIGHT */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                New Clients This Week ({stats.newClientsThisWeek.length})
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                [{stats.currentWeekLabel}]
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Clients whose first recorded entry in the Google Sheet falls within the current Monday → Sunday week.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('new-clients')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All New Clients</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.newClientsThisWeek.length === 0 ? (
          <div className="p-6 bg-slate-950/70 rounded-xl border border-slate-800/80 text-center text-xs text-slate-400">
            No new clients joined during this calendar week ({stats.currentWeekLabel}).
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {stats.newClientsThisWeek.map((client) => (
              <div
                key={client.name}
                onClick={() => {
                  onSelectClient(client.name);
                  onNavigateTab('client-progress');
                }}
                className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                        Joined {client.firstDate}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {client.name}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {client.totalRecords} {client.totalRecords === 1 ? 'log' : 'logs'}
                    </span>
                  </div>

                  {/* Status & Latest Info */}
                  <div className="mt-3 space-y-1 text-xs text-slate-300">
                    {client.latestRecord?.weightKg && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Latest Weight:</span>
                        <span className="text-white font-mono font-semibold">{client.latestRecord.weightKg} kg</span>
                      </div>
                    )}
                    {client.latestRecord?.steps !== undefined && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Latest Steps:</span>
                        <span className="text-white font-mono font-semibold">{client.latestRecord.steps.toLocaleString()}</span>
                      </div>
                    )}
                    {client.latestRecord?.bloodPressure && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Blood Pressure:</span>
                        <span className="text-white font-mono font-semibold">{client.latestRecord.bloodPressure}</span>
                      </div>
                    )}
                    {client.latestNotes && (
                      <p className="text-[11px] text-slate-400 italic truncate mt-1" title={client.latestNotes}>
                        &ldquo;{client.latestNotes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Open Client Report</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION: ALL CLIENTS ROSTER TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              All Clients in Google Sheet ({stats.totalClients})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any client to view their individual health metrics, daily logs, and historical progress.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="p-3 font-semibold">Client Name</th>
                <th className="p-3 font-semibold">First Log (Join Date)</th>
                <th className="p-3 font-semibold">Latest Log</th>
                <th className="p-3 font-semibold">Total Logs</th>
                <th className="p-3 font-semibold">Activity Status</th>
                <th className="p-3 font-semibold">Latest Metrics (from Sheet)</th>
                <th className="p-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {stats.clientSummaries.map((client) => {
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
                    <td className="p-3 font-bold text-white group-hover:text-emerald-300 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                          {client.name[0] || 'C'}
                        </div>
                        <span>{client.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono whitespace-nowrap">
                      {client.firstDate}
                    </td>
                    <td className="p-3 text-slate-300 font-mono whitespace-nowrap">
                      {client.latestDate}
                    </td>
                    <td className="p-3 font-mono text-white whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {client.totalRecords}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {client.isNewThisWeek ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          New This Week
                        </span>
                      ) : client.isActiveThisWeek ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                          Active (≤7d)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          Update Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-300">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                        {latest?.weightKg && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-teal-300 border border-slate-800">
                            {latest.weightKg} kg
                          </span>
                        )}
                        {latest?.steps !== undefined && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-emerald-300 border border-slate-800">
                            {latest.steps.toLocaleString()} steps
                          </span>
                        )}
                        {latest?.bloodPressure && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-rose-300 border border-slate-800">
                            BP: {latest.bloodPressure}
                          </span>
                        )}
                        {latest?.sleepDurationHours !== undefined && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800">
                            {latest.sleepDurationHours}h sleep
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <span className="text-xs font-semibold text-emerald-400 group-hover:underline flex items-center justify-end gap-1">
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
  );
};
