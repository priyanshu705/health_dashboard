import React from 'react';
import { 
  Scale, 
  Footprints, 
  Heart, 
  Activity, 
  Moon, 
  Droplet, 
  Utensils, 
  Dumbbell, 
  FileText,
  Sparkles,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { DailyHealthRecord } from '../types';

interface DynamicSheetMetricCardsProps {
  records: DailyHealthRecord[];
  headers: string[];
  selectedClient: string;
}

export const DynamicSheetMetricCards: React.FC<DynamicSheetMetricCardsProps> = ({
  records,
  headers,
  selectedClient
}) => {
  if (records.length === 0) return null;

  // Filter for client
  const clientRecs = selectedClient === 'ALL' 
    ? records 
    : records.filter(r => r.clientName.toLowerCase() === selectedClient.toLowerCase());

  if (clientRecs.length === 0) return null;

  // Chronologically sorted
  const sorted = [...clientRecs].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : undefined;

  // Helper to check header presence
  const hasCol = (keywords: string[]) => {
    return headers.some(h => {
      const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      return keywords.some(k => clean.includes(k.toLowerCase().replace(/[^a-z0-9]/g, '')));
    });
  };

  const hasWeight = hasCol(['weight', 'wt', 'kg']);
  const hasSteps = hasCol(['step', 'steps', 'stepcount']);
  const hasBp = hasCol(['bloodpressure', 'bp']);
  const hasHr = hasCol(['restinghr', 'rhr', 'heartrate', 'pulse']);
  const hasSleep = hasCol(['sleep', 'sleepduration', 'sleephours']);
  const hasWater = hasCol(['water', 'waterintake', 'hydration']);

  // Weight calculations
  const weightRecs = sorted.filter(r => r.weightKg !== undefined && r.weightKg > 0);
  const latestWeight = latest.weightKg;
  const prevWeight = prev?.weightKg;
  const weightDelta = (latestWeight !== undefined && prevWeight !== undefined) 
    ? Number((latestWeight - prevWeight).toFixed(1)) 
    : undefined;

  // Steps calculations
  const stepsRecs = sorted.filter(r => r.steps !== undefined);
  const latestSteps = latest.steps;
  const avgSteps = stepsRecs.length > 0 
    ? Math.round(stepsRecs.reduce((a, b) => a + b.steps!, 0) / stepsRecs.length) 
    : undefined;
  const peakSteps = stepsRecs.length > 0 ? Math.max(...stepsRecs.map(r => r.steps!)) : undefined;

  // Blood Pressure
  const latestBp = latest.bloodPressure || (latest.bloodPressureSystolic ? `${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic}` : undefined);
  const prevBp = prev?.bloodPressure;

  // Heart Rate
  const hrRecs = sorted.filter(r => r.restingHeartRate !== undefined);
  const latestHr = latest.restingHeartRate;
  const avgHr = hrRecs.length > 0 
    ? Math.round(hrRecs.reduce((a, b) => a + b.restingHeartRate!, 0) / hrRecs.length) 
    : undefined;

  // Sleep
  const sleepRecs = sorted.filter(r => r.sleepDurationHours !== undefined);
  const latestSleep = latest.sleepDurationHours;
  const avgSleep = sleepRecs.length > 0 
    ? Number((sleepRecs.reduce((a, b) => a + b.sleepDurationHours!, 0) / sleepRecs.length).toFixed(1)) 
    : undefined;

  // Water
  const waterRecs = sorted.filter(r => r.waterIntakeMl !== undefined && r.waterIntakeMl > 0);
  const latestWater = latest.waterIntakeMl ? (latest.waterIntakeMl / 1000).toFixed(1) : undefined;
  const avgWater = waterRecs.length > 0 
    ? Number((waterRecs.reduce((a, b) => a + (b.waterIntakeMl! / 1000), 0) / waterRecs.length).toFixed(1)) 
    : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Detected Google Sheet Metrics
        </h3>
        <span className="text-[11px] text-slate-500 font-mono">
          Adapts strictly to sheet columns
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        
        {/* WEIGHT CARD (ONLY if Weight exists) */}
        {hasWeight && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" />
                Weight
              </span>
              {weightDelta !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${weightDelta <= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                  {weightDelta <= 0 ? `${weightDelta} kg` : `+${weightDelta} kg`}
                </span>
              )}
            </div>

            <div>
              <div className="text-xl font-black text-white font-mono">
                {latestWeight !== undefined ? `${latestWeight} kg` : 'Not available'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {prevWeight !== undefined ? `Prev: ${prevWeight} kg` : 'First entry'}
              </div>
            </div>
          </div>
        )}

        {/* STEPS CARD (ONLY if Steps exists) */}
        {hasSteps && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Footprints className="w-3.5 h-3.5" />
                Daily Steps
              </span>
              {peakSteps !== undefined && (
                <span className="text-[10px] text-slate-500 font-mono">
                  Peak: {peakSteps.toLocaleString()}
                </span>
              )}
            </div>

            <div>
              <div className="text-xl font-black text-white font-mono">
                {latestSteps !== undefined ? latestSteps.toLocaleString() : 'Not available'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {avgSteps !== undefined ? `Avg: ${avgSteps.toLocaleString()}` : '—'}
              </div>
            </div>
          </div>
        )}

        {/* BLOOD PRESSURE CARD (ONLY if BP exists) */}
        {hasBp && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                Blood Pressure
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Latest
              </span>
            </div>

            <div>
              <div className="text-xl font-black text-white font-mono">
                {latestBp || 'Not available'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {prevBp ? `Prev: ${prevBp}` : 'Sheet recorded'}
              </div>
            </div>
          </div>
        )}

        {/* RESTING HEART RATE CARD (ONLY if HR exists) */}
        {hasHr && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                Heart Rate
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                bpm
              </span>
            </div>

            <div>
              <div className="text-xl font-black text-white font-mono">
                {latestHr !== undefined ? `${latestHr} bpm` : 'Not available'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {avgHr !== undefined ? `Avg: ${avgHr} bpm` : '—'}
              </div>
            </div>
          </div>
        )}

        {/* SLEEP CARD (ONLY if Sleep exists) */}
        {hasSleep && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                <Moon className="w-3.5 h-3.5" />
                Sleep Duration
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Hours
              </span>
            </div>

            <div>
              <div className="text-xl font-black text-white font-mono">
                {latestSleep !== undefined ? `${latestSleep} hrs` : 'Not available'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {avgSleep !== undefined ? `Avg: ${avgSleep} hrs` : '—'}
              </div>
            </div>
          </div>
        )}

        {/* WATER INTAKE CARD (ONLY if Water exists) */}
        {hasWater && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5" />
                Water Intake
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Liters
              </span>
            </div>

            <div>
              <div className="text-xl font-black text-white font-mono">
                {latestWater !== undefined ? `${latestWater} L` : 'Not available'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {avgWater !== undefined ? `Avg: ${avgWater} L` : '—'}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
