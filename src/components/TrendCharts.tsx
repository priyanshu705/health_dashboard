import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Scale, 
  Footprints, 
  Moon, 
  Heart, 
  Droplet, 
  Activity, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { DailyHealthRecord, TimeRange } from '../types';

interface TrendChartsProps {
  records: DailyHealthRecord[];
  headers: string[];
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}

type MetricKey = 'weight' | 'steps' | 'bp' | 'heart' | 'sleep' | 'water';

interface MetricOption {
  key: MetricKey;
  label: string;
  icon: any;
  unit: string;
}

export const TrendCharts: React.FC<TrendChartsProps> = ({
  records,
  headers,
  timeRange,
  setTimeRange
}) => {
  // Sort records chronologically
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  // Detect which metrics actually have at least 1 non-null value in the records
  const availableMetrics = useMemo(() => {
    const list: MetricOption[] = [];
    
    if (sortedRecords.some(r => r.weightKg !== undefined && r.weightKg > 0)) {
      list.push({ key: 'weight', label: 'Weight', icon: Scale, unit: 'kg' });
    }
    if (sortedRecords.some(r => r.steps !== undefined && r.steps > 0)) {
      list.push({ key: 'steps', label: 'Steps', icon: Footprints, unit: 'steps' });
    }
    if (sortedRecords.some(r => r.bloodPressureSystolic !== undefined)) {
      list.push({ key: 'bp', label: 'Blood Pressure', icon: Heart, unit: 'mmHg' });
    }
    if (sortedRecords.some(r => r.restingHeartRate !== undefined)) {
      list.push({ key: 'heart', label: 'Resting HR', icon: Activity, unit: 'bpm' });
    }
    if (sortedRecords.some(r => r.sleepDurationHours !== undefined)) {
      list.push({ key: 'sleep', label: 'Sleep Duration', icon: Moon, unit: 'hrs' });
    }
    if (sortedRecords.some(r => r.waterIntakeMl !== undefined && r.waterIntakeMl > 0)) {
      list.push({ key: 'water', label: 'Water Intake', icon: Droplet, unit: 'L' });
    }

    return list;
  }, [sortedRecords]);

  // Default metric: first available metric
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('steps');
  const activeMetricKey = availableMetrics.some(m => m.key === selectedMetric)
    ? selectedMetric
    : availableMetrics[0]?.key || 'steps';

  // Filter records based on timeframe
  const filteredRecords = useMemo(() => {
    if (timeRange === '7d') return sortedRecords.slice(-7);
    if (timeRange === '14d') return sortedRecords.slice(-14);
    if (timeRange === '30d') return sortedRecords.slice(-30);
    return sortedRecords;
  }, [sortedRecords, timeRange]);

  // Extract valid data points for selected metric
  const validDataPoints = useMemo(() => {
    return filteredRecords
      .map(r => {
        let val: number | undefined = undefined;
        let displayStr = '';

        if (activeMetricKey === 'weight') {
          val = r.weightKg;
          displayStr = val ? `${val} kg` : '';
        } else if (activeMetricKey === 'steps') {
          val = r.steps;
          displayStr = val ? `${val.toLocaleString()} steps` : '';
        } else if (activeMetricKey === 'bp') {
          val = r.bloodPressureSystolic;
          displayStr = r.bloodPressure || (val ? `${val}/${r.bloodPressureDiastolic || ''}` : '');
        } else if (activeMetricKey === 'heart') {
          val = r.restingHeartRate;
          displayStr = val ? `${val} bpm` : '';
        } else if (activeMetricKey === 'sleep') {
          val = r.sleepDurationHours;
          displayStr = val ? `${val} hrs` : '';
        } else if (activeMetricKey === 'water') {
          val = r.waterIntakeMl ? Number((r.waterIntakeMl / 1000).toFixed(1)) : undefined;
          displayStr = val ? `${val} L` : '';
        }

        return {
          date: r.date,
          dayOfWeek: r.dayOfWeek,
          value: val,
          displayStr,
          record: r
        };
      })
      .filter((d): d is { date: string; dayOfWeek: string; value: number; displayStr: string; record: DailyHealthRecord } => 
        d.value !== undefined && !isNaN(d.value)
      );
  }, [filteredRecords, activeMetricKey]);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Insufficient data check (Section 15: If insufficient data exists, show "Not enough data for trend.")
  if (validDataPoints.length < 2) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Trend Analytics</h3>
          </div>
          {availableMetrics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {availableMetrics.map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSelectedMetric(m.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeMetricKey === m.key
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <m.icon className="w-3 h-3" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-10 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">Not enough data for trend.</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            At least 2 historical logged records with {activeMetricKey} values are required in the Google Sheet to plot trend lines.
          </p>
        </div>
      </div>
    );
  }

  // Min, Max, and Avg calculations
  const values = validDataPoints.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const avgVal = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
  const latestPoint = validDataPoints[validDataPoints.length - 1];
  const firstPoint = validDataPoints[0];
  const delta = Number((latestPoint.value - firstPoint.value).toFixed(1));

  // Chart Geometry
  const width = 800;
  const height = 240;
  const padX = 40;
  const padY = 30;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;
  const range = (maxVal - minVal) || 1;

  const pointsString = validDataPoints.map((d, i) => {
    const x = padX + (i / (validDataPoints.length - 1)) * plotW;
    const y = height - padY - ((d.value - minVal) / range) * plotH;
    return `${x},${y}`;
  }).join(' ');

  const activeOption = availableMetrics.find(m => m.key === activeMetricKey);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      
      {/* Chart Header: Metric Switcher & Timeframe Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              {activeOption?.label || 'Health'} Trends Over Time
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({validDataPoints.length} points)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Rendered exclusively from actual Google Sheet historical rows.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {availableMetrics.map(m => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMetric(m.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeMetricKey === m.key
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Metric High/Low/Average Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Latest Logged</span>
          <span className="text-base font-bold text-white font-mono">{latestPoint.displayStr}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Average ({timeRange})</span>
          <span className="text-base font-bold text-emerald-400 font-mono">{avgVal} {activeOption?.unit}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Period Range</span>
          <span className="text-base font-bold text-slate-300 font-mono">{minVal} → {maxVal}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Net Change</span>
          <span className={`text-base font-bold font-mono ${delta <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {delta > 0 ? `+${delta}` : delta} {activeOption?.unit}
          </span>
        </div>
      </div>

      {/* SVG Responsive Trend Visualizer */}
      <div className="w-full bg-slate-950 rounded-xl border border-slate-800/80 p-3 pt-6 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 sm:h-56 overflow-visible">
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={padX} y1={height / 2} x2={width - padX} y2={height / 2} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#334155" />

          {/* Area Fill */}
          <polygon
            points={`${padX},${height - padY} ${pointsString} ${width - padX},${height - padY}`}
            fill="url(#trendGradient)"
          />

          {/* Stroke Line */}
          <polyline
            points={pointsString}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {validDataPoints.map((d, i) => {
            const x = padX + (i / (validDataPoints.length - 1)) * plotW;
            const y = height - padY - ((d.value - minVal) / range) * plotH;
            const isHovered = hoveredIdx === i;

            return (
              <g 
                key={d.date + i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  className={`transition-all ${isHovered ? 'fill-emerald-300 stroke-white' : 'fill-slate-900 stroke-emerald-400'}`}
                  strokeWidth="2"
                />

                {/* X-axis date labels for first, middle, last */}
                {(i === 0 || i === Math.floor(validDataPoints.length / 2) || i === validDataPoints.length - 1) && (
                  <text
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    className="fill-slate-500 text-[10px] font-mono"
                  >
                    {d.date}
                  </text>
                )}

                {/* Hover Tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={Math.max(padX, Math.min(x - 60, width - padX - 120))}
                      y={Math.max(10, y - 35)}
                      width="120"
                      height="26"
                      rx="6"
                      className="fill-slate-900 stroke-slate-700"
                    />
                    <text
                      x={Math.max(padX, Math.min(x - 60, width - padX - 120)) + 60}
                      y={Math.max(10, y - 35) + 16}
                      textAnchor="middle"
                      className="fill-white text-[10px] font-mono font-bold"
                    >
                      {d.date}: {d.displayStr}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

    </div>
  );
};
