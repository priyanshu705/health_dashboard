import React, { useState } from 'react';
import { 
  UserPlus, 
  Calendar, 
  FileText, 
  ChevronRight, 
  Sparkles, 
  Activity, 
  Footprints, 
  Scale, 
  Heart,
  Clock
} from 'lucide-react';
import { ClientProfileSummary } from '../types';

interface NewClientsViewProps {
  newThisWeek: ClientProfileSummary[];
  newThisMonth: ClientProfileSummary[];
  currentWeekLabel: string;
  onSelectClient: (clientName: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const NewClientsView: React.FC<NewClientsViewProps> = ({
  newThisWeek,
  newThisMonth,
  currentWeekLabel,
  onSelectClient,
  onNavigateTab
}) => {
  const [activeFilter, setActiveFilter] = useState<'week' | 'month'>('week');
  const activeList = activeFilter === 'week' ? newThisWeek : newThisMonth;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
              Client Acquisition Analytics
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              From Google Sheet Dates
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
            New Clients Roster
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Clients whose first health log in the spreadsheet falls within the active period.
          </p>
        </div>

        {/* Filter Toggle: This Week vs This Month */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveFilter('week')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === 'week'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            This Week ({newThisWeek.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('month')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === 'month'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            This Month ({newThisMonth.length})
          </button>
        </div>
      </div>

      {/* Week Notice */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
        <span className="text-slate-400">
          Showing new clients for: <strong className="text-white font-mono">{activeFilter === 'week' ? `Week of ${currentWeekLabel} (Mon → Sun)` : 'Current Calendar Month'}</strong>
        </span>
        <span className="text-emerald-400 font-semibold font-mono">
          {activeList.length} client{activeList.length === 1 ? '' : 's'} identified
        </span>
      </div>

      {/* Client Cards Grid */}
      {activeList.length === 0 ? (
        <div className="p-12 text-center text-slate-500 space-y-2">
          <UserPlus className="w-10 h-10 text-slate-700 mx-auto" />
          <h4 className="text-sm font-bold text-white">No new clients found in this period</h4>
          <p className="text-xs text-slate-400">
            No entries have their initial log date within {activeFilter === 'week' ? `the week (${currentWeekLabel})` : 'this month'}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeList.map((client) => {
            const latest = client.latestRecord;
            return (
              <div
                key={client.name}
                onClick={() => {
                  onSelectClient(client.name);
                  onNavigateTab('client-progress');
                }}
                className="p-5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        First Log: {client.firstDate}
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {client.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Latest log: {client.latestDate}
                      </span>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                      {client.totalRecords} {client.totalRecords === 1 ? 'log' : 'logs'}
                    </span>
                  </div>

                  {/* Health Metrics Strip from Sheet */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-xs">
                    {latest?.weightKg && (
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Weight</span>
                        <span className="font-bold text-teal-300 font-mono">{latest.weightKg} kg</span>
                      </div>
                    )}
                    {latest?.steps !== undefined && (
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Steps</span>
                        <span className="font-bold text-white font-mono">{latest.steps.toLocaleString()}</span>
                      </div>
                    )}
                    {latest?.bloodPressure && (
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                        <span className="font-bold text-rose-300 font-mono">{latest.bloodPressure}</span>
                      </div>
                    )}
                    {latest?.sleepDurationHours !== undefined && (
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Sleep</span>
                        <span className="font-bold text-indigo-300 font-mono">{latest.sleepDurationHours} hrs</span>
                      </div>
                    )}
                  </div>

                  {/* Notes & Status */}
                  {(latest?.notes || latest?.dietFollowed) && (
                    <div className="text-xs text-slate-300 bg-slate-900/40 p-2 rounded-lg border border-slate-850">
                      <p className="line-clamp-2 italic text-slate-400 text-[11px]">
                        &ldquo;{latest.notes || latest.dietFollowed}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <span>View Full Client Progress</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
