import React from 'react';
import { 
  Activity, 
  ShieldCheck, 
  RefreshCw, 
  Table, 
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  Radio,
  LogIn
} from 'lucide-react';
import { SheetMetadata, ReportViewMode } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';
import { User } from 'firebase/auth';

interface HeaderProps {
  sheetMeta: SheetMetadata;
  isAutoSyncing: boolean;
  onToggleAutoSync: () => void;
  onManualRefresh: () => void;
  onOpenSheetModal: () => void;
  activeTab: ReportViewMode;
  setActiveTab: (tab: ReportViewMode) => void;
  isSyncing: boolean;
  currentUser: User | null;
  onGoogleSignIn: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sheetMeta,
  isAutoSyncing,
  onToggleAutoSync,
  onManualRefresh,
  onOpenSheetModal,
  activeTab,
  setActiveTab,
  isSyncing,
  currentUser,
  onGoogleSignIn
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
          
          {/* Brand & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
                <Activity className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-white">
                    Daily Health &amp; Vitality Hub
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Read-Only Protected
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isAutoSyncing ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isAutoSyncing ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    </span>
                    {isAutoSyncing ? 'Live Stream Active' : 'Auto-Sync Paused'}
                  </span>
                  <span>•</span>
                  <button 
                    type="button" 
                    onClick={onOpenSheetModal}
                    className="truncate max-w-[180px] sm:max-w-xs text-slate-300 hover:text-emerald-300 flex items-center gap-1 transition-colors text-left"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{sheetMeta.sheetName}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Sheet Connect Button */}
            <div className="md:hidden flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenSheetModal}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                title="Sheet Settings"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Controls & Nav */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-between md:justify-end">
            
            {/* View Selector Tabs */}
            <div className="flex items-center p-1 bg-slate-950/70 rounded-xl border border-slate-800/90 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'overview'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('daily')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'daily'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Daily Report
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('weekly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'weekly'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Weekly Report
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('trends')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'trends'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Trends
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sheet-data')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'sheet-data'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                Sheet Data
              </button>
            </div>

            {/* Actions: Live Sync & Refresh & Sheet Connection & Auth */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleAutoSync}
                className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border transition-all ${
                  isAutoSyncing 
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50' 
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Toggle Real-Time Refresh every 5s"
              >
                <Radio className={`w-3.5 h-3.5 ${isAutoSyncing ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span className="hidden sm:inline">{isAutoSyncing ? 'Live (5s)' : 'Paused'}</span>
              </button>

              <button
                type="button"
                onClick={onManualRefresh}
                disabled={isSyncing}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50"
                title="Refresh from Sheet"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={onOpenSheetModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Sheet</span>
              </button>

              {currentUser ? (
                <div 
                  onClick={onOpenSheetModal} 
                  className="hidden xl:flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700"
                  title={`Signed in as ${currentUser.displayName || currentUser.email}`}
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-[10px] font-bold">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      currentUser.displayName?.[0] || 'U'
                    )}
                  </div>
                  <span className="text-xs text-slate-300 max-w-[90px] truncate font-medium">
                    {currentUser.displayName?.split(' ')[0] || 'Google User'}
                  </span>
                </div>
              ) : (
                <div className="hidden lg:block">
                  <GoogleSignInButton onClick={onGoogleSignIn} text="Sign in" />
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
