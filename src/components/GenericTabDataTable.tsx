import React, { useState, useMemo } from 'react';
import { 
  Table, 
  Search, 
  Download, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  Filter, 
  ShieldCheck, 
  Info, 
  Users, 
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { SheetTabInfo } from '../types';

interface GenericTabDataTableProps {
  tabInfo: SheetTabInfo;
}

export const GenericTabDataTable: React.FC<GenericTabDataTableProps> = ({ tabInfo }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL');
  const [sortHeader, setSortHeader] = useState<string>(tabInfo.headers[0] || '');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;

  // Reset page and sort when tab changes
  React.useEffect(() => {
    setSelectedEntity('ALL');
    setSelectedDateFilter('ALL');
    setSearchQuery('');
    setSortHeader(tabInfo.headers[0] || '');
    setSortOrder('asc');
    setCurrentPage(1);
  }, [tabInfo.title]);

  const headers = tabInfo.headers;
  const records = tabInfo.records;

  // Filter records by search query, client/entity, and date
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Entity filter (if tab has client column)
      if (tabInfo.hasClientColumn && selectedEntity !== 'ALL') {
        if (r.clientName.toLowerCase() !== selectedEntity.toLowerCase()) {
          return false;
        }
      }

      // Date filter (if tab has date column)
      if (tabInfo.hasDateColumn && selectedDateFilter !== 'ALL') {
        if (r.date !== selectedDateFilter && r.rawDate !== selectedDateFilter) {
          return false;
        }
      }

      // Search query across all column values
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      return headers.some((h) => {
        const val = String(r.rawValues[h] ?? '').toLowerCase();
        return val.includes(q);
      });
    });
  }, [records, tabInfo, selectedEntity, selectedDateFilter, searchQuery, headers]);

  // Sort records
  const sortedRecords = useMemo(() => {
    if (!sortHeader) return filteredRecords;

    return [...filteredRecords].sort((a, b) => {
      const valA = a.rawValues[sortHeader];
      const valB = b.rawValues[sortHeader];

      if (valA === undefined || valA === null || valA === '') return 1;
      if (valB === undefined || valB === null || valB === '') return -1;

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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const handleSort = (h: string) => {
    if (sortHeader === h) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortHeader(h);
      setSortOrder('asc');
    }
  };

  const handleExportCsv = () => {
    const csvRows = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...sortedRecords.map(r => 
        headers.map(h => {
          const val = r.rawValues[h] !== undefined && r.rawValues[h] !== null ? String(r.rawValues[h]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tabInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (tabInfo.isEmpty) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 space-y-3">
        <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">This tab is currently empty.</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Worksheet &quot;<strong className="text-slate-200">{tabInfo.title}</strong>&quot; has no rows recorded in Google Sheets.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Notice Banner: Tab-Agnostic Status & Safety */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-start md:items-center gap-2.5">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 md:mt-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-200">
              Connected successfully.
            </span>
            {!tabInfo.hasHealthMetrics && (
              <span className="text-slate-400 ml-1.5">
                This tab does not contain health metrics, so health analytics are unavailable. Showing complete tab data table.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 self-start md:self-auto">
          <span>{tabInfo.rowCount} Total Records</span>
          <span>•</span>
          <span>{tabInfo.columnCount} Columns</span>
        </div>
      </div>

      {/* Dynamic Filters Bar: Client & Date (only shown if detected in tab!) */}
      {(tabInfo.hasClientColumn || tabInfo.hasDateColumn) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
          
          {/* Dynamic Client/Entity Filter */}
          {tabInfo.hasClientColumn && tabInfo.clients.length > 0 && (
            <div className="min-w-[200px] flex-1 sm:flex-initial">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-emerald-400" />
                <span>{tabInfo.clientColumnName || 'Client / Entity'}</span>
              </label>
              <select
                value={selectedEntity}
                onChange={(e) => {
                  setSelectedEntity(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500/60"
              >
                <option value="ALL">All ({tabInfo.clients.length})</option>
                {tabInfo.clients.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dynamic Date Filter */}
          {tabInfo.hasDateColumn && tabInfo.dates.length > 0 && (
            <div className="min-w-[180px] flex-1 sm:flex-initial">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-teal-400" />
                <span>{tabInfo.dateColumnName || 'Date'}</span>
              </label>
              <select
                value={selectedDateFilter}
                onChange={(e) => {
                  setSelectedDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-teal-500/60 font-mono"
              >
                <option value="ALL">All Dates ({tabInfo.dates.length})</option>
                {tabInfo.dates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters */}
          {(selectedEntity !== 'ALL' || selectedDateFilter !== 'ALL') && (
            <div className="self-end pb-0.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedEntity('ALL');
                  setSelectedDateFilter('ALL');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Reset Filters
              </button>
            </div>
          )}

        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        
        {/* Controls: Search & CSV Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search any cell in "${tabInfo.title}"...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* The Exact Google Sheets Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-inner max-h-[580px]">
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
                        sortOrder === 'asc' ? (
                          <ChevronUp className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-emerald-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 1} className="p-8 text-center text-slate-500 font-sans">
                    No matching records found in this worksheet.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record, rIdx) => {
                  const globalIdx = (currentPage - 1) * pageSize + rIdx + 1;
                  return (
                    <tr 
                      key={record.id}
                      className="hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {globalIdx}
                      </td>
                      {headers.map((h) => {
                        const raw = record.rawValues[h];
                        // Blank cells display '—' (do not convert to fake zero values)
                        const cellVal = (raw === undefined || raw === null || String(raw).trim() === '') ? '—' : String(raw);
                        const isEntityCol = tabInfo.hasClientColumn && tabInfo.clientColumnName === h;
                        const isDateCol = tabInfo.hasDateColumn && tabInfo.dateColumnName === h;

                        return (
                          <td key={h} className="p-3 text-slate-300 whitespace-nowrap text-xs">
                            {cellVal === '—' ? (
                              <span className="text-slate-600">—</span>
                            ) : isEntityCol ? (
                              <span className="font-bold text-emerald-400 font-sans">
                                {cellVal}
                              </span>
                            ) : isDateCol ? (
                              <span className="text-white font-semibold">
                                {cellVal}
                              </span>
                            ) : (
                              <span>{cellVal}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-1">
          <div>
            Showing <strong className="text-white">{sortedRecords.length}</strong> records from worksheet &ldquo;{tabInfo.title}&rdquo;
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
