/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  Navigation, 
  AlertTriangle, 
  User as UserIcon, 
  Info, 
  Settings, 
  Plus, 
  Layers, 
  Compass, 
  RotateCw,
  ShieldCheck,
  Footprints,
  HardDrive,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { ProwWay, ProwPoint, ProwFilterState, ProwReport } from './types';
import { UK_PRESET_LOCATIONS, UkPresetLocation } from './data/ukProwPresets';
import { fetchProwForBounds } from './services/overpassService';
import { initAuth } from './services/firebaseAuth';

import ProwMap, { BaseMapType } from './components/ProwMap';
import ProwLegend from './components/ProwLegend';
import ProwInspector from './components/ProwInspector';
import ReportModal from './components/ReportModal';
import LocationSearch from './components/LocationSearch';
import { GoogleDriveModal } from './components/GoogleDriveModal';

export default function App() {
  const [persistentId, setPersistentId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [trackingStats, setTrackingStats] = useState({ distanceMeters: 0, seconds: 0 });
  const [recordedTrack, setRecordedTrack] = useState<[number, number][]>([]);
  const [baseMap, setBaseMap] = useState<BaseMapType>('osm');
  const [showWaymarkedTrails, setShowWaymarkedTrails] = useState<boolean>(true);

  // Map state
  const defaultPreset = UK_PRESET_LOCATIONS[0]; // Stone & Downs Banks (ST15)
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultPreset.center);
  const [mapZoom, setMapZoom] = useState<number>(defaultPreset.zoom);
  const [currentBounds, setCurrentBounds] = useState<{ south: number; west: number; north: number; east: number; zoom: number } | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);

  // PROW Data
  const [allWays, setAllWays] = useState<ProwWay[]>(() => {
    // Flatten all preset ways
    const waysMap = new Map<string | number, ProwWay>();
    UK_PRESET_LOCATIONS.forEach(loc => loc.ways.forEach(w => waysMap.set(w.id, w)));
    return Array.from(waysMap.values());
  });

  const [allPoints, setAllPoints] = useState<ProwPoint[]>(() => {
    // Flatten all preset points
    const ptsMap = new Map<string | number, ProwPoint>();
    UK_PRESET_LOCATIONS.forEach(loc => loc.points.forEach(p => ptsMap.set(p.id, p)));
    return Array.from(ptsMap.values());
  });

  const [reports, setReports] = useState<ProwReport[]>(() => {
    const saved = localStorage.getItem('warden_reports');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'rep-initial-1',
        type: 'broken_stile',
        category: 'stile',
        coordinates: [52.9241, -2.1479],
        title: 'Loose Top Step on Washdale Stile',
        description: 'Top wooden plank is loose and slippery in wet weather. Take care when stepping over.',
        status: 'active',
        authorId: 'ST15-ALPHA1',
        createdAt: Date.now() - 1000 * 60 * 60 * 24
      }
    ];
  });

  // Filters
  const [filters, setFilters] = useState<ProwFilterState>({
    footpaths: true,
    bridleways: true,
    restrictedByways: true,
    boats: true,
    stiles: true,
    trailheads: true,
    showReports: true
  });

  // Selected item for inspector
  const [selectedWay, setSelectedWay] = useState<ProwWay | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<ProwPoint | null>(null);
  const [selectedReport, setSelectedReport] = useState<ProwReport | null>(null);

  // Modals & Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ way?: ProwWay; point?: ProwPoint } | undefined>(undefined);
  const [isAddingPointMode, setIsAddingPointMode] = useState(false);
  const [pendingAddCoords, setPendingAddCoords] = useState<[number, number] | null>(null);

  // Initialize Persistent ID
  useEffect(() => {
    let id = localStorage.getItem('warden_id');
    if (!id) {
      id = `ST15-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      localStorage.setItem('warden_id', id);
    }
    setPersistentId(id);
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save reports to localStorage
  useEffect(() => {
    localStorage.setItem('warden_reports', JSON.stringify(reports));
  }, [reports]);

  // GPS tracking timer & track recording
  useEffect(() => {
    let interval: any;
    if (isTracking) {
      interval = setInterval(() => {
        setTrackingStats(prev => ({
          seconds: prev.seconds + 1,
          distanceMeters: prev.distanceMeters + 1.2
        }));
      }, 1000);
    } else {
      setTrackingStats({ distanceMeters: 0, seconds: 0 });
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  // Record GPS track coordinates when tracking is active
  useEffect(() => {
    if (isTracking && userPosition) {
      setRecordedTrack(prev => {
        const last = prev[prev.length - 1];
        if (!last || last[0] !== userPosition[0] || last[1] !== userPosition[1]) {
          return [...prev, userPosition];
        }
        return prev;
      });
    }
  }, [isTracking, userPosition]);

  // Geolocation trigger
  const handleLocateMe = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPosition(coords);
          setMapCenter(coords);
          setMapZoom(15);
        },
        (err) => {
          console.warn('Geolocation failed:', err);
          // Fallback to ST15 center
          setMapCenter([52.9234, -2.1482]);
          setMapZoom(14);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Scan current viewport for live OSM PROW, stiles & trailheads
  const handleScanViewport = async () => {
    if (!currentBounds) {
      // If no bounds yet, use default center
      const s = mapCenter[0] - 0.03;
      const n = mapCenter[0] + 0.03;
      const w = mapCenter[1] - 0.04;
      const e = mapCenter[1] + 0.04;
      return runScan(s, w, n, e);
    }
    runScan(currentBounds.south, currentBounds.west, currentBounds.north, currentBounds.east);
  };

  const runScan = async (south: number, west: number, north: number, east: number) => {
    setIsScanning(true);
    try {
      const { ways, points } = await fetchProwForBounds(south, west, north, east);

      if (ways.length > 0) {
        setAllWays(prev => {
          const existingIds = new Set(prev.map(w => w.id));
          const newWays = ways.filter(w => !existingIds.has(w.id));
          return [...prev, ...newWays];
        });
      }

      if (points.length > 0) {
        setAllPoints(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPoints = points.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPoints];
        });
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectLocation = (center: [number, number], zoom: number, preset?: UkPresetLocation) => {
    setMapCenter(center);
    setMapZoom(zoom);
    if (preset) {
      // Merge preset items
      setAllWays(prev => {
        const map = new Map(prev.map(w => [w.id, w]));
        preset.ways.forEach(w => map.set(w.id, w));
        return Array.from(map.values());
      });
      setAllPoints(prev => {
        const map = new Map(prev.map(p => [p.id, p]));
        preset.points.forEach(p => map.set(p.id, p));
        return Array.from(map.values());
      });
    }
  };

  const handleOpenReportModal = (target?: { way?: ProwWay; point?: ProwPoint }) => {
    setReportTarget(target);
    setShowReportModal(true);
  };

  const handleMapClickForNewPoint = (coords: [number, number]) => {
    setPendingAddCoords(coords);
    setIsAddingPointMode(false);
    setShowReportModal(true);
  };

  const handleImportData = (data: { ways?: ProwWay[]; points?: ProwPoint[]; reports?: ProwReport[] }) => {
    if (data.ways && data.ways.length > 0) {
      setAllWays(prev => {
        const map = new Map(prev.map(w => [w.id, w]));
        data.ways!.forEach(w => map.set(w.id, w));
        return Array.from(map.values());
      });
    }

    if (data.points && data.points.length > 0) {
      setAllPoints(prev => {
        const map = new Map(prev.map(p => [p.id, p]));
        data.points!.forEach(p => map.set(p.id, p));
        return Array.from(map.values());
      });
      // Center map on the first imported point if available
      if (data.points[0]?.coordinates) {
        setMapCenter(data.points[0].coordinates);
        setMapZoom(15);
      }
    }

    if (data.reports && data.reports.length > 0) {
      setReports(prev => {
        const map = new Map(prev.map(r => [r.id, r]));
        data.reports!.forEach(r => map.set(r.id, r));
        return Array.from(map.values());
      });
    }
  };

  // Counts for legend
  const itemCounts = {
    footpaths: allWays.filter(w => w.prowType === 'footpath').length,
    bridleways: allWays.filter(w => w.prowType === 'bridleway').length,
    restrictedByways: allWays.filter(w => w.prowType === 'restricted_byway').length,
    boats: allWays.filter(w => w.prowType === 'boat').length,
    stiles: allPoints.filter(p => p.type === 'stile' || p.type === 'kissing_gate' || p.type === 'gate').length,
    trailheads: allPoints.filter(p => p.type === 'trailhead' || p.type === 'guidepost').length
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-[#FFD700] font-sans">
      {/* Top Floating Unified Header: Search & Action Buttons */}
      <header className="absolute top-3 inset-x-3 z-[1100] flex items-center justify-between gap-2 pointer-events-none">
        {/* Search Bar Container */}
        <div className="flex-1 max-w-md md:max-w-lg min-w-0 pointer-events-auto">
          <LocationSearch
            onSelectLocation={handleSelectLocation}
            onLocateMe={handleLocateMe}
          />
        </div>

        {/* Right Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 pointer-events-auto">
          {/* Google Drive Button */}
          <button
            id="open-drive-sync-btn"
            onClick={() => setShowDriveModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl shadow-2xl backdrop-blur-md transition-all text-xs font-bold border h-[42px] shrink-0 ${
              currentUser
                ? 'bg-black/90 border-emerald-500/80 text-emerald-400 hover:bg-emerald-950/40'
                : 'bg-black/90 border-[#FFD700]/70 text-[#FFD700] hover:bg-[#FFD700]/15'
            }`}
            title="Google Drive Trail Sync & Backup"
          >
            {currentUser ? (
              currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Drive User'}
                  className="w-4 h-4 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <HardDrive size={15} className="text-emerald-400" />
              )
            ) : (
              <HardDrive size={15} className="text-[#FFD700]" />
            )}
            <span className="hidden md:inline">{currentUser ? 'Drive Synced' : 'Google Drive'}</span>
          </button>

          {/* Warden User ID Badge / Menu */}
          <button
            id="user-menu-btn"
            onClick={() => setShowMenu(true)}
            className="flex items-center gap-2 bg-black/90 border border-[#FFD700] px-3 py-2 rounded-2xl shadow-2xl backdrop-blur-md hover:bg-[#FFD700]/10 transition-colors text-xs font-mono font-bold h-[42px] shrink-0"
            title="Warden ID & Options Menu"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="hidden sm:inline truncate max-w-[90px]">{persistentId}</span>
            <UserIcon size={16} className="text-[#FFD700] shrink-0" />
          </button>
        </div>
      </header>

      {/* PROW Layers & Legend Control */}
      <ProwLegend
        filters={filters}
        onFilterChange={setFilters}
        onScanArea={handleScanViewport}
        isScanning={isScanning}
        itemCounts={itemCounts}
        baseMap={baseMap}
        onBaseMapChange={setBaseMap}
        showWaymarkedTrails={showWaymarkedTrails}
        onToggleWaymarkedTrails={setShowWaymarkedTrails}
      />

      {/* Main Map Canvas */}
      <ProwMap
        ways={allWays}
        points={allPoints}
        reports={reports}
        filters={filters}
        selectedWay={selectedWay}
        selectedPoint={selectedPoint}
        onSelectWay={setSelectedWay}
        onSelectPoint={setSelectedPoint}
        onSelectReport={setSelectedReport}
        onViewportChange={setCurrentBounds}
        center={mapCenter}
        zoom={mapZoom}
        userPosition={userPosition}
        recordedTrack={recordedTrack}
        isAddingPoint={isAddingPointMode}
        onMapClickForNewPoint={handleMapClickForNewPoint}
        baseMap={baseMap}
        showWaymarkedTrails={showWaymarkedTrails}
      />

      {/* Inspector Sheet */}
      <ProwInspector
        selectedWay={selectedWay}
        selectedPoint={selectedPoint}
        selectedReport={selectedReport}
        onClose={() => {
          setSelectedWay(null);
          setSelectedPoint(null);
          setSelectedReport(null);
        }}
        onOpenReport={handleOpenReportModal}
      />

      {/* Bottom Floating Bar */}
      <div className="absolute bottom-3 sm:bottom-6 left-0 right-0 z-[1000] px-3 sm:px-4 max-w-lg landscape:max-w-md mx-auto flex flex-col gap-2 sm:gap-3 pointer-events-none">
        {/* Active Tracking Status Pill */}
        <AnimatePresence>
          {isTracking && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-[#FFD700] text-black px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full self-center flex items-center gap-2.5 sm:gap-3 font-mono font-bold text-[11px] sm:text-xs shadow-2xl pointer-events-auto border-2 border-black"
            >
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-600 rounded-full animate-ping" />
              <span>RECORDING TRAIL: {Math.floor(trackingStats.seconds / 60)}m {trackingStats.seconds % 60}s</span>
              <span className="bg-black text-[#FFD700] px-2 py-0.5 rounded text-[10px]">
                {(trackingStats.distanceMeters / 1000).toFixed(2)} km
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* Add Stile / Waypoint Button */}
          <button
            onClick={() => setIsAddingPointMode(!isAddingPointMode)}
            className={`p-3 sm:p-4 rounded-2xl border-2 font-bold flex items-center justify-center transition-all shadow-xl active:scale-95 shrink-0 ${
              isAddingPointMode 
                ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                : 'bg-black border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10'
            }`}
            title="Mark Stile or Trailhead on Map"
          >
            <Plus size={20} className={isAddingPointMode ? 'rotate-45 transition-transform' : ''} />
          </button>

          {/* Report Hazard Button */}
          <button
            onClick={() => handleOpenReportModal()}
            className="flex-1 bg-black border-2 border-[#FFD700] text-[#FFD700] py-3 sm:py-4 px-2 rounded-2xl font-black text-[11px] sm:text-xs tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 active:scale-98 transition-all shadow-xl hover:bg-[#FFD700]/10"
          >
            <AlertTriangle size={16} />
            <span className="truncate">REPORT HAZARD</span>
          </button>

          {/* Track / Break Trail Button */}
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`flex-1 py-3 sm:py-4 px-2 rounded-2xl font-black text-[11px] sm:text-xs tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 active:scale-98 transition-all shadow-xl border-2 ${
              isTracking 
                ? 'bg-red-600 text-white border-red-500 hover:bg-red-700' 
                : 'bg-[#FFD700] text-black border-[#FFD700] hover:bg-[#FFD700]/90'
            }`}
          >
            <Navigation size={16} className={isTracking ? 'animate-spin' : ''} />
            <span className="truncate">{isTracking ? 'STOP LOGGING' : 'BREAK TRAIL'}</span>
          </button>
        </div>
      </div>

      {/* Report / Add Stile Modal */}
      {showReportModal && (
        <ReportModal
          initialTarget={reportTarget}
          userCoordinates={pendingAddCoords || userPosition || mapCenter}
          persistentId={persistentId}
          onClose={() => {
            setShowReportModal(false);
            setReportTarget(undefined);
            setPendingAddCoords(null);
          }}
          onSubmitReport={(newRep) => {
            setReports(prev => [newRep, ...prev]);
            setSelectedReport(newRep);
          }}
          onAddNewPoint={(newPt) => {
            setAllPoints(prev => [newPt, ...prev]);
            setSelectedPoint(newPt);
          }}
        />
      )}

      {/* Side Menu Drawer */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 bottom-0 z-[2001] w-80 bg-black border-l-2 border-[#FFD700] p-6 flex flex-col gap-6 text-[#FFD700] pointer-events-auto shadow-2xl overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-3 border-b border-[#FFD700]/30">
                <div className="flex items-center gap-2">
                  <div className="bg-[#FFD700] text-black px-2 py-0.5 rounded font-black text-xs">
                    WARDEN
                  </div>
                  <span className="font-bold text-sm">UK PROW</span>
                </div>
                <button 
                  onClick={() => setShowMenu(false)} 
                  className="text-zinc-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* ID Card */}
                <div className="p-4 bg-zinc-950 rounded-2xl border border-[#FFD700]/40 space-y-1">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    Warden Crowd Identity
                  </div>
                  <div className="font-mono text-xl font-black text-white">{persistentId}</div>
                  <div className="text-[10px] text-zinc-400">
                    Local persistent identifier for anonymous trail reporting.
                  </div>
                </div>

                {/* PROW Stats */}
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2 text-xs">
                  <div className="font-bold text-zinc-300 flex items-center justify-between">
                    <span>Cached UK Database</span>
                    <span className="text-[#FFD700] font-mono">{allWays.length} Paths</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                    <div>Footpaths: {itemCounts.footpaths}</div>
                    <div>Bridleways: {itemCounts.bridleways}</div>
                    <div>Restricted: {itemCounts.restrictedByways}</div>
                    <div>BOATs: {itemCounts.boats}</div>
                    <div>Stiles: {itemCounts.stiles}</div>
                    <div>Trailheads: {itemCounts.trailheads}</div>
                  </div>
                </div>

                {/* Menu items */}
                <nav className="space-y-2 pt-2">
                  <button
                    id="menu-open-drive-sync-btn"
                    onClick={() => {
                      setShowDriveModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-emerald-950/40 hover:bg-emerald-950/70 rounded-xl transition-colors text-left text-xs font-bold text-emerald-300 border border-emerald-800/80 hover:border-emerald-600"
                  >
                    <HardDrive size={18} className="text-emerald-400" />
                    <div>
                      <div>Google Drive Trail Sync</div>
                      <div className="text-[10px] text-emerald-500 font-normal">
                        {currentUser ? `Connected: ${currentUser.email}` : 'Backup to Google Drive (JSON / GPX / CSV)'}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowAboutModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[#FFD700]/10 rounded-xl transition-colors text-left text-xs font-bold text-white border border-transparent hover:border-[#FFD700]/20"
                  >
                    <Info size={18} className="text-[#FFD700]" />
                    <span>UK Rights of Way Law Guide</span>
                  </button>

                  <button
                    onClick={handleScanViewport}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[#FFD700]/10 rounded-xl transition-colors text-left text-xs font-bold text-white border border-transparent hover:border-[#FFD700]/20"
                  >
                    <RotateCw size={18} className="text-[#FFD700]" />
                    <span>Force Overpass API Refresh</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("Reset local hazard reports and cached points?")) {
                        localStorage.removeItem('warden_reports');
                        window.location.reload();
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-red-950/30 rounded-xl transition-colors text-left text-xs font-bold text-red-400 border border-transparent hover:border-red-500/20"
                  >
                    <AlertTriangle size={18} />
                    <span>Clear Local Cache & Reports</span>
                  </button>
                </nav>
              </div>

              <div className="mt-auto pt-6 border-t border-zinc-800 text-[10px] text-zinc-500 font-mono space-y-1">
                <div>WARDEN CROWD v0.3.0-PROW</div>
                <div>UK Definitive Map & Overpass OSM</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* UK PROW Law Guide Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="bg-black border-2 border-[#FFD700] rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-full bg-zinc-900"
            >
              ✕
            </button>

            <div className="flex items-center gap-2">
              <ShieldCheck size={24} className="text-[#FFD700]" />
              <h2 className="text-xl font-black text-[#FFD700]">UK Public Rights of Way (PROW)</h2>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p>
                In England & Wales, Public Rights of Way are protected under the <strong>Countryside and Rights of Way Act 2000</strong> and recorded on local council Definitive Maps.
              </p>

              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
                <div className="font-bold text-[#FFD700] text-sm">🥾 Public Footpath (FP)</div>
                <p>Open for walking only (along with dogs under close control, pushchairs, and wheelchairs). Cycling or horse riding without landowner permission is a trespass.</p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
                <div className="font-bold text-cyan-400 text-sm">🐴 Public Bridleway (BW)</div>
                <p>Open for walkers, horse riders, and pedal cyclists (cyclists must give way to walkers and riders).</p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
                <div className="font-bold text-purple-400 text-sm">🟣 Restricted Byway (RB)</div>
                <p>Open for walkers, cyclists, horse riders, and non-motorized horse-drawn vehicles / carriages. Motorized vehicles are strictly prohibited.</p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
                <div className="font-bold text-orange-400 text-sm">🚙 Byway Open to All Traffic (BOAT)</div>
                <p>A highway over which the public has a right of way for vehicular and all other kinds of traffic, but which is used mainly for walking and riding.</p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
                <div className="font-bold text-white text-sm">🪜 Stiles & Trailheads</div>
                <p>Stiles are boundary crossings that landowners must keep in safe repair (often subsidized 25% by local councils). Trailheads mark access points with guidepost information.</p>
              </div>
            </div>

            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full py-3 bg-[#FFD700] text-black font-black text-xs rounded-xl"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* Google Drive Modal */}
      <GoogleDriveModal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
        currentUser={currentUser}
        onAuthChange={setCurrentUser}
        ways={allWays}
        points={allPoints}
        reports={reports}
        recordedTrack={recordedTrack}
        onImportData={handleImportData}
        wardenId={persistentId}
      />
    </div>
  );
}
