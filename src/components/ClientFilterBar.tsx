import React from 'react';
import { 
  Users, 
  Calendar, 
  Filter, 
  ChevronDown, 
  UserCheck, 
  Sparkles,
  LayoutDashboard,
  UserPlus,
  TrendingUp,
  FileText,
  CalendarRange,
  CalendarDays,
  Table
} from 'lucide-react';
import { ReportViewMode } from '../types';

interface ClientFilterBarProps {
  clients: string[];
  selectedClient: string;
  onSelectClient: (client: string) => void;
  dates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  activeTab: ReportViewMode;
  setActiveTab: (tab: ReportViewMode) => void;
  totalRecords: number;
  filteredCount: number;
  newClientsCount?: number;
}

export const ClientFilterBar: React.FC<ClientFilterBarProps> = ({
  clients,
  selectedClient,
  onSelectClient,
  dates,
  selectedDate,
  onSelectDate,
  activeTab,
  setActiveTab,
  totalRecords,
  filteredCount,
  newClientsCount = 0
}) => {
  return (
    <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-4">
      
      {/* Top Row: Client Selector + Date Selector + Counter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        
        {/* Client & Date Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Client Selector Dropdown (Dynamic: only if client column exists in tab) */}
          {clients.length > 0 && (
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-emerald-400" />
                <span>Client Selector ({clients.length})</span>
              </label>
              <div className="relative">
                <select
                  value={selectedClient}
                  onChange={(e) => onSelectClient(e.target.value)}
                  className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500/60 transition-colors pr-8 cursor-pointer shadow-inner"
                >
                  <option value="ALL">All Clients ({clients.length})</option>
                  {clients.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Date Selector Dropdown */}
          {dates.length > 0 && (
            <div className="relative min-w-[170px] flex-1 sm:flex-initial">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-teal-400" />
                <span>Date Logged ({dates.length})</span>
              </label>
              <div className="relative">
                <select
                  value={selectedDate}
                  onChange={(e) => onSelectDate(e.target.value)}
                  className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-teal-500/60 transition-colors pr-8 cursor-pointer shadow-inner font-mono"
                >
                  {dates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

        </div>

        {/* Selected Context Indicator */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400 font-medium">Viewing:</span>
            <span className="font-bold text-white">
              {selectedClient === 'ALL' ? 'All Clients' : selectedClient}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono text-[11px]">
              {filteredCount} {filteredCount === 1 ? 'record' : 'records'}
            </span>
          </div>
        </div>

      </div>

      {/* Navigation View Tabs */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new-clients')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'new-clients'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Clients</span>
            {newClientsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'new-clients' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {newClientsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('client-progress')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'client-progress'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Client Progress</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'daily'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Daily Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'weekly'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Weekly Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'monthly'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Monthly Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheet-data')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'sheet-data'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>All Sheet Data</span>
          </button>

        </div>
      </div>

    </div>
  );
};
