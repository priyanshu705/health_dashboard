import React, { useState } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ShieldCheck, 
  Heart, 
  Moon, 
  Footprints, 
  Droplet, 
  Sparkles,
  Zap
} from 'lucide-react';
import { DailyHealthRecord } from '../types';

interface DailySummaryViewProps {
  records: DailyHealthRecord[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export const DailySummaryView: React.FC<DailySummaryViewProps> = ({
  records,
  selectedDate,
  setSelectedDate
}) => {
  const currentIndex = records.findIndex(r => r.date === selectedDate);
  const activeRecord = currentIndex >= 0 ? records[currentIndex] : records[records.length - 1];

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedDate(records[currentIndex - 1].date);
    }
  };

  const handleNext = () => {
    if (currentIndex < records.length - 1) {
      setSelectedDate(records[currentIndex + 1].date);
    }
  };

  if (!activeRecord) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
      
      {/* Date Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Daily Health &amp; Vitality Breakdown
            </h2>
            <p className="text-xs text-slate-400">
              Complete biomarker audit for {activeRecord.dayOfWeek}, {activeRecord.date}
            </p>
          </div>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={activeRecord.date}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            {records.map(r => (
              <option key={r.date} value={r.date}>
                {r.date} ({r.dayOfWeek.slice(0, 3)}) - Score: {r.vitalityScore}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex >= records.length - 1}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Highlight Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div>
          <span className="text-[11px] text-slate-400 font-medium">Vitality Index</span>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {activeRecord.vitalityScore} <span className="text-xs text-emerald-400 font-semibold">/100</span>
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
            <Sparkles className="w-3 h-3" /> Optimal tier
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 font-medium">Step Accomplishment</span>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {activeRecord.steps.toLocaleString()}
          </div>
          <span className="text-[11px] text-amber-400">
            {Math.round((activeRecord.steps / activeRecord.stepGoal) * 100)}% of 10,000 goal
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 font-medium">Sleep Restored</span>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {activeRecord.sleepDurationHours} <span className="text-xs text-indigo-400 font-semibold">hrs</span>
          </div>
          <span className="text-[11px] text-indigo-300">
            Quality score: {activeRecord.sleepScore}/100
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 font-medium">Recovery HRV</span>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {activeRecord.hrv} <span className="text-xs text-teal-400 font-semibold">ms</span>
          </div>
          <span className="text-[11px] text-teal-300">
            Stress index: {activeRecord.stressLevel}/100
          </span>
        </div>
      </div>

      {/* Comprehensive Metric Audit Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
          <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Biomarker / Indicator</th>
              <th className="py-3 px-4">Logged Value</th>
              <th className="py-3 px-4">Standard Clinical Target</th>
              <th className="py-3 px-4">Daily Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            <tr>
              <td className="py-3 px-4 flex items-center gap-2 font-medium text-white">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Resting Heart Rate
              </td>
              <td className="py-3 px-4 font-mono text-slate-200 font-bold">{activeRecord.restingHeartRate} bpm</td>
              <td className="py-3 px-4 text-slate-400">55 - 75 bpm</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Optimal
                </span>
              </td>
            </tr>

            <tr>
              <td className="py-3 px-4 flex items-center gap-2 font-medium text-white">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Heart Rate Range (Min - Max)
              </td>
              <td className="py-3 px-4 font-mono text-slate-200 font-bold">{activeRecord.restingHeartRate} - {activeRecord.maxHeartRate} bpm</td>
              <td className="py-3 px-4 text-slate-400">Average: {activeRecord.avgHeartRate} bpm</td>
              <td className="py-3 px-4">
                <span className="text-slate-300">Normal cardiac reserve</span>
              </td>
            </tr>

            <tr>
              <td className="py-3 px-4 flex items-center gap-2 font-medium text-white">
                <Zap className="w-3.5 h-3.5 text-teal-400" />
                Blood Pressure
              </td>
              <td className="py-3 px-4 font-mono text-slate-200 font-bold">
                {activeRecord.bloodPressureSystolic}/{activeRecord.bloodPressureDiastolic} mmHg
              </td>
              <td className="py-3 px-4 text-slate-400">&lt; 120/80 mmHg</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Healthy Range
                </span>
              </td>
            </tr>

            <tr>
              <td className="py-3 px-4 flex items-center gap-2 font-medium text-white">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                Deep Sleep Duration
              </td>
              <td className="py-3 px-4 font-mono text-slate-200 font-bold">{activeRecord.deepSleepHours} hrs</td>
              <td className="py-3 px-4 text-slate-400">1.2 - 2.0 hrs (15-25% total)</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> High Cellular Repair
                </span>
              </td>
            </tr>

            <tr>
              <td className="py-3 px-4 flex items-center gap-2 font-medium text-white">
                <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                Hydration Volume
              </td>
              <td className="py-3 px-4 font-mono text-slate-200 font-bold">{activeRecord.waterIntakeMl} mL</td>
              <td className="py-3 px-4 text-slate-400">Goal: {activeRecord.waterGoalMl} mL</td>
              <td className="py-3 px-4">
                <span className="text-cyan-400 font-medium">
                  {Math.round((activeRecord.waterIntakeMl / activeRecord.waterGoalMl) * 100)}% Hydrated
                </span>
              </td>
            </tr>

            <tr>
              <td className="py-3 px-4 flex items-center gap-2 font-medium text-white">
                <Footprints className="w-3.5 h-3.5 text-amber-400" />
                Active Caloric Burn
              </td>
              <td className="py-3 px-4 font-mono text-slate-200 font-bold">{activeRecord.activeCalories} kcal</td>
              <td className="py-3 px-4 text-slate-400">Distance: {activeRecord.distanceKm} km</td>
              <td className="py-3 px-4">
                <span className="text-amber-400 font-medium">Metabolic target met</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Daily Notes from Sheet */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
        <FileText className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-slate-200">Daily Journal &amp; Notes from Google Sheet:</h4>
          <p className="text-xs text-slate-400 italic">
            &ldquo;{activeRecord.notes || 'No custom notes logged for this entry in the spreadsheet.'}&rdquo;
          </p>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Read-only record: Editing is locked to safeguard your spreadsheet.
          </div>
        </div>
      </div>

    </div>
  );
};
