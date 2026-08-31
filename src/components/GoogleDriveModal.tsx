import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  logout,
  getAccessToken,
} from '../services/firebaseAuth';
import {
  DriveFileInfo,
  listDriveWardenFiles,
  getOrCreateWardenFolder,
  uploadFileToDrive,
  downloadFileFromDrive,
  deleteFileFromDrive,
  buildGpxContent,
  buildProwJson,
  buildAuditCsv,
} from '../services/googleDriveService';
import { ProwPoint, ProwReport, ProwWay } from '../types';
import {
  Cloud,
  HardDrive,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  FileCode,
  Compass,
  X,
  LogIn,
  LogOut,
  FolderSync,
} from 'lucide-react';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthChange: (user: User | null) => void;
  ways: ProwWay[];
  points: ProwPoint[];
  reports: ProwReport[];
  recordedTrack?: [number, number][];
  onImportData: (data: { ways?: ProwWay[]; points?: ProwPoint[]; reports?: ProwReport[] }) => void;
  wardenId: string;
}

export const GoogleDriveModal = ({
  isOpen,
  onClose,
  currentUser,
  onAuthChange,
  ways,
  points,
  reports,
  recordedTrack = [],
  onImportData,
  wardenId,
}: GoogleDriveModalProps) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'files'>('backup');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFileInfo[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Deletion confirmation state
  const [fileToDelete, setFileToDelete] = useState<DriveFileInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load files when tab is switched to files and user is logged in
  useEffect(() => {
    if (isOpen && currentUser) {
      loadFiles();
    }
  }, [isOpen, currentUser]);

  const loadFiles = async () => {
    try {
      setIsLoadingFiles(true);
      setStatusMessage(null);
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Please sign in to Google Drive');
      }
      const fetchedFiles = await listDriveWardenFiles(token);
      setFiles(fetchedFiles);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load Google Drive files';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      setStatusMessage(null);
      const result = await googleSignIn();
      if (result) {
        onAuthChange(result.user);
        setStatusMessage({ type: 'success', text: `Connected as ${result.user.displayName || result.user.email}` });
        // Automatically fetch files
        const fetchedFiles = await listDriveWardenFiles(result.accessToken);
        setFiles(fetchedFiles);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      onAuthChange(null);
      setFiles([]);
      setStatusMessage({ type: 'success', text: 'Signed out from Google Drive' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign out failed';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  const handleExportJson = async () => {
    try {
      setIsUploading('json');
      setStatusMessage(null);
      const token = await getAccessToken();
      if (!token) throw new Error('Please sign in with Google');

      const folderId = await getOrCreateWardenFolder(token);
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `prow_survey_${dateStr}_${wardenId}.json`;
      const jsonContent = buildProwJson(ways, points, reports, {
        wardenId,
        areaName: 'UK PROW Survey',
        exportedAt: new Date().toISOString(),
      });

      await uploadFileToDrive(token, fileName, 'application/json', jsonContent, folderId);
      setStatusMessage({ type: 'success', text: `Saved "${fileName}" to Google Drive folder "UK PROW Warden Data"!` });
      await loadFiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsUploading(null);
    }
  };

  const handleExportGpx = async () => {
    try {
      setIsUploading('gpx');
      setStatusMessage(null);
      const token = await getAccessToken();
      if (!token) throw new Error('Please sign in with Google');

      const folderId = await getOrCreateWardenFolder(token);
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `trail_track_${dateStr}_${wardenId}.gpx`;
      const gpxContent = buildGpxContent(points, reports, recordedTrack, `PROW Survey ${dateStr}`);

      await uploadFileToDrive(token, fileName, 'application/gpx+xml', gpxContent, folderId);
      setStatusMessage({ type: 'success', text: `Saved "${fileName}" (GPX) to Google Drive!` });
      await loadFiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'GPX Upload failed';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsUploading(null);
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsUploading('csv');
      setStatusMessage(null);
      const token = await getAccessToken();
      if (!token) throw new Error('Please sign in with Google');

      const folderId = await getOrCreateWardenFolder(token);
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `warden_council_audit_${dateStr}.csv`;
      const csvContent = buildAuditCsv(points, reports);

      await uploadFileToDrive(token, fileName, 'text/csv', csvContent, folderId);
      setStatusMessage({ type: 'success', text: `Saved Council Audit "${fileName}" to Google Drive!` });
      await loadFiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'CSV Upload failed';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsUploading(null);
    }
  };

  const handleImportFile = async (file: DriveFileInfo) => {
    try {
      setIsImporting(file.id);
      setStatusMessage(null);
      const token = await getAccessToken();
      if (!token) throw new Error('Please sign in with Google');

      const rawContent = await downloadFileFromDrive(token, file.id);

      if (file.name.endsWith('.json') || file.mimeType === 'application/json') {
        const parsed = JSON.parse(rawContent);
        if (parsed.points || parsed.ways || parsed.reports) {
          onImportData({
            ways: parsed.ways,
            points: parsed.points,
            reports: parsed.reports,
          });
          setStatusMessage({
            type: 'success',
            text: `Imported ${parsed.points?.length || 0} stiles/points and ${parsed.reports?.length || 0} hazards from "${file.name}" into map!`,
          });
        } else {
          throw new Error('JSON format is not recognized as a PROW survey.');
        }
      } else if (file.name.endsWith('.gpx') || file.mimeType === 'application/gpx+xml') {
        // Parse GPX waypoints
        const parser = new DOMParser();
        const xml = parser.parseFromString(rawContent, 'application/xml');
        const wpts = xml.querySelectorAll('wpt');
        const importedPoints: ProwPoint[] = [];

        wpts.forEach((wpt, index) => {
          const lat = parseFloat(wpt.getAttribute('lat') || '0');
          const lon = parseFloat(wpt.getAttribute('lon') || '0');
          const name = wpt.querySelector('name')?.textContent || `Imported Point ${index + 1}`;
          const desc = wpt.querySelector('desc')?.textContent || '';
          const type = (wpt.querySelector('type')?.textContent as ProwPoint['type']) || 'stile';

          if (lat && lon) {
            importedPoints.push({
              id: `gpx-imp-${Date.now()}-${index}`,
              type: type === 'report_issue' ? 'stile' : type,
              name,
              coordinates: [lat, lon],
              notes: desc,
              timestamp: Date.now(),
            });
          }
        });

        if (importedPoints.length > 0) {
          onImportData({ points: importedPoints });
          setStatusMessage({
            type: 'success',
            text: `Imported ${importedPoints.length} waypoints from GPX file "${file.name}"!`,
          });
        } else {
          throw new Error('No valid waypoints found in GPX file.');
        }
      } else {
        throw new Error('File type not supported for direct map overlay. Only JSON and GPX are supported.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsImporting(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      setIsDeleting(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Please sign in with Google');

      await deleteFileFromDrive(token, fileToDelete.id);
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setStatusMessage({
        type: 'success',
        text: `Deleted "${fileToDelete.name}" from Google Drive.`,
      });
      setFileToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="google-drive-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        id="google-drive-modal-container"
        className="bg-[#0f1117] border border-[#FFD700]/30 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#151922]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg text-[#FFD700]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide flex items-center gap-2 text-white">
                Google Drive Trail Sync
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  v3 API
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Backup stiles, paths, GPX tracks, and council hazard reports to your Drive
              </p>
            </div>
          </div>
          <button
            id="close-drive-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User / Authentication Status Bar */}
        <div className="px-4 py-3 bg-[#11141d] border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
          {currentUser ? (
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Google User'}
                  className="w-8 h-8 rounded-full border border-[#FFD700]/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/40 flex items-center justify-center text-xs font-bold text-[#FFD700]">
                  {currentUser.displayName?.[0] || 'U'}
                </div>
              )}
              <div className="text-xs">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  {currentUser.displayName || 'Google Drive User'}
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                </div>
                <div className="text-slate-400 font-mono text-[11px]">{currentUser.email}</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-amber-400" />
              <span>Connect your Google Drive to sync and load PROW survey files</span>
            </div>
          )}

          <div>
            {currentUser ? (
              <button
                id="drive-signout-btn"
                onClick={handleSignOut}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            ) : (
              <button
                id="drive-signin-btn"
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="px-4 py-2 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-900 rounded-lg flex items-center gap-2 shadow transition-all disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`px-4 py-2 text-xs flex items-center gap-2 border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
                : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="truncate">{statusMessage.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-[#131720]">
          <button
            id="tab-drive-backup"
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'backup'
                ? 'border-[#FFD700] text-[#FFD700] bg-[#FFD700]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Save / Export to Drive
          </button>
          <button
            id="tab-drive-files"
            onClick={() => {
              setActiveTab('files');
              if (currentUser) loadFiles();
            }}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'files'
                ? 'border-[#FFD700] text-[#FFD700] bg-[#FFD700]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderSync className="w-4 h-4" />
            My Drive Files ({files.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {!currentUser ? (
            <div className="text-center py-8 px-4 bg-slate-900/50 rounded-xl border border-slate-800">
              <div className="w-12 h-12 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 mx-auto flex items-center justify-center text-[#FFD700] mb-3">
                <LogIn className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Sign in with Google to Connect Drive</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                Safely store your PROW footpath surveys, marked stiles, recorded trail tracks, and parish hazard reports in your personal Google Drive.
              </p>
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="px-5 py-2.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-900 rounded-lg inline-flex items-center gap-2 shadow-lg transition-all"
              >
                {isAuthenticating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                Sign in with Google
              </button>
            </div>
          ) : activeTab === 'backup' ? (
            <div className="space-y-4">
              <div className="bg-[#151922] p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Current Session:</span>{' '}
                  <span className="font-mono text-amber-400 font-bold">{ways.length}</span> ways,{' '}
                  <span className="font-mono text-emerald-400 font-bold">{points.length}</span> stiles/points,{' '}
                  <span className="font-mono text-rose-400 font-bold">{reports.length}</span> hazards.
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Warden ID: {wardenId}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Complete JSON Survey */}
                <div className="bg-[#12161f] border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl flex flex-col justify-between transition-all group">
                  <div>
                    <div className="p-2 w-fit rounded-lg bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/20">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold text-white mb-1">PROW Survey (JSON)</h3>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      Complete backup of all paths, stiles, gate conditions, and hazard reports for this area.
                    </p>
                  </div>
                  <button
                    id="export-json-btn"
                    onClick={handleExportJson}
                    disabled={isUploading === 'json'}
                    className="w-full py-2 px-3 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-lg flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isUploading === 'json' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Save JSON to Drive
                  </button>
                </div>

                {/* 2. GPX 1.1 File */}
                <div className="bg-[#12161f] border border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl flex flex-col justify-between transition-all group">
                  <div>
                    <div className="p-2 w-fit rounded-lg bg-cyan-500/10 text-cyan-400 mb-3 border border-cyan-500/20">
                      <Compass className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold text-white mb-1">Trail Track (GPX)</h3>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      Standard GPS waypoint & track format. Load directly into OS Maps, Garmin, or Strava.
                    </p>
                  </div>
                  <button
                    id="export-gpx-btn"
                    onClick={handleExportGpx}
                    disabled={isUploading === 'gpx'}
                    className="w-full py-2 px-3 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isUploading === 'gpx' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Save GPX to Drive
                  </button>
                </div>

                {/* 3. Council Audit CSV */}
                <div className="bg-[#12161f] border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl flex flex-col justify-between transition-all group">
                  <div>
                    <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/20">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold text-white mb-1">Council Audit (CSV)</h3>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      Structured tabular report of broken stiles and blocked paths for Local Highway Authorities.
                    </p>
                  </div>
                  <button
                    id="export-csv-btn"
                    onClick={handleExportCsv}
                    disabled={isUploading === 'csv'}
                    className="w-full py-2 px-3 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isUploading === 'csv' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Save CSV to Drive
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-900/30 p-3 rounded-lg border border-slate-800/60">
                <span className="font-semibold text-slate-400">Google Drive Folder:</span> Files are organized inside{' '}
                <code className="text-[#FFD700]">UK PROW Warden Data</code> in your Drive root folder.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Files stored in Google Drive:
                </span>
                <button
                  id="refresh-drive-files-btn"
                  onClick={loadFiles}
                  disabled={isLoadingFiles}
                  className="text-xs text-[#FFD700] hover:underline flex items-center gap-1"
                >
                  {isLoadingFiles && <Loader2 className="w-3 h-3 animate-spin" />}
                  Refresh
                </button>
              </div>

              {isLoadingFiles ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FFD700] mb-2" />
                  Fetching files from Google Drive...
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-10 bg-[#12161f] rounded-xl border border-slate-800 text-slate-400 text-xs">
                  <FolderSync className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  No survey files found in your Google Drive yet.
                  <div className="mt-2">
                    <button
                      onClick={() => setActiveTab('backup')}
                      className="text-[#FFD700] hover:underline font-semibold"
                    >
                      Export current map data now →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => {
                    const isGpx = file.name.endsWith('.gpx') || file.mimeType === 'application/gpx+xml';
                    const isJson = file.name.endsWith('.json') || file.mimeType === 'application/json';
                    const isCsv = file.name.endsWith('.csv') || file.mimeType === 'text/csv';

                    return (
                      <div
                        key={file.id}
                        className="bg-[#151922] border border-slate-800 hover:border-slate-700 p-3 rounded-lg flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded shrink-0 ${
                              isGpx
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                : isJson
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}
                          >
                            {isGpx ? (
                              <Compass className="w-4 h-4" />
                            ) : isJson ? (
                              <FileCode className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">{file.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>
                                {file.modifiedTime
                                  ? new Date(file.modifiedTime).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Drive File'}
                              </span>
                              {file.size && <span>• {(parseInt(file.size, 10) / 1024).toFixed(1)} KB</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {(isJson || isGpx) && (
                            <button
                              id={`import-file-${file.id}`}
                              onClick={() => handleImportFile(file)}
                              disabled={isImporting === file.id}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded border border-slate-700 flex items-center gap-1 transition-colors"
                              title="Import waypoints & survey data onto the map"
                            >
                              {isImporting === file.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFD700]" />
                              ) : (
                                <Download className="w-3.5 h-3.5 text-[#FFD700]" />
                              )}
                              Import to Map
                            </button>
                          )}

                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            id={`delete-file-btn-${file.id}`}
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
                            title="Delete from Google Drive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#11141d] border-t border-gray-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Google Drive API Enabled</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for Destructive Operations (File Deletion) */}
      {fileToDelete && (
        <div
          id="delete-confirmation-dialog"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90"
        >
          <div className="bg-[#181c26] border border-rose-600/50 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-800">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Delete from Google Drive?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                {fileToDelete.name}
              </strong>{' '}
              from your Google Drive? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                id="cancel-delete-btn"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center gap-1.5 shadow transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
