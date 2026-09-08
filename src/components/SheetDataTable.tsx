import React, { useState, useMemo } from 'react';
import { 
  Table, 
  Search, 
  ShieldCheck, 
  Download, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  Filter,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { DailyHealthRecord } from '../types';

interface SheetDataTableProps {
  records: DailyHealthRecord[];
  headers: string[];
  selectedClient: string;
  onSelectClient: (client: string) => void;
  onSelectDate: (date: string) => void;
}

export const SheetDataTable: React.FC<SheetDataTableProps> = ({
  records,
  headers,
  selectedClient,
  onSelectClient,
  onSelectDate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortHeader, setSortHeader] = useState<string>(headers[0] || 'Date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter by client and search query
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Client filter
      if (selectedClient !== 'ALL' && r.clientName.toLowerCase() !== selectedClient.toLowerCase()) {
        return false;
      }

      // Search query across all column values
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      return headers.some(h => {
        const val = String(r.rawValues[h] ?? '').toLowerCase();
        return val.includes(q);
      }) || r.date.toLowerCase().includes(q) || r.clientName.toLowerCase().includes(q);
    });
  }, [records, selectedClient, searchQuery, headers]);

  // Sort records
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const valA = a.rawValues[sortHeader] ?? a.date;
      const valB = b.rawValues[sortHeader] ?? b.date;

      const numA = parseFloat(String(valA));
      const numB = parseFloat(String(valB));

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      const strA = String(valA);
      const strB = String(valB);
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredRecords, sortHeader, sortOrder]);

  const handleSort = (h: string) => {
    if (sortHeader === h) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortHeader(h);
      setSortOrder('desc');
    }
  };

  const handleExportCsv = () => {
    const csvRows = [
      headers.join(','),
      ...sortedRecords.map(r => 
        headers.map(h => `"${String(r.rawValues[h] ?? '').replace(/"/g, '""')}"`).join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sheet_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
      
      {/* Read-Only Safety Banner */}
      <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Read-Only Sheet Mirror:</strong> Showing exact headings and cell values from Google Sheet.
          </span>
        </div>
        <span className="text-slate-400 font-mono text-[11px]">
          Live Auto-Sync Active (5s)
        </span>
      </div>

      {/* Controls Bar: Search, Client Filter, CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search any value across all sheet columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Download formatted CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>

      </div>

      {/* Google Sheet Table with exact columns */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-inner max-h-[560px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-950 text-slate-300 border-b border-slate-800 shadow-sm">
            <tr>
              <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                #
              </th>
              {headers.map((h) => (
                <th
                  key={h}
                  onClick={() => handleSort(h)}
                  className="p-3 text-[11px] font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-900 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{h}</span>
                    {sortHeader === h ? (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 text-emerald-400" /> : <ChevronDown className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
            {sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 1} className="p-8 text-center text-slate-500 font-sans">
                  No matching records found in spreadsheet.
                </td>
              </tr>
            ) : (
              sortedRecords.map((record, rIdx) => (
                <tr 
                  key={record.id}
                  onClick={() => onSelectDate(record.date)}
                  className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                >
                  <td className="p-3 text-slate-500 text-[11px]">
                    {rIdx + 1}
                  </td>
                  {headers.map((h) => {
                    const raw = record.rawValues[h];
                    const cellVal = (raw === undefined || raw === null || String(raw).trim() === '') ? '—' : String(raw);
                    const isClientCol = h.toLowerCase().includes('client') || h.toLowerCase().includes('name');
                    const isDateCol = h.toLowerCase().includes('date') || h.toLowerCase().includes('day');
                    const isVitality = h.toLowerCase().includes('vitality') || h.toLowerCase().includes('score');

                    return (
                      <td key={h} className="p-3 text-slate-300 whitespace-nowrap text-xs">
                        {cellVal === '—' ? (
                          <span className="text-slate-600">—</span>
                        ) : isClientCol ? (
                          <span className="font-bold text-emerald-400 font-sans">
                            {cellVal}
                          </span>
                        ) : isDateCol ? (
                          <span className="text-white font-semibold">
                            {cellVal}
                          </span>
                        ) : isVitality ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {cellVal}
                          </span>
                        ) : (
                          <span>{cellVal}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer: Record count & navigation hint */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
        <span>
          Showing <strong className="text-white">{sortedRecords.length}</strong> rows from Google Sheet
        </span>
        <span className="text-[11px] text-slate-500">
          Click any row to open that day&apos;s detailed Daily Report
        </span>
      </div>

    </div>
  );
};
