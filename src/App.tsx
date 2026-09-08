import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { ClientFilterBar } from './components/ClientFilterBar';
import { ManagementOverview } from './components/ManagementOverview';
import { NewClientsView } from './components/NewClientsView';
import { ClientProgressView } from './components/ClientProgressView';
import { DailyReportView } from './components/DailyReportView';
import { WeeklyReportView } from './components/WeeklyReportView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { DynamicSheetMetricCards } from './components/DynamicSheetMetricCards';
import { TrendCharts } from './components/TrendCharts';
import { SheetDataTable } from './components/SheetDataTable';
import { SheetConnectModal } from './components/SheetConnectModal';
import { 
  DailyHealthRecord, 
  SheetMetadata, 
  TimeRange,
  ReportViewMode,
  SheetParseResult,
  SheetTabInfo
} from './types';
import { 
  EMPTY_SHEET_DATA, 
  parseSheetCsvData,
  parseSheetCsvToTabInfo
} from './data/mockHealthData';
import { 
  initAuth, 
  googleSignIn, 
  getAccessToken,
  setAccessToken
} from './lib/googleAuth';
import { 
  searchSheetsByName, 
  getSpreadsheetDetails, 
  fetchSheetValues, 
  fetchAllSpreadsheetTabs,
  parseSheetTab,
  parseSheetRowsToHealthRecords 
} from './lib/googleSheetsService';
import { computeManagementOverview } from './lib/clientAnalytics';
import { User } from 'firebase/auth';
import { SpreadsheetTabsBar } from './components/SpreadsheetTabsBar';
import { GenericTabDataTable } from './components/GenericTabDataTable';
import { 
  ShieldCheck, 
  Activity, 
  FileSpreadsheet, 
  Sparkles,
  Users,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function App() {
  // SINGLE SOURCE OF TRUTH: All Spreadsheet Tabs & Active Worksheet
  const [tabs, setTabs] = useState<SheetTabInfo[]>([]);
  const [activeSpreadsheetTab, setActiveSpreadsheetTab] = useState<string>('');

  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<DailyHealthRecord[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('ALL');

  const [activeTab, setActiveTab] = useState<ReportViewMode>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('14d');

  // Sheet connection metadata
  const [activeSpreadsheetId, setActiveSpreadsheetId] = useState<string>('');
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [sheetMeta, setSheetMeta] = useState<SheetMetadata>({
    sheetId: '',
    sheetName: '',
    title: '',
    rowCount: 0,
    readOnly: true,
    lastSyncTimestamp: Date.now(),
    syncStatus: 'unconnected',
    sourceType: 'empty',
    syncIntervalSec: 5,
    tabs: []
  });

  // Current active worksheet information
  const currentTabInfo = useMemo(() => {
    if (tabs.length === 0) return null;
    return tabs.find(t => t.title === activeSpreadsheetTab) || tabs[0];
  }, [tabs, activeSpreadsheetTab]);

  // Calculate Management-Level Analytics strictly from Sheet records
  const stats = useMemo(() => {
    return computeManagementOverview(records);
  }, [records]);

  // Filtered records by selected client
  const clientRecords = useMemo(() => {
    if (selectedClient === 'ALL') return records;
    return records.filter(r => r.clientName.toLowerCase() === selectedClient.toLowerCase());
  }, [records, selectedClient]);

  // Active stats computed strictly from active clientRecords (respects selected client or all)
  const activeStats = useMemo(() => {
    return computeManagementOverview(clientRecords);
  }, [clientRecords]);

  // All unique dates available in the sheet for client
  const clientDates = useMemo(() => {
    return Array.from(new Set(clientRecords.map(r => r.date))).sort().reverse();
  }, [clientRecords]);

  // Selected date for Daily Report
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Keep selectedDate synchronized when client or records change
  useEffect(() => {
    if (clientDates.length > 0) {
      if (!selectedDate || !clientDates.includes(selectedDate)) {
        setSelectedDate(clientDates[0]);
      }
    } else {
      setSelectedDate('');
    }
  }, [clientDates, selectedDate]);

  // Client profile summary for selected client
  const selectedClientSummary = useMemo(() => {
    if (selectedClient === 'ALL') return undefined;
    return stats.clientSummaries.find(c => c.name.toLowerCase() === selectedClient.toLowerCase());
  }, [stats.clientSummaries, selectedClient]);

  // Handler for user switching spreadsheet tabs
  const handleSelectSpreadsheetTab = (tabName: string) => {
    setActiveSpreadsheetTab(tabName);
    const targetTab = tabs.find(t => t.title === tabName);
    if (targetTab) {
      setHeaders(targetTab.headers);
      setRecords(targetTab.records);
      setClients(targetTab.clients);
      setSelectedClient('ALL');

      if (targetTab.hasDateColumn && targetTab.dates.length > 0) {
        setSelectedDate(targetTab.dates[0]);
      } else {
        setSelectedDate('');
      }

      setSheetMeta(prev => ({
        ...prev,
        rowCount: targetTab.rowCount,
        currentTab: targetTab.title
      }));
      // Reset view to overview on tab change to prevent stale sub-view state
      setActiveTab('overview');
    }
  };

  // Handler when all tabs are loaded from Google Sheets
  const handleTabsLoaded = (
    loadedTabs: SheetTabInfo[], 
    sheetTitle: string, 
    sheetId: string, 
    initialTabTitle?: string
  ) => {
    setTabs(loadedTabs);
    if (sheetId) {
      setActiveSpreadsheetId(sheetId);
      try {
        localStorage.setItem('connected_spreadsheet_id', sheetId);
      } catch (e) {
        // Ignore localStorage quota errors
      }
    }

    // Pick target tab
    let target = loadedTabs[0];
    if (initialTabTitle) {
      const match = loadedTabs.find(t => t.title === initialTabTitle);
      if (match) target = match;
    } else {
      // Prioritize tab that has health metrics, or first tab
      const healthTab = loadedTabs.find(t => t.hasHealthMetrics);
      if (healthTab) target = healthTab;
    }

    setActiveSpreadsheetTab(target.title);
    setHeaders(target.headers);
    setRecords(target.records);
    setClients(target.clients);
    setSelectedClient('ALL');

    if (target.hasDateColumn && target.dates.length > 0) {
      setSelectedDate(target.dates[0]);
    } else {
      setSelectedDate('');
    }

    setSheetMeta({
      sheetId: sheetId || sheetTitle,
      sheetName: sheetTitle,
      title: sheetTitle,
      rowCount: target.rowCount,
      readOnly: true,
      lastSyncTimestamp: Date.now(),
      syncStatus: 'synced',
      sourceType: 'google-sheets-oauth',
      syncIntervalSec: 5,
      availableTabs: loadedTabs.map(t => t.title),
      currentTab: target.title,
      tabs: loadedTabs
    });
  };

  // Initialize Firebase Auth listener and attempt auto-discovery
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        if (token) {
          attemptAutoLoadSpreadsheet(token);
        }
      },
      () => {
        // Not signed in
      }
    );
    return () => unsubscribe();
  }, []);

  // Auto-discover and connect all tabs from user's connected spreadsheet or Google Drive
  const attemptAutoLoadSpreadsheet = async (token: string) => {
    try {
      setIsSyncing(true);
      // 1. Check if user previously connected a specific spreadsheet
      const savedSheetId = localStorage.getItem('connected_spreadsheet_id');
      if (savedSheetId) {
        try {
          const { title, tabs: loadedTabs } = await fetchAllSpreadsheetTabs(token, savedSheetId);
          if (loadedTabs && loadedTabs.length > 0) {
            handleTabsLoaded(loadedTabs, title, savedSheetId);
            return;
          }
        } catch (err) {
          console.warn('Saved sheet ID reload failed, searching Drive...', err);
        }
      }

      // 2. Search Drive for Durgesh_ji or health sheets
      const files = await searchSheetsByName(token, 'Durgesh_ji _Client Health Tracker');
      if (files && files.length > 0) {
        const target = files.find(f => f.name.toLowerCase().includes('durgesh')) || files[0];
        const { title, tabs: loadedTabs } = await fetchAllSpreadsheetTabs(token, target.id);
        if (loadedTabs && loadedTabs.length > 0) {
          handleTabsLoaded(loadedTabs, target.name || title, target.id);
        }
      }
    } catch (e) {
      console.warn('Auto search for spreadsheet deferred:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Periodic real-time poll from Google Sheet (every 5 seconds) to discover new/renamed tabs and data
  useEffect(() => {
    if (!isAutoSyncing || !activeSpreadsheetId || !currentUser) return;

    const interval = setInterval(async () => {
      const token = await getAccessToken();
      if (!token) return;

      try {
        const { title, tabs: latestTabs } = await fetchAllSpreadsheetTabs(token, activeSpreadsheetId);
        if (latestTabs && latestTabs.length > 0) {
          setTabs(latestTabs);

          // Find current active tab in latestTabs
          const updatedActiveTab = latestTabs.find(t => t.title === activeSpreadsheetTab) || latestTabs[0];

          setHeaders(updatedActiveTab.headers);
          setRecords(updatedActiveTab.records);
          setClients(updatedActiveTab.clients);

          setSheetMeta(prev => ({
            ...prev,
            sheetName: title || prev.sheetName,
            title: title || prev.title,
            rowCount: updatedActiveTab.records.length,
            availableTabs: latestTabs.map(t => t.title),
            currentTab: updatedActiveTab.title,
            tabs: latestTabs,
            lastSyncTimestamp: Date.now(),
            syncStatus: 'synced'
          }));
        }
      } catch (err) {
        console.warn('Live 5s background sync error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoSyncing, activeSpreadsheetId, activeSpreadsheetTab, currentUser]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsSyncing(true);
    const token = await getAccessToken();
    if (activeSpreadsheetId && token) {
      try {
        const { title, tabs: loadedTabs } = await fetchAllSpreadsheetTabs(token, activeSpreadsheetId);
        if (loadedTabs && loadedTabs.length > 0) {
          setTabs(loadedTabs);
          const current = loadedTabs.find(t => t.title === activeSpreadsheetTab) || loadedTabs[0];
          setActiveSpreadsheetTab(current.title);
          setHeaders(current.headers);
          setRecords(current.records);
          setClients(current.clients);
          setSheetMeta(prev => ({
            ...prev,
            sheetName: title || prev.sheetName,
            title: title || prev.title,
            rowCount: current.rowCount,
            lastSyncTimestamp: Date.now(),
            syncStatus: 'synced',
            availableTabs: loadedTabs.map(t => t.title),
            currentTab: current.title,
            tabs: loadedTabs
          }));
        }
      } catch (e) {
        console.error('Manual refresh error:', e);
      }
    }
    setIsSyncing(false);
  };

  const handleGoogleSignInClick = async () => {
    try {
      const res = await googleSignIn();
      if (res && res.accessToken) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        await attemptAutoLoadSpreadsheet(res.accessToken);
      }
    } catch (e) {
      console.error('Sign in error:', e);
    }
  };

  const handleRecordsLoaded = (
    newRecords: DailyHealthRecord[], 
    sheetTitle: string, 
    sheetId: string, 
    newHeaders?: string[], 
    newClients?: string[]
  ) => {
    setRecords(newRecords);
    if (newHeaders) setHeaders(newHeaders);
    if (newClients) setClients(newClients);
    if (sheetId) setActiveSpreadsheetId(sheetId);

    setSheetMeta(prev => ({
      ...prev,
      sheetId: sheetId || sheetTitle,
      sheetName: sheetTitle,
      title: sheetTitle,
      rowCount: newRecords.length,
      lastSyncTimestamp: Date.now(),
      syncStatus: 'synced',
      sourceType: 'google-sheets-oauth'
    }));

    if (newRecords.length > 0) {
      setSelectedDate(newRecords[newRecords.length - 1].date);
    }
  };

  const handleImportCsv = (csvText: string, sourceName: string): boolean => {
    try {
      const tabInfo = parseSheetCsvToTabInfo(csvText, sourceName);
      if (tabInfo.headers.length === 0 && tabInfo.records.length === 0) {
        return false;
      }
      handleTabsLoaded([tabInfo], sourceName, 'imported-csv', tabInfo.title);
      return true;
    } catch (err) {
      console.error('CSV import error:', err);
      return false;
    }
  };

  const handleResetToEmpty = () => {
    setTabs([]);
    setActiveSpreadsheetTab('');
    setRecords([]);
    setHeaders([]);
    setClients([]);
    setSelectedClient('ALL');
    setSheetMeta(prev => ({
      ...prev,
      rowCount: 0,
      syncStatus: 'unconnected',
      sourceType: 'empty',
      availableTabs: [],
      tabs: []
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 antialiased">
      
      {/* Top Navigation & Status Bar */}
      <Header
        sheetMeta={sheetMeta}
        isAutoSyncing={isAutoSyncing}
        onToggleAutoSync={() => setIsAutoSyncing(prev => !prev)}
        onManualRefresh={handleManualRefresh}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSyncing={isSyncing}
        currentUser={currentUser}
        onGoogleSignIn={handleGoogleSignInClick}
      />

      {/* Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        
        {/* Spreadsheet Tabs Navigation (Requirement 2, 11, 12, 13, 14) */}
        {tabs.length > 0 && (
          <SpreadsheetTabsBar
            tabs={tabs}
            activeTabName={activeSpreadsheetTab || (tabs[0]?.title ?? '')}
            onSelectTab={handleSelectSpreadsheetTab}
            isSyncing={isSyncing}
            spreadsheetTitle={sheetMeta.sheetName}
          />
        )}

        {/* Live Sheet Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 px-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${records.length > 0 ? 'bg-emerald-400' : 'bg-amber-400'} ${isAutoSyncing ? 'animate-pulse' : ''}`}></span>
            <span className="text-slate-400 font-medium">Connected Sheet:</span>
            <span className="text-emerald-300 font-bold truncate max-w-xs">
              {sheetMeta.sheetName}
            </span>
            {currentTabInfo && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-white font-semibold">
                  Tab: {currentTabInfo.title}
                </span>
              </>
            )}
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-mono">
              {headers.length} Columns Detected
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-mono">
              {records.length} Records
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSheetModalOpen(true)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Change Sheet / Sync Settings</span>
            </button>
          </div>
        </div>

        {/* EMPTY STATE (If Sheet has no tabs or records, show exact notice) */}
        {tabs.length === 0 && records.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl font-black text-white">
                No client data available in Google Sheet.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                The dashboard is configured with Google Sheet as the <strong>single source of truth</strong>. All dummy data has been removed. Please connect your spreadsheet to discover all worksheet tabs and load live records.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleGoogleSignInClick}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-lg flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Connect &ldquo;Durgesh_ji _Client Health Tracker&rdquo;</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSheetModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 font-semibold text-xs transition-colors flex items-center gap-2"
              >
                <span>Paste Sheet Link / Upload CSV</span>
              </button>
            </div>
          </div>
        ) : currentTabInfo && !currentTabInfo.hasHealthMetrics ? (
          /* Non-health worksheet: GenericTabDataTable (Requirements 7, 8, 9, 10, 18) */
          <GenericTabDataTable tabInfo={currentTabInfo} />
        ) : (
          /* Worksheet with health metrics: Full Health Analytics Suite */
          <>
            {/* Client & Date Filter Control Bar */}
            <ClientFilterBar
              clients={clients}
              selectedClient={selectedClient}
              onSelectClient={(c) => setSelectedClient(c)}
              dates={clientDates}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              totalRecords={records.length}
              filteredCount={clientRecords.length}
              newClientsCount={stats.newClientsThisWeek.length}
            />
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Management-Level Overview (Total, New This Week, New This Month, Active, Roster) */}
                <ManagementOverview
                  stats={stats}
                  headers={headers}
                  records={records}
                  onSelectClient={(c) => {
                    setSelectedClient(c);
                    setActiveTab('client-progress');
                  }}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />

                {/* Detected Google Sheet Metrics Strip */}
                <DynamicSheetMetricCards
                  records={clientRecords}
                  headers={headers}
                  selectedClient={selectedClient}
                />

                {/* Trends Over Time (Only real records; "Not enough data for trend" fallback) */}
                <TrendCharts
                  records={clientRecords}
                  headers={headers}
                  timeRange={timeRange}
                  setTimeRange={setTimeRange}
                />
              </div>
            )}

            {/* VIEW 2: NEW CLIENTS */}
            {activeTab === 'new-clients' && (
              <NewClientsView
                newThisWeek={activeStats.newClientsThisWeek}
                newThisMonth={activeStats.newClientsThisMonth}
                currentWeekLabel={activeStats.currentWeekLabel}
                onSelectClient={(c) => {
                  setSelectedClient(c);
                  setActiveTab('client-progress');
                }}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {/* VIEW 3: CLIENT PROGRESS (Individual Client Dashboard) */}
            {activeTab === 'client-progress' && (
              <ClientProgressView
                clientName={selectedClient}
                clients={clients}
                onSelectClient={(c) => setSelectedClient(c)}
                records={records}
                headers={headers}
                summary={selectedClientSummary}
              />
            )}

            {/* VIEW 4: DAILY REPORT */}
            {activeTab === 'daily' && (
              <DailyReportView
                records={clientRecords}
                selectedClient={selectedClient}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                headers={headers}
              />
            )}

            {/* VIEW 5: WEEKLY REPORT */}
            {activeTab === 'weekly' && (
              <WeeklyReportView
                records={clientRecords}
                stats={activeStats}
                headers={headers}
                selectedClient={selectedClient}
                onSelectClient={(c) => {
                  setSelectedClient(c);
                  setActiveTab('client-progress');
                }}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {/* VIEW 6: MONTHLY REPORT */}
            {activeTab === 'monthly' && (
              <MonthlyReportView
                records={clientRecords}
                stats={activeStats}
                headers={headers}
                selectedClient={selectedClient}
                onSelectClient={(c) => {
                  setSelectedClient(c);
                  setActiveTab('client-progress');
                }}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {/* VIEW 7: ALL SHEET DATA (Exact Mirror Table) */}
            {activeTab === 'sheet-data' && (
              <SheetDataTable
                records={records}
                headers={headers}
                selectedClient={selectedClient}
                onSelectClient={setSelectedClient}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setActiveTab('daily');
                }}
              />
            )}
          </>
        )}

      </main>

      {/* Sheet Connection Modal */}
      <SheetConnectModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        sheetMeta={sheetMeta}
        onUpdateSheetMeta={(meta) => setSheetMeta(prev => ({ ...prev, ...meta }))}
        onRecordsLoaded={handleRecordsLoaded}
        onTabsLoaded={handleTabsLoaded}
        onImportCsv={handleImportCsv}
        onResetToDemo={handleResetToEmpty}
        currentUser={currentUser}
        onUserChanged={setCurrentUser}
        currentSpreadsheetId={activeSpreadsheetId}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">{sheetMeta.title || sheetMeta.sheetName || 'Client Health Tracker'}</span>
            <span>•</span>
            <span className="text-slate-400">Single Source of Truth Dashboard</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Source Google Sheet Safe (Read-Only)
            </span>
            <span>•</span>
            <span>Real-Time 5s Auto-Sync</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
