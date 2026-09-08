import React from 'react';
import { 
  FileText, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Users,
  Search
} from 'lucide-react';
import { DailyHealthRecord } from '../types';

interface DailyReportViewProps {
  records: DailyHealthRecord[];
  selectedClient: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  headers: string[];
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({
  records,
  selectedClient,
  selectedDate,
  setSelectedDate,
  headers
}) => {
  // All unique dates available in the Sheet
  const availableDates = Array.from(new Set(records.map(r => r.date))).sort();
  
  // Find all records matching the selected date (filtered by client if specific client chosen)
  const dateRecords = records.filter(r => {
    const matchesDate = r.date === selectedDate;
    if (!matchesDate) return false;
    if (selectedClient === 'ALL') return true;
    return r.clientName.toLowerCase() === selectedClient.toLowerCase();
  });

  // Current date navigation (prev/next)
  const currentIdx = availableDates.indexOf(selectedDate);
  const prevDate = currentIdx > 0 ? availableDates[currentIdx - 1] : null;
  const nextDate = currentIdx < availableDates.length - 1 ? availableDates[currentIdx + 1] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-6">
      
      {/* Top Banner with Date Selector and Navigation */}
      <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                Daily Health Report (Dainik Report)
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">
                Exact Google Sheet Records
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
              Entries for Date: {selectedDate || 'No date selected'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Showing all client rows recorded for this exact calendar date in the spreadsheet.
            </p>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800 p-1">
              <button
                type="button"
                onClick={() => prevDate && setSelectedDate(prevDate)}
                disabled={!prevDate}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                title="Previous recorded date"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-white px-2 py-1 focus:outline-none cursor-pointer"
              >
                {availableDates.map(d => (
                  <option key={d} value={d} className="bg-slate-900 text-white font-mono">
                    {d}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => nextDate && setSelectedDate(nextDate)}
                disabled={!nextDate}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                title="Next recorded date"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 sm:p-6 space-y-6">
        
        {dateRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <Calendar className="w-10 h-10 text-slate-700 mx-auto" />
            <h3 className="text-base font-bold text-white">No records found for this date</h3>
            <p className="text-xs text-slate-400">
              There are no rows in the Google Sheet for date <span className="font-mono text-slate-200">{selectedDate}</span>
              {selectedClient !== 'ALL' && ` matching client "${selectedClient}"`}.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Found <strong className="text-white">{dateRecords.length}</strong> client log{dateRecords.length === 1 ? '' : 's'} on {selectedDate}
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                100% Sheet Data Mirror
              </span>
            </div>

            {/* Individual Client Record Cards for this Date */}
            <div className="space-y-4">
              {dateRecords.map((rec, rIdx) => (
                <div 
                  key={rec.id || rIdx}
                  className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-sm"
                >
                  {/* Client Identifier Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                        {rec.clientName[0] || 'C'}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">
                          {rec.clientName}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          Log Date: {rec.date} ({rec.dayOfWeek})
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300">
                      Row #{rIdx + 1}
                    </span>
                  </div>

                  {/* All Headings from Google Sheet for this Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {headers.map((h) => {
                      const val = rec.rawValues[h] ?? '—';
                      return (
                        <div 
                          key={h}
                          className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1"
                        >
                          <span className="text-[10px] font-semibold text-slate-400 block truncate" title={h}>
                            {h}
                          </span>
                          <div className="text-xs font-bold text-white font-mono break-words">
                            {val === '' ? '—' : String(val)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Remarks / Notes callout if available */}
                  {(rec.notes || rec.dietFollowed || rec.workout) && (
                    <div className="pt-2 border-t border-slate-900 text-xs text-slate-300 space-y-1">
                      {rec.dietFollowed && (
                        <div>
                          <strong className="text-slate-400">Diet:</strong> {rec.dietFollowed}
                        </div>
                      )}
                      {rec.workout && (
                        <div>
                          <strong className="text-slate-400">Workout:</strong> {rec.workout}
                        </div>
                      )}
                      {rec.notes && (
                        <div className="italic text-slate-400 text-[11px] pt-1">
                          <strong className="text-slate-400 not-italic">Remarks:</strong> &ldquo;{rec.notes}&rdquo;
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
