import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Activity, 
  Table, 
  ChevronRight, 
  Layers, 
  Sparkles, 
  Check, 
  BarChart3,
  Calendar,
  Users,
  Info
} from 'lucide-react';
import { SheetTabInfo } from '../types';

interface SpreadsheetTabsBarProps {
  tabs: SheetTabInfo[];
  activeTabName: string;
  onSelectTab: (tabName: string) => void;
  isSyncing?: boolean;
  spreadsheetTitle?: string;
}

export const SpreadsheetTabsBar: React.FC<SpreadsheetTabsBarProps> = ({
  tabs,
  activeTabName,
  onSelectTab,
  isSyncing = false,
  spreadsheetTitle = 'Google Spreadsheet'
}) => {
  const [tabSearchQuery, setTabSearchQuery] = useState('');
  const [showOverview, setShowOverview] = useState(false);

  // Filter tabs by search query while preserving original sheet order
  const filteredTabs = useMemo(() => {
    if (!tabSearchQuery.trim()) return tabs;
    const q = tabSearchQuery.toLowerCase();
    return tabs.filter(t => t.title.toLowerCase().includes(q));
  }, [tabs, tabSearchQuery]);

  const activeTabInfo = useMemo(() => {
    return tabs.find(t => t.title === activeTabName) || tabs[0];
  }, [tabs, activeTabName]);

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3.5">
      
      {/* Header Row: Title, Tab Counter, Overview Toggle & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left: Section Label & Tab Count */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Spreadsheet Tabs
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                {tabs.length} {tabs.length === 1 ? 'Tab' : 'Tabs Discovered'}
              </span>
              {isSyncing && (
                <span className="flex items-center gap-1 text-[10px] text-teal-400 animate-pulse font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  Syncing tabs...
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Select any worksheet from <strong className="text-slate-200">{spreadsheetTitle}</strong> to view its records
            </p>
          </div>
        </div>

        {/* Right: Quick Tab Search & Overview toggle */}
        <div className="flex items-center gap-2">
          {tabs.length > 3 && (
            <div className="relative min-w-[160px] sm:min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={tabSearchQuery}
                onChange={(e) => setTabSearchQuery(e.target.value)}
                placeholder="Search tabs..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowOverview(!showOverview)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showOverview
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
            }`}
            title="Toggle Cross-Tab Spreadsheet Overview"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Spreadsheet Overview</span>
            <span className="md:hidden">Overview</span>
          </button>
        </div>

      </div>

      {/* Spreadsheet Tabs Buttons List in Exact Google Sheets Order */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {filteredTabs.length === 0 ? (
            <span className="text-xs text-slate-500 py-1">
              No tabs match &quot;{tabSearchQuery}&quot;
            </span>
          ) : (
            filteredTabs.map((tab) => {
              const isActive = tab.title === activeTabName;
              return (
                <button
                  key={`tab-btn-${tab.sheetId}-${tab.title}`}
                  type="button"
                  onClick={() => onSelectTab(tab.title)}
                  className={`group px-3.5 py-2 rounded-xl font-medium flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                      : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-850 border border-slate-800/90'
                  }`}
                >
                  {tab.hasHealthMetrics ? (
                    <Activity className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                  ) : (
                    <Table className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  )}

                  <span>{tab.title}</span>

                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {tab.rowCount}
                  </span>

                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 ml-0.5"></span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Tab Sub-banner Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/40 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Active Tab:</span>
          <span className="font-bold text-white flex items-center gap-1.5">
            {activeTabInfo?.title || activeTabName}
            {activeTabInfo?.hasHealthMetrics ? (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                Health Analytics Available
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Business Data Table
              </span>
            )}
          </span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-slate-400">
            {activeTabInfo?.rowCount || 0} rows, {activeTabInfo?.columnCount || 0} columns
          </span>
        </div>

        {activeTabInfo?.hasClientColumn && activeTabInfo.clients.length > 0 && (
          <div className="flex items-center gap-1.5 text-slate-400">
            <Users className="w-3 h-3 text-emerald-400" />
            <span>{activeTabInfo.clients.length} unique {activeTabInfo.clientColumnName || 'entities'}</span>
          </div>
        )}
      </div>

      {/* Collapsible Cross-Tab Overview (Requirement 11) */}
      {showOverview && (
        <div className="mt-3 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Spreadsheet Overview (All {tabs.length} Tabs)
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Total Records Across All Tabs: {tabs.reduce((acc, t) => acc + t.rowCount, 0)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {tabs.map((tab, idx) => {
              const isSelected = tab.title === activeTabName;
              return (
                <div
                  key={`tab-card-${tab.sheetId}-${idx}`}
                  onClick={() => onSelectTab(tab.title)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500/80 shadow-sm ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[150px]">
                        {tab.title}
                      </span>
                    </div>
                    {tab.hasHealthMetrics ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                        Health
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-400 shrink-0">
                        Data
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{tab.rowCount} records</span>
                    <span>{tab.columnCount} columns</span>
                  </div>

                  {tab.headers.length > 0 && (
                    <div className="mt-2 text-[10px] text-slate-500 truncate">
                      Cols: {tab.headers.slice(0, 4).join(', ')}{tab.headers.length > 4 ? '...' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
