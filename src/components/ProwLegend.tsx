import { useState, useRef, useEffect } from 'react';
import { ProwFilterState } from '../types';
import { BaseMapType } from './ProwMap';
import { 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  RotateCw, 
  Sparkles,
  Footprints,
  Compass,
  Car,
  Fence,
  Flag,
  Map as MapIcon,
  Moon,
  Sun,
  Globe,
  X
} from 'lucide-react';

interface ProwLegendProps {
  filters: ProwFilterState;
  onFilterChange: (filters: ProwFilterState) => void;
  onScanArea: () => void;
  isScanning: boolean;
  itemCounts: {
    footpaths: number;
    bridleways: number;
    restrictedByways: number;
    boats: number;
    stiles: number;
    trailheads: number;
  };
  baseMap: BaseMapType;
  onBaseMapChange: (map: BaseMapType) => void;
  showWaymarkedTrails: boolean;
  onToggleWaymarkedTrails: (show: boolean) => void;
}

export default function ProwLegend({
  filters,
  onFilterChange,
  onScanArea,
  isScanning,
  itemCounts,
  baseMap,
  onBaseMapChange,
  showWaymarkedTrails,
  onToggleWaymarkedTrails
}: ProwLegendProps) {
  const [isOpen, setIsOpen] = useState(false);
  const legendRef = useRef<HTMLDivElement>(null);

  // Close legend on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (legendRef.current && !legendRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleFilter = (key: keyof ProwFilterState) => {
    onFilterChange({
      ...filters,
      [key]: !filters[key]
    });
  };

  return (
    <div ref={legendRef} className="absolute top-[62px] left-3 z-[1300] w-[calc(100vw-24px)] max-w-xs sm:w-80 pointer-events-auto">
      {/* Header Pill */}
      <div className="bg-black/95 border border-[#FFD700] rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-[#FFD700]">
        <div 
          className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-[#FFD700]/10 transition-colors" 
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700] animate-pulse shrink-0" />
            <div className="font-mono text-xs font-black tracking-wider">
              UK PROW LAYERS
            </div>
            <span className="text-[10px] bg-[#FFD700]/20 text-[#FFD700] px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
              {itemCounts.footpaths + itemCounts.bridleways + itemCounts.restrictedByways + itemCounts.boats + itemCounts.stiles + itemCounts.trailheads} ITEMS
            </span>
          </div>
          <button 
            type="button"
            className="text-[#FFD700] p-1 hover:bg-[#FFD700]/20 rounded-lg shrink-0"
            title={isOpen ? "Collapse Menu" : "Expand Menu"}
          >
            {isOpen ? <X size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Expandable Filter & Base Map Panel */}
        {isOpen && (
          <div className="p-3 border-t border-[#FFD700]/20 space-y-3 bg-zinc-950/95 max-h-[calc(100vh-100px)] overflow-y-auto overscroll-contain shadow-2xl">
            {/* Quick Overpass Scan Button */}
            <button
              onClick={onScanArea}
              disabled={isScanning}
              className="w-full py-2 px-3 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCw size={14} className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? 'Scanning Viewport Overpass...' : 'Scan Viewport PROW & Stiles'}
            </button>

            {/* Base Map Selector */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                Base Map Style
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => onBaseMapChange('osm')}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center gap-1 border ${
                    baseMap === 'osm'
                      ? 'bg-[#FFD700] text-black border-[#FFD700] shadow'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <MapIcon size={13} />
                  <span>Standard</span>
                </button>

                <button
                  type="button"
                  onClick={() => onBaseMapChange('dark')}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center gap-1 border ${
                    baseMap === 'dark'
                      ? 'bg-[#FFD700] text-black border-[#FFD700] shadow'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <Moon size={13} />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => onBaseMapChange('satellite')}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center gap-1 border ${
                    baseMap === 'satellite'
                      ? 'bg-[#FFD700] text-black border-[#FFD700] shadow'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <Globe size={13} />
                  <span>Satellite</span>
                </button>
              </div>
            </div>

            {/* Map Overlays: Waymarked Trails UK */}
            <div className="pt-1">
              <label className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-[#FFD700]/40 cursor-pointer text-xs transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showWaymarkedTrails}
                    onChange={(e) => onToggleWaymarkedTrails(e.target.checked)}
                    className="accent-[#FFD700] rounded"
                  />
                  <span className="text-zinc-200 font-medium">Waymarked Trails UK</span>
                </div>
                <span className="font-mono text-[9px] text-[#FFD700] bg-[#FFD700]/10 px-1 py-0.5 rounded">
                  OSM HIKING
                </span>
              </label>
            </div>

            {/* Path Layers */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1">
                Rights of Way Designations
              </div>

              {/* Public Footpaths */}
              <label 
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-[#FFD700]/40 cursor-pointer text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.footpaths}
                    onChange={() => toggleFilter('footpaths')}
                    className="accent-[#FFD700] rounded"
                  />
                  <div className="w-4 h-0 border-t-2 border-dashed border-[#FFD700]" />
                  <span className="text-zinc-200 font-medium">Public Footpaths</span>
                </div>
                <span className="font-mono text-[10px] text-[#FFD700] bg-[#FFD700]/10 px-1.5 py-0.5 rounded">
                  {itemCounts.footpaths}
                </span>
              </label>

              {/* Public Bridleways */}
              <label 
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-cyan-400/40 cursor-pointer text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.bridleways}
                    onChange={() => toggleFilter('bridleways')}
                    className="accent-cyan-400 rounded"
                  />
                  <div className="w-4 h-0 border-t-2 border-dashed border-cyan-400" />
                  <span className="text-zinc-200 font-medium">Public Bridleways</span>
                </div>
                <span className="font-mono text-[10px] text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                  {itemCounts.bridleways}
                </span>
              </label>

              {/* Restricted Byways */}
              <label 
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-purple-400/40 cursor-pointer text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.restrictedByways}
                    onChange={() => toggleFilter('restrictedByways')}
                    className="accent-purple-400 rounded"
                  />
                  <div className="w-4 h-0 border-t-2 border-dashed border-purple-400" />
                  <span className="text-zinc-200 font-medium">Restricted Byways</span>
                </div>
                <span className="font-mono text-[10px] text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">
                  {itemCounts.restrictedByways}
                </span>
              </label>

              {/* BOATs */}
              <label 
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-orange-400/40 cursor-pointer text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.boats}
                    onChange={() => toggleFilter('boats')}
                    className="accent-orange-400 rounded"
                  />
                  <div className="w-4 h-0 border-t-2 border-solid border-orange-500" />
                  <span className="text-zinc-200 font-medium">Byways (BOATs)</span>
                </div>
                <span className="font-mono text-[10px] text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">
                  {itemCounts.boats}
                </span>
              </label>
            </div>

            {/* Access Obstacles & Waypoints */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1">
                Access Points & Trailheads
              </div>

              {/* Stiles & Gates */}
              <label 
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-amber-400/40 cursor-pointer text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.stiles}
                    onChange={() => toggleFilter('stiles')}
                    className="accent-[#FFD700] rounded"
                  />
                  <div className="w-4 h-4 rounded bg-black border border-[#FFD700] flex items-center justify-center text-[9px]">
                    🪜
                  </div>
                  <span className="text-zinc-200 font-medium">Stiles & Gates</span>
                </div>
                <span className="font-mono text-[10px] text-[#FFD700] bg-[#FFD700]/10 px-1.5 py-0.5 rounded">
                  {itemCounts.stiles}
                </span>
              </label>

              {/* Trailheads */}
              <label 
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-amber-400/40 cursor-pointer text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.trailheads}
                    onChange={() => toggleFilter('trailheads')}
                    className="accent-[#FFD700] rounded"
                  />
                  <div className="w-4 h-4 rounded bg-[#FFD700] text-black flex items-center justify-center text-[9px] font-bold">
                    🚩
                  </div>
                  <span className="text-zinc-200 font-medium">Trailheads & Posts</span>
                </div>
                <span className="font-mono text-[10px] text-[#FFD700] bg-[#FFD700]/10 px-1.5 py-0.5 rounded">
                  {itemCounts.trailheads}
                </span>
              </label>
            </div>

            <div className="text-[10px] text-zinc-500 font-mono text-center pt-1 border-t border-zinc-800">
              Click any path or stile to inspect legal status & details.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
