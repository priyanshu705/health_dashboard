import React, { useState, useMemo } from 'react';
import { 
  User, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Footprints, 
  Scale, 
  Heart, 
  Moon, 
  Droplet, 
  Utensils, 
  Dumbbell, 
  ShieldCheck, 
  FileText,
  ChevronDown,
  Table,
  CheckCircle2,
  Info
} from 'lucide-react';
import { DailyHealthRecord, ClientProfileSummary } from '../types';

interface ClientProgressViewProps {
  clientName: string;
  clients: string[];
  onSelectClient: (client: string) => void;
  records: DailyHealthRecord[];
  headers: string[];
  summary?: ClientProfileSummary;
}

export const ClientProgressView: React.FC<ClientProgressViewProps> = ({
  clientName,
  clients,
  onSelectClient,
  records,
  headers,
  summary
}) => {
  // Filter records strictly for this client
  const clientRecords = useMemo(() => {
    if (clientName === 'ALL') return records;
    return records.filter(r => r.clientName.toLowerCase() === clientName.toLowerCase());
  }, [records, clientName]);

  // Sort chronologically
  const sortedRecords = useMemo(() => {
    return [...clientRecords].sort((a, b) => a.date.localeCompare(b.date));
  }, [clientRecords]);

  const totalLogs = sortedRecords.length;
  const firstRecord = sortedRecords[0];
  const latestRecord = sortedRecords[sortedRecords.length - 1];

  // Dynamic check for column existence in the Sheet
  const hasColumn = (keywords: string[]) => {
    return headers.some(h => {
      const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      return keywords.some(k => clean.includes(k.toLowerCase().replace(/[^a-z0-9]/g, '')));
    });
  };

  const hasWeight = hasColumn(['weight', 'wt', 'kg']);
  const hasSteps = hasColumn(['step', 'steps', 'stepcount']);
  const hasSleep = hasColumn(['sleep', 'sleephours', 'sleepduration']);
  const hasHr = hasColumn(['restinghr', 'rhr', 'heartrate', 'pulse']);
  const hasBp = hasColumn(['bloodpressure', 'bp']);
  const hasWater = hasColumn(['water', 'waterintake', 'hydration']);
  const hasDiet = hasColumn(['diet', 'nutrition', 'mealplan']);
  const hasWorkout = hasColumn(['workout', 'exercise', 'activity', 'gym']);
  const hasRemarks = hasColumn(['remarks', 'notes', 'comment', 'feedback']);

  // Weight progression calculation
  const weightRecords = sortedRecords.filter(r => r.weightKg !== undefined && r.weightKg > 0);
  const startWeight = weightRecords.length > 0 ? weightRecords[0].weightKg : undefined;
  const currentWeight = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1].weightKg : undefined;
  const weightDelta = (startWeight !== undefined && currentWeight !== undefined && weightRecords.length >= 2)
    ? Number((currentWeight - startWeight).toFixed(1))
    : undefined;

  // Steps progression calculation
  const stepsRecords = sortedRecords.filter(r => r.steps !== undefined);
  const avgSteps = stepsRecords.length > 0
    ? Math.round(stepsRecords.reduce((acc, r) => acc + r.steps!, 0) / stepsRecords.length)
    : undefined;
  const latestSteps = latestRecord?.steps;

  // Sleep progression calculation
  const sleepRecords = sortedRecords.filter(r => r.sleepDurationHours !== undefined);
  const avgSleep = sleepRecords.length > 0
    ? Number((sleepRecords.reduce((acc, r) => acc + r.sleepDurationHours!, 0) / sleepRecords.length).toFixed(1))
    : undefined;
  const latestSleep = latestRecord?.sleepDurationHours;

  // Heart rate progression
  const hrRecords = sortedRecords.filter(r => r.restingHeartRate !== undefined);
  const avgHr = hrRecords.length > 0
    ? Math.round(hrRecords.reduce((acc, r) => acc + r.restingHeartRate!, 0) / hrRecords.length)
    : undefined;
  const latestHr = latestRecord?.restingHeartRate;

  // Water progression
  const waterRecords = sortedRecords.filter(r => r.waterIntakeMl !== undefined);
  const avgWaterL = waterRecords.length > 0
    ? Number((waterRecords.reduce((acc, r) => acc + (r.waterIntakeMl! / 1000), 0) / waterRecords.length).toFixed(1))
    : undefined;
  const latestWaterL = latestRecord?.waterIntakeMl ? (latestRecord.waterIntakeMl / 1000).toFixed(1) : undefined;

  if (totalLogs === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 space-y-2">
        <User className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">No records found for &ldquo;{clientName}&rdquo;</h3>
        <p className="text-xs text-slate-400">
          Select another client from the dropdown or verify your connected Google Sheet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Client Profile Card Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Avatar & Identifiers */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-2xl shadow-inner">
              {clientName === 'ALL' ? 'ALL' : clientName[0] || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                  Client Profile &amp; Progress
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 font-mono">
                  Google Sheet Record
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {clientName === 'ALL' ? 'All Clients Aggregated' : clientName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                <span>First Log: <strong className="text-slate-200 font-mono">{firstRecord?.date || '—'}</strong></span>
                <span>•</span>
                <span>Latest Log: <strong className="text-slate-200 font-mono">{latestRecord?.date || '—'}</strong></span>
                <span>•</span>
                <span>Total Logs: <strong className="text-white font-mono">{totalLogs}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Client Switcher */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="relative min-w-[200px]">
              <select
                value={clientName}
                onChange={(e) => onSelectClient(e.target.value)}
                className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 pr-8 cursor-pointer shadow-inner"
              >
                <option value="ALL">Switch: All Clients</option>
                {clients.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* 2. Dynamic Progress Metrics Grid (ONLY for columns present in Sheet) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Weight Progress (Only if Sheet has Weight) */}
        {hasWeight && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-teal-400" />
                Weight Progression
              </span>
              {weightDelta !== undefined && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  weightDelta <= 0 
                    ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300' 
                    : 'bg-amber-950/70 border-amber-800 text-amber-300'
                }`}>
                  {weightDelta <= 0 ? `${weightDelta} kg` : `+${weightDelta} kg`}
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current</span>
                <span className="text-2xl font-black text-white font-mono">
                  {currentWeight !== undefined ? `${currentWeight} kg` : 'No data available'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Starting</span>
                <span className="text-sm font-semibold text-slate-300 font-mono">
                  {startWeight !== undefined ? `${startWeight} kg` : '—'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              {weightDelta !== undefined ? (
                <span>Recorded over {weightRecords.length} weight entries in Google Sheet.</span>
              ) : (
                <span>Need at least 2 weight entries to calculate delta.</span>
              )}
            </div>
          </div>
        )}

        {/* Steps Progress (Only if Sheet has Steps) */}
        {hasSteps && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-emerald-400" />
                Step Activity Progress
              </span>
              {latestSteps !== undefined && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-mono">
                  Latest: {latestSteps.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Average Steps</span>
                <span className="text-2xl font-black text-white font-mono">
                  {avgSteps !== undefined ? avgSteps.toLocaleString() : 'No data available'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Logged Days</span>
                <span className="text-sm font-semibold text-slate-300 font-mono">
                  {stepsRecords.length} days
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              Total steps walked: {stepsRecords.reduce((s, r) => s + (r.steps || 0), 0).toLocaleString()}
            </div>
          </div>
        )}

        {/* Blood Pressure Progress (Only if Sheet has BP) */}
        {hasBp && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                Blood Pressure
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-950/70 border border-rose-800 text-rose-300">
                Sheet Logged
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Latest Reading</span>
                <span className="text-2xl font-black text-white font-mono">
                  {latestRecord?.bloodPressure || (latestRecord?.bloodPressureSystolic ? `${latestRecord.bloodPressureSystolic}/${latestRecord.bloodPressureDiastolic}` : 'No data available')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">First Reading</span>
                <span className="text-sm font-semibold text-slate-300 font-mono">
                  {firstRecord?.bloodPressure || '—'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              Tracked across {sortedRecords.filter(r => r.bloodPressure).length} logged BP entries.
            </div>
          </div>
        )}

        {/* Resting Heart Rate (Only if Sheet has RHR) */}
        {hasHr && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                Resting Heart Rate
              </span>
              {latestHr !== undefined && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                  Latest: {latestHr} bpm
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Average Resting HR</span>
                <span className="text-2xl font-black text-white font-mono">
                  {avgHr !== undefined ? `${avgHr} bpm` : 'No data available'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">First Log</span>
                <span className="text-sm font-semibold text-slate-300 font-mono">
                  {firstRecord?.restingHeartRate !== undefined ? `${firstRecord.restingHeartRate} bpm` : '—'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              Resting cardiac rate recorded in client sheet.
            </div>
          </div>
        )}

        {/* Sleep Duration (Only if Sheet has Sleep) */}
        {hasSleep && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-400" />
                Sleep Duration
              </span>
              {latestSleep !== undefined && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-800 text-indigo-300 font-mono">
                  Latest: {latestSleep} hrs
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Average Sleep</span>
                <span className="text-2xl font-black text-white font-mono">
                  {avgSleep !== undefined ? `${avgSleep} hrs` : 'No data available'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">First Log</span>
                <span className="text-sm font-semibold text-slate-300 font-mono">
                  {firstRecord?.sleepDurationHours !== undefined ? `${firstRecord.sleepDurationHours} hrs` : '—'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              Logged across {sleepRecords.length} sleep records.
            </div>
          </div>
        )}

        {/* Water Intake (Only if Sheet has Water) */}
        {hasWater && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-sky-400" />
                Water Intake
              </span>
              {latestWaterL !== undefined && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-950/70 border border-sky-800 text-sky-300 font-mono">
                  Latest: {latestWaterL} L
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Average Intake</span>
                <span className="text-2xl font-black text-white font-mono">
                  {avgWaterL !== undefined ? `${avgWaterL} L` : 'No data available'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Logs</span>
                <span className="text-sm font-semibold text-slate-300 font-mono">
                  {waterRecords.length}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              Hydration logs from client health tracker.
            </div>
          </div>
        )}

      </div>

      {/* 3. Nutrition, Exercise & Latest Remarks */}
      {(hasDiet || hasWorkout || hasRemarks) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {hasDiet && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Utensils className="w-4 h-4" />
                Diet Compliance (Latest)
              </span>
              <p className="text-sm text-white font-medium">
                {latestRecord?.dietFollowed || 'No data available in Sheet'}
              </p>
            </div>
          )}

          {hasWorkout && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4" />
                Workout / Exercise Activity
              </span>
              <p className="text-sm text-white font-medium">
                {latestRecord?.workout || 'No data available in Sheet'}
              </p>
            </div>
          )}

          {hasRemarks && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Doctor / Trainer Remarks
              </span>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                &ldquo;{latestRecord?.notes || latestRecord?.status || 'No data available in Sheet'}&rdquo;
              </p>
            </div>
          )}

        </div>
      )}

      {/* 4. Client Historical Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-400" />
              All Historical Records for {clientName} ({totalLogs})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact historical timeline entries from connected Google Sheet.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[460px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 border-b border-slate-800 shadow-sm">
              <tr>
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Day</th>
                {headers.filter(h => {
                  const l = h.toLowerCase();
                  return !l.includes('client') && !l.includes('date');
                }).map(h => (
                  <th key={h} className="p-3 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
              {[...sortedRecords].reverse().map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 text-white font-semibold whitespace-nowrap">{r.date}</td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">{r.dayOfWeek}</td>
                  {headers.filter(h => {
                    const l = h.toLowerCase();
                    return !l.includes('client') && !l.includes('date');
                  }).map(h => {
                    const val = r.rawValues[h] ?? '—';
                    return (
                      <td key={h} className="p-3 text-slate-300 whitespace-nowrap">
                        {val === '' ? '—' : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
