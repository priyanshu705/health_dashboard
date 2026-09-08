import React from 'react';
import { 
  Heart, 
  Flame, 
  Footprints, 
  Moon, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  ArrowUpRight, 
  ShieldCheck 
} from 'lucide-react';
import { DailyHealthRecord, RealtimePulse } from '../types';

interface VitalityHeroProps {
  todayRecord: DailyHealthRecord;
  realtimePulse: RealtimePulse;
  sevenDayAvgVitality: number;
}

export const VitalityHero: React.FC<VitalityHeroProps> = ({
  todayRecord,
  realtimePulse,
  sevenDayAvgVitality
}) => {
  const vitality = todayRecord.vitalityScore;
  const stepPercent = Math.min(100, Math.round((realtimePulse.liveStepsToday / todayRecord.stepGoal) * 100));

  const getVitalityTier = (score: number) => {
    if (score >= 88) return { label: 'Optimal Peak Vitality', color: 'text-emerald-400', badgeBg: 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300' };
    if (score >= 75) return { label: 'High Readiness & Balance', color: 'text-teal-400', badgeBg: 'bg-teal-950/60 border-teal-700/60 text-teal-300' };
    if (score >= 60) return { label: 'Moderate Energy Recovery', color: 'text-amber-400', badgeBg: 'bg-amber-950/60 border-amber-700/60 text-amber-300' };
    return { label: 'Recharge & Rest Advised', color: 'text-rose-400', badgeBg: 'bg-rose-950/60 border-rose-700/60 text-rose-300' };
  };

  const tier = getVitalityTier(vitality);
  const strokeDashoffset = 440 - (440 * vitality) / 100;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 p-5 sm:p-7 shadow-xl">
      {/* Subtle background ambient glows */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
        
        {/* Left: Overall Vitality Composite Gauge */}
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
          
          {/* Circular SVG Gauge */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-36 h-36 sm:w-40 sm:h-40 transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="70"
                className="stroke-slate-800"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r="70"
                className="stroke-emerald-400 transition-all duration-1000 ease-out"
                strokeWidth="12"
                strokeDasharray="440"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {vitality}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Vitality Score
              </span>
            </div>
          </div>

          {/* Headline and Readiness */}
          <div className="flex flex-col text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${tier.badgeBg}`}>
                <Sparkles className="w-3.5 h-3.5" />
                {tier.label}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                7-Day Avg: <strong className="text-slate-200">{sevenDayAvgVitality}</strong>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Today&apos;s Vitality &amp; Recovery
            </h2>
            <p className="text-sm text-slate-300 max-w-md leading-relaxed">
              Calculated real-time across sleep stages, autonomic HRV, resting heart rate, active movement, and hydration balance.
            </p>
            <div className="text-xs text-emerald-400/90 font-medium flex items-center justify-center sm:justify-start gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Source: Read-Only Google Sheet • Auto-updating
            </div>
          </div>

        </div>

        {/* Right: 4 Real-time Core Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
          
          {/* Live Heart Rate */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Heart Rate</span>
              <div className="relative">
                <Heart className={`w-4 h-4 text-rose-400 ${realtimePulse.isPulsing ? 'scale-125' : 'scale-100'} transition-transform duration-300`} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-white font-mono">
                {realtimePulse.currentHeartRate}
              </span>
              <span className="text-xs text-rose-400 font-semibold">BPM</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>Resting: {todayRecord.restingHeartRate} bpm</span>
            </div>
          </div>

          {/* Live Steps Today */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Steps Today</span>
              <Footprints className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-white font-mono">
                {realtimePulse.liveStepsToday.toLocaleString()}
              </span>
            </div>
            <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${stepPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1">{stepPercent}% of 10k goal</span>
          </div>

          {/* Active Calories */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Active Burn</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-white font-mono">
                {realtimePulse.liveActiveCalories}
              </span>
              <span className="text-xs text-amber-400 font-semibold">kcal</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">
              {todayRecord.distanceKm} km walked
            </span>
          </div>

          {/* Sleep Score */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Sleep Score</span>
              <Moon className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-white font-mono">
                {todayRecord.sleepScore}
              </span>
              <span className="text-xs text-indigo-400 font-semibold">/100</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">
              {todayRecord.sleepDurationHours} hrs ({todayRecord.deepSleepHours}h deep)
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
