import React from 'react';
import { 
  Heart, 
  Activity, 
  Moon, 
  Droplet, 
  Footprints, 
  Gauge, 
  Smile, 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { DailyHealthRecord, RealtimePulse } from '../types';

interface MetricCardsGridProps {
  todayRecord: DailyHealthRecord;
  realtimePulse: RealtimePulse;
  sevenDayAvgSteps: number;
  sevenDayAvgSleep: number;
}

export const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({
  todayRecord,
  realtimePulse,
  sevenDayAvgSteps,
  sevenDayAvgSleep,
}) => {
  // Blood pressure evaluation
  const getBpStatus = (sys: number, dia: number) => {
    if (sys <= 120 && dia <= 80) return { label: 'Optimal', color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800' };
    if (sys <= 129 && dia <= 80) return { label: 'Elevated', color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-800' };
    return { label: 'Attention', color: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-800' };
  };

  const bpStatus = getBpStatus(todayRecord.bloodPressureSystolic, todayRecord.bloodPressureDiastolic);
  const waterPercent = Math.min(100, Math.round((todayRecord.waterIntakeMl / todayRecord.waterGoalMl) * 100));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      
      {/* 1. Cardiovascular Vital Signs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Cardiovascular Vitals</h3>
                <p className="text-xs text-slate-400">Resting HR, BP &amp; SpO2</p>
              </div>
            </div>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${bpStatus.bg} ${bpStatus.color}`}>
              {bpStatus.label}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 py-2 border-y border-slate-800/80 my-3">
            <div>
              <span className="text-[11px] text-slate-400">Resting HR</span>
              <div className="text-lg font-bold text-white mt-0.5 font-mono">
                {todayRecord.restingHeartRate} <span className="text-xs text-slate-400 font-normal">bpm</span>
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
                <CheckCircle className="w-2.5 h-2.5" /> Healthy
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400">Blood Pressure</span>
              <div className="text-lg font-bold text-white mt-0.5 font-mono">
                {todayRecord.bloodPressureSystolic}/{todayRecord.bloodPressureDiastolic}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">mmHg</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400">Blood Oxygen</span>
              <div className="text-lg font-bold text-white mt-0.5 font-mono">
                {todayRecord.spo2}%
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
                Optimal
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
          <span>Live Pulse: <strong className="text-rose-400 font-mono">{realtimePulse.currentHeartRate} BPM</strong></span>
          <span>Max Today: {todayRecord.maxHeartRate} bpm</span>
        </div>
      </div>

      {/* 2. Autonomic Recovery & HRV */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Autonomic &amp; HRV</h3>
                <p className="text-xs text-slate-400">Nervous system recovery &amp; stress</p>
              </div>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-teal-950/60 border-teal-800 text-teal-300">
              Recovered
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-800/80 my-3">
            <div>
              <span className="text-[11px] text-slate-400">Heart Rate Variability (HRV)</span>
              <div className="text-2xl font-bold text-white mt-0.5 font-mono">
                {todayRecord.hrv} <span className="text-xs text-teal-400 font-normal">ms</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Higher values indicate parasympathetic dominance
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400">Stress Load</span>
              <div className="text-2xl font-bold text-white mt-0.5 font-mono">
                {todayRecord.stressLevel} <span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-teal-400 h-full rounded-full" 
                  style={{ width: `${todayRecord.stressLevel}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
          <span>Readiness status:</span>
          <span className="text-teal-400 font-medium">Ready for high training load</span>
        </div>
      </div>

      {/* 3. Sleep Architecture */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Sleep Architecture</h3>
                <p className="text-xs text-slate-400">Duration &amp; regenerative cycles</p>
              </div>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-indigo-950/60 border-indigo-800 text-indigo-300">
              Score: {todayRecord.sleepScore}
            </span>
          </div>

          <div className="py-2 border-y border-slate-800/80 my-3 space-y-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Total Duration:</span>
              <span className="text-lg font-bold text-white font-mono">
                {todayRecord.sleepDurationHours} <span className="text-xs text-indigo-400 font-normal">hrs</span>
              </span>
            </div>

            {/* Stacked stage bar */}
            <div className="w-full bg-slate-800 rounded-lg h-3 flex overflow-hidden">
              <div 
                className="bg-indigo-600 h-full" 
                style={{ width: `${(todayRecord.deepSleepHours / todayRecord.sleepDurationHours) * 100}%` }}
                title={`Deep Sleep: ${todayRecord.deepSleepHours}h`}
              />
              <div 
                className="bg-indigo-400 h-full" 
                style={{ width: `${(todayRecord.remSleepHours / todayRecord.sleepDurationHours) * 100}%` }}
                title={`REM Sleep: ${todayRecord.remSleepHours}h`}
              />
              <div 
                className="bg-indigo-300/40 h-full" 
                style={{ width: `${(todayRecord.lightSleepHours / todayRecord.sleepDurationHours) * 100}%` }}
                title={`Light Sleep: ${todayRecord.lightSleepHours}h`}
              />
            </div>

            <div className="grid grid-cols-3 text-[11px] text-slate-400 text-center pt-1">
              <div>
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 mr-1"></span>
                Deep: {todayRecord.deepSleepHours}h
              </div>
              <div>
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 mr-1"></span>
                REM: {todayRecord.remSleepHours}h
              </div>
              <div>
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-300/40 mr-1"></span>
                Light: {todayRecord.lightSleepHours}h
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
          <span>7-Day Avg Sleep: {sevenDayAvgSleep.toFixed(1)} hrs</span>
          <span className="text-emerald-400">+35 min vs target</span>
        </div>
      </div>

      {/* 4. Hydration & Fluid Balance */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Daily Hydration</h3>
                <p className="text-xs text-slate-400">Electrolyte &amp; water tracking</p>
              </div>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-cyan-950/60 border-cyan-800 text-cyan-300">
              {waterPercent}% Reached
            </span>
          </div>

          <div className="flex items-center gap-4 py-2 border-y border-slate-800/80 my-3">
            <div className="relative w-12 h-20 bg-slate-800 rounded-xl border border-cyan-500/30 overflow-hidden flex flex-col justify-end p-0.5 shrink-0">
              <div 
                className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-lg transition-all duration-700" 
                style={{ height: `${waterPercent}%` }}
              />
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold text-white font-mono">
                {todayRecord.waterIntakeMl} <span className="text-xs text-cyan-400 font-normal">mL</span>
              </div>
              <p className="text-xs text-slate-400">
                Target: <strong>{todayRecord.waterGoalMl} mL</strong> ({Math.max(0, todayRecord.waterGoalMl - todayRecord.waterIntakeMl)} mL remaining)
              </p>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                <Sparkles className="w-3 h-3" />
                Optimal fluid volume for cognitive focus
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
          <span>Last logged sip:</span>
          <span className="text-slate-300">Synchronized with sheet</span>
        </div>
      </div>

      {/* 5. Physical Activity & Caloric Burn */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Footprints className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Movement &amp; Burn</h3>
                <p className="text-xs text-slate-400">Steps, cadence &amp; active energy</p>
              </div>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-amber-950/60 border-amber-800 text-amber-300">
              {todayRecord.distanceKm} km
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-800/80 my-3">
            <div>
              <span className="text-[11px] text-slate-400">Steps Logged</span>
              <div className="text-2xl font-bold text-white mt-0.5 font-mono">
                {realtimePulse.liveStepsToday.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                7-Day Avg: {sevenDayAvgSteps.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400">Active Energy</span>
              <div className="text-2xl font-bold text-white mt-0.5 font-mono">
                {realtimePulse.liveActiveCalories} <span className="text-xs text-amber-400 font-normal">kcal</span>
              </div>
              <span className="text-[11px] text-emerald-400 mt-1 block">
                Aerobic metabolic zone
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
          <span>Goal Completion:</span>
          <span className="text-amber-400 font-semibold">{Math.round((realtimePulse.liveStepsToday / todayRecord.stepGoal) * 100)}%</span>
        </div>
      </div>

      {/* 6. Metabolic & Wellness Status */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Smile className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Metabolic &amp; Mood</h3>
                <p className="text-xs text-slate-400">Fasting glucose &amp; subjective energy</p>
              </div>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-purple-950/60 border-purple-800 text-purple-300">
              Euglycemic
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-800/80 my-3">
            <div>
              <span className="text-[11px] text-slate-400">Fasting Glucose</span>
              <div className="text-2xl font-bold text-white mt-0.5 font-mono">
                {todayRecord.bloodGlucose} <span className="text-xs text-purple-400 font-normal">mg/dL</span>
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block">
                Normal (70-99 mg/dL)
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400">Energy &amp; Mood</span>
              <div className="text-2xl font-bold text-white mt-0.5 font-mono">
                {todayRecord.moodEnergy} <span className="text-xs text-purple-400 font-normal">/10</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                High focus &amp; vigor
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
          <span>Metabolic Health Score:</span>
          <span className="text-purple-400 font-semibold">96 / 100</span>
        </div>
      </div>

    </div>
  );
};
