import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  UploadCloud, 
  Search,
  ExternalLink,
  Lock,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  TableProperties
} from 'lucide-react';
import { SheetMetadata, DailyHealthRecord, SheetTabInfo } from '../types';
import { 
  GoogleDriveFile, 
  GoogleSheetMetadataResponse, 
  searchSheetsByName, 
  getSpreadsheetDetails, 
  fetchSheetValues, 
  fetchAllSpreadsheetTabs,
  parseSheetRowsToHealthRecords 
} from '../lib/googleSheetsService';
import { googleSignIn, logout, getAccessToken } from '../lib/googleAuth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { User } from 'firebase/auth';

interface SheetConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetMeta: SheetMetadata;
  onUpdateSheetMeta: (meta: Partial<SheetMetadata>) => void;
  onRecordsLoaded: (records: DailyHealthRecord[], sheetTitle: string, sheetId: string, headers?: string[], clients?: string[]) => void;
  onTabsLoaded?: (tabs: SheetTabInfo[], spreadsheetTitle: string, spreadsheetId: string, initialTabTitle?: string) => void;
  onImportCsv: (csvContent: string, sourceName: string) => boolean;
  onResetToDemo: () => void;
  currentUser: User | null;
  onUserChanged: (user: User | null) => void;
  currentSpreadsheetId: string;
}

export const SheetConnectModal: React.FC<SheetConnectModalProps> = ({
  isOpen,
  onClose,
  sheetMeta,
  onUpdateSheetMeta,
  onRecordsLoaded,
  onTabsLoaded,
  onImportCsv,
  onResetToDemo,
  currentUser,
  onUserChanged,
  currentSpreadsheetId
}) => {
  const [activeTab, setActiveTab] = useState<'drive-search' | 'direct-id' | 'csv-paste'>('drive-search');
  const [searchQuery, setSearchQuery] = useState('Durgesh_ji _Client Health Tracker');
  const [searchResults, setSearchResults] = useState<GoogleDriveFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedSheet, setSelectedSheet] = useState<GoogleDriveFile | null>(null);
  const [sheetDetails, setSheetDetails] = useState<GoogleSheetMetadataResponse | null>(null);
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');

  const [directSheetIdOrUrl, setDirectSheetIdOrUrl] = useState('');
  const [csvRawText, setCsvRawText] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // When modal opens and user is logged in, auto-search for "Durgesh_ji _Client Health Tracker"
  useEffect(() => {
    if (isOpen && currentUser) {
      handleSearchDrive(searchQuery);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMsg({ text: 'Signing in with Google...', type: 'info' });
    try {
      const res = await googleSignIn();
      if (res) {
        onUserChanged(res.user);
        setStatusMsg({ text: `Signed in as ${res.user.displayName || res.user.email}. Searching Google Drive...`, type: 'success' });
        // Trigger search
        await executeDriveSearch(res.accessToken, searchQuery);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setStatusMsg({ text: err.message || 'Failed to sign in with Google.', type: 'error' });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      onUserChanged(null);
      setSearchResults([]);
      setSelectedSheet(null);
      setSheetDetails(null);
      setStatusMsg({ text: 'Signed out of Google account.', type: 'info' });
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const executeDriveSearch = async (token: string, q: string) => {
    setIsSearching(true);
    try {
      const files = await searchSheetsByName(token, q);
      setSearchResults(files);
      if (files.length === 0) {
        setStatusMsg({ 
          text: `No exact matches for "${q}". You can paste the Spreadsheet ID or Link in Option 2.`, 
          type: 'info' 
        });
      } else {
        // Auto-select exact or first match if name matches Durgesh
        const durgeshMatch = files.find(f => f.name.toLowerCase().includes('durgesh'));
        if (durgeshMatch) {
          handleSelectDriveSheet(durgeshMatch, token);
        }
      }
    } catch (err: any) {
      console.error('Drive search error:', err);
      setStatusMsg({ text: `Could not search Drive: ${err.message}`, type: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchDrive = async (q: string) => {
    const token = await getAccessToken();
    if (!token) {
      setStatusMsg({ text: 'Please sign in with Google first to search your Drive.', type: 'info' });
      return;
    }
    await executeDriveSearch(token, q);
  };

  const handleSelectDriveSheet = async (file: GoogleDriveFile, explicitToken?: string) => {
    setSelectedSheet(file);
    setIsConnecting(true);
    setStatusMsg({ text: `Inspecting "${file.name}"...`, type: 'info' });
    
    try {
      const token = explicitToken || await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const details = await getSpreadsheetDetails(token, file.id);
      setSheetDetails(details);
      
      const tabNames = details.sheets?.map(s => s.properties.title) || ['Sheet1'];
      setAvailableTabs(tabNames);
      setSelectedTab(tabNames[0] || 'Sheet1');
      setStatusMsg({ text: `Found ${tabNames.length} sheet tab(s). Ready to sync!`, type: 'success' });
    } catch (err: any) {
      console.error('Sheet inspect error:', err);
      setStatusMsg({ text: `Error reading sheet details: ${err.message}`, type: 'error' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLoadSheetData = async (sheetId: string, sheetTitle: string, tabName: string) => {
    setIsConnecting(true);
    setStatusMsg({ text: `Discovering all worksheets and loading rows from "${sheetTitle}"...`, type: 'info' });

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Google Sheets authentication failed. Please reconnect Google Sheets.');

      // Load all worksheets from the spreadsheet dynamically
      const { title, tabs } = await fetchAllSpreadsheetTabs(token, sheetId);

      if (!tabs || tabs.length === 0) {
        throw new Error('No worksheets found in this spreadsheet.');
      }

      // Pick selected tab or default to first tab
      const targetTab = tabs.find(t => t.title === tabName) || tabs[0];

      if (onTabsLoaded) {
        onTabsLoaded(tabs, sheetTitle || title, sheetId, targetTab.title);
      } else {
        onRecordsLoaded(targetTab.records, `${sheetTitle || title} (${targetTab.title})`, sheetId, targetTab.headers, targetTab.clients);
      }

      if (targetTab.hasHealthMetrics) {
        setStatusMsg({ 
          text: `Connected successfully! Discovered ${tabs.length} tab(s). Loaded ${targetTab.records.length} records from "${targetTab.title}".`, 
          type: 'success' 
        });
      } else {
        setStatusMsg({ 
          text: `Connected successfully. "${targetTab.title}" does not contain health metrics, so health analytics are unavailable. (${tabs.length} tabs discovered)`, 
          type: 'info' 
        });
      }

      setTimeout(() => {
        onClose();
      }, 1200);

    } catch (err: any) {
      console.error('Load sheet data error:', err);
      setStatusMsg({ text: `Connection note: ${err.message}`, type: 'error' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDirectConnect = async () => {
    if (!directSheetIdOrUrl.trim()) {
      setStatusMsg({ text: 'Please enter a Google Sheet URL or Spreadsheet ID.', type: 'error' });
      return;
    }

    const match = directSheetIdOrUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = match ? match[1] : directSheetIdOrUrl.trim();

    setIsConnecting(true);
    setStatusMsg({ text: 'Verifying Google Sheet access and discovering tabs...', type: 'info' });

    try {
      const token = await getAccessToken();
      if (token) {
        // Authenticated Google Sheets API: discover all worksheets
        const { title, tabs } = await fetchAllSpreadsheetTabs(token, sheetId);
        if (tabs.length === 0) {
          throw new Error('No worksheets found in this spreadsheet.');
        }

        const initialTab = tabs.find(t => t.hasHealthMetrics) || tabs[0];
        if (onTabsLoaded) {
          onTabsLoaded(tabs, title, sheetId, initialTab.title);
        } else {
          onRecordsLoaded(initialTab.records, `${title} (${initialTab.title})`, sheetId, initialTab.headers, initialTab.clients);
        }

        setStatusMsg({ 
          text: `Connected successfully! Discovered ${tabs.length} tab(s) from "${title}".`, 
          type: 'success' 
        });
        setTimeout(() => onClose(), 1200);
      } else {
        // Fallback to public export CSV
        const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        const res = await fetch(exportUrl);
        if (!res.ok) {
          throw new Error('Unable to access this spreadsheet. Please check permissions or sign in with Google above.');
        }
        const csv = await res.text();
        const success = onImportCsv(csv, `Google Sheet (${sheetId.slice(0, 8)}...)`);
        if (success) {
          onUpdateSheetMeta({
            sheetId,
            sheetName: `Linked Google Sheet (${sheetId.slice(0, 8)}...)`,
            sourceType: 'google-sheets-public',
            syncStatus: 'synced',
            lastSyncTimestamp: Date.now()
          });
          setStatusMsg({ text: 'Successfully linked Google Sheet in read-only mode!', type: 'success' });
          setTimeout(() => onClose(), 1000);
        } else {
          throw new Error('Spreadsheet export could not be read. Please sign in with Google to read multi-tab spreadsheets.');
        }
      }
    } catch (err: any) {
      console.error('Direct connect error:', err);
      setStatusMsg({ text: err.message || 'Failed to connect to sheet.', type: 'error' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFileProcess = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setCsvRawText(content);
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        const success = onImportCsv(content, fileName || 'Imported File');
        if (success) {
          setStatusMsg({ text: `Successfully imported "${file.name}"!`, type: 'success' });
          setTimeout(() => onClose(), 1000);
        } else {
          setStatusMsg({ text: `Unable to parse "${file.name}". Please ensure it contains tabular rows.`, type: 'error' });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleImportPastedCsv = () => {
    if (!csvRawText.trim()) {
      setStatusMsg({ text: 'Please paste your CSV rows or copied sheet table.', type: 'error' });
      return;
    }

    const success = onImportCsv(csvRawText, 'Durgesh_ji _Client Health Tracker (Pasted)');
    if (success) {
      setStatusMsg({ text: 'Successfully imported records from pasted table!', type: 'success' });
      setTimeout(() => onClose(), 1000);
    } else {
      setStatusMsg({ text: 'Unable to parse pasted content. Please provide tabular data with headers.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Google Sheet Connection</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                  Read-Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connect <strong className="text-slate-200">&ldquo;Durgesh_ji _Client Health Tracker&rdquo;</strong> in real-time
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          
          {/* User Auth Status Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {currentUser ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      currentUser.displayName?.[0] || 'U'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">
                        {currentUser.displayName || currentUser.email}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Google Workspace Connected (Drive &amp; Sheets Read-Only)
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-semibold text-white">Google Account Not Connected</span>
                    <p className="text-[11px] text-slate-400">Connect to fetch your private Google Sheets directly</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              {currentUser ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              ) : (
                <GoogleSignInButton 
                  onClick={handleSignIn} 
                  isLoading={isSigningIn} 
                  text="Connect with Google"
                />
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('drive-search')}
              className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 ${
                activeTab === 'drive-search'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              1. Search Google Drive
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('direct-id')}
              className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 ${
                activeTab === 'direct-id'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Paste Sheet URL / ID
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('csv-paste')}
              className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 ${
                activeTab === 'csv-paste'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              3. Direct CSV / Table Paste
            </button>
          </div>

          {/* TAB 1: SEARCH GOOGLE DRIVE */}
          {activeTab === 'drive-search' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchDrive(searchQuery)}
                    placeholder="Search spreadsheet by name..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchDrive(searchQuery)}
                  disabled={isSearching}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Find Sheet
                </button>
              </div>

              {/* Drive Results List */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Found Spreadsheets in Drive
                </span>

                {searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {searchResults.map((file) => {
                      const isSelected = selectedSheet?.id === file.id;
                      return (
                        <div
                          key={file.id}
                          onClick={() => handleSelectDriveSheet(file)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <div className="font-semibold text-white truncate text-xs flex items-center gap-1.5">
                                <span>{file.name}</span>
                                {file.name.toLowerCase().includes('durgesh') && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Target Match
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {file.id}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isSelected ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[11px]">
                                Selected
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium"
                              >
                                Select
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center space-y-2 bg-slate-950/40">
                    <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">
                      {currentUser 
                        ? 'Click "Find Sheet" or type your sheet name above to list spreadsheets.' 
                        : 'Please click "Connect with Google" to view spreadsheets from your account.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Sheet Tab Picker & Sync Trigger */}
              {selectedSheet && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Selected File</span>
                      <strong className="text-white text-xs">{selectedSheet.name}</strong>
                    </div>
                    {availableTabs.length > 0 && (
                      <div className="flex items-center gap-2">
                        <TableProperties className="w-4 h-4 text-emerald-400" />
                        <select
                          value={selectedTab}
                          onChange={(e) => setSelectedTab(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {availableTabs.map((tab) => (
                            <option key={tab} value={tab}>
                              Tab: {tab}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLoadSheetData(selectedSheet.id, selectedSheet.name, selectedTab || 'Sheet1')}
                    disabled={isConnecting}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Syncing Real-Time Health Records...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Load &amp; Sync Data from &ldquo;{selectedSheet.name}&rdquo;</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIRECT SHEET ID OR URL */}
          {activeTab === 'direct-id' && (
            <div className="space-y-3">
              <label className="font-semibold text-white block">
                Google Sheet URL or Spreadsheet ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={directSheetIdOrUrl}
                  onChange={(e) => setDirectSheetIdOrUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleDirectConnect}
                  disabled={isConnecting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
                >
                  {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  Connect
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                You can copy-paste the full URL from your browser address bar when viewing your sheet &ldquo;Durgesh_ji _Client Health Tracker&rdquo;.
              </p>
            </div>
          )}

          {/* TAB 3: CSV / FILE UPLOAD / TABLE PASTE */}
          {activeTab === 'csv-paste' && (
            <div className="space-y-3.5">
              <div>
                <label className="font-semibold text-white block mb-1">
                  Upload File or Paste Spreadsheet Data
                </label>
                <p className="text-[11px] text-slate-400">
                  Upload a CSV/TSV file or paste tabular data directly from Google Sheets or Excel.
                </p>
              </div>

              {/* Drag and Drop Box & File Input */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="p-4 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl bg-slate-950/60 text-center transition-colors cursor-pointer"
                onClick={() => {
                  const el = document.getElementById('csv-file-input');
                  el?.click();
                }}
              >
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
                <UploadCloud className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-200">
                  Drop CSV/TSV file here or <span className="text-emerald-400 underline">browse</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Supports any spreadsheet exported from Google Sheets, Excel, or Numbers
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-slate-400 block">
                  Or paste raw table / clipboard content:
                </span>
                <textarea
                  rows={3}
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  placeholder="Paste copied columns and rows here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[11px] text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Headers and columns detected dynamically
                </span>
                <button
                  type="button"
                  onClick={handleImportPastedCsv}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 text-xs transition-colors"
                >
                  Load Pasted Data
                </button>
              </div>
            </div>
          )}

          {/* Read-Only Safety Assurance */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-semibold text-white text-xs">Strictly Read-Only Guarantee</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The connection uses read-only permissions (`spreadsheets.readonly` &amp; `drive.readonly`). Your spreadsheet contents cannot be written to or altered.
              </p>
            </div>
          </div>

          {/* Status Alert Banner */}
          {statusMsg && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
                : statusMsg.type === 'error'
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-teal-950/60 border-teal-800 text-teal-300'
            }`}>
              {statusMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span className="flex-1">{statusMsg.text}</span>
            </div>
          )}

          {/* Clear Connection / Reset */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">
              Disconnect sheet and reset dashboard to empty state?
            </span>
            <button
              type="button"
              onClick={() => {
                onResetToDemo();
                setStatusMsg({ text: 'Disconnected spreadsheet. Dashboard cleared to empty state.', type: 'info' });
              }}
              className="text-slate-400 hover:text-rose-400 font-semibold text-xs transition-colors"
            >
              Clear Connection
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition-colors text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
