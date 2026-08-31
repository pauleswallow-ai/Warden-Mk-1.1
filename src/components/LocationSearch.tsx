import { useState, useRef, useEffect, FormEvent } from 'react';
import { Search, MapPin, Navigation, Sparkles, X, Loader2 } from 'lucide-react';
import { searchUkLocation } from '../services/overpassService';
import { UK_PRESET_LOCATIONS, UkPresetLocation } from '../data/ukProwPresets';

interface LocationSearchProps {
  onSelectLocation: (center: [number, number], zoom: number, preset?: UkPresetLocation) => void;
  onLocateMe: () => void;
  className?: string;
}

export default function LocationSearch({ onSelectLocation, onLocateMe, className = '' }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPresets(false);
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setShowPresets(false);
    const searchResults = await searchUkLocation(query);
    setResults(searchResults);
    setIsSearching(false);
  };

  const handleSelectPreset = (preset: UkPresetLocation) => {
    onSelectLocation(preset.center, preset.zoom, preset);
    setShowPresets(false);
    setQuery(preset.name);
    setResults([]);
  };

  const handleSelectSearchResult = (res: any) => {
    onSelectLocation([res.lat, res.lon], 14);
    setResults([]);
    setShowPresets(false);
    setQuery(res.name);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center bg-black/90 border border-[#FFD700] rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden h-[42px]">
          <button 
            type="submit" 
            className="p-2.5 text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors shrink-0 flex items-center justify-center"
            title="Search UK location"
          >
            {isSearching ? <Loader2 size={16} className="animate-spin text-[#FFD700]" /> : <Search size={16} />}
          </button>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search UK Postcode (e.g. ST15), Town, Trail..."
            className="w-full min-w-0 bg-transparent py-2 px-1 text-xs text-white placeholder:text-zinc-500 font-medium focus:outline-none truncate"
          />

          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); }}
              className="p-1.5 text-zinc-400 hover:text-white shrink-0"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setShowPresets(!showPresets);
              setResults([]);
            }}
            className={`px-2 py-1 mr-1 text-[11px] rounded-xl font-bold font-mono transition-colors flex items-center gap-1 border shrink-0 ${
              showPresets
                ? 'bg-[#FFD700] text-black border-[#FFD700]'
                : 'bg-[#FFD700]/10 hover:bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30'
            }`}
            title="Popular UK Rights of Way Hotspots"
          >
            <Sparkles size={11} />
            <span className="hidden xs:inline sm:inline">Hotspots</span>
          </button>

          <button
            type="button"
            onClick={onLocateMe}
            title="Center on my GPS Location"
            className="h-full px-3 text-black bg-[#FFD700] hover:bg-[#FFD700]/90 transition-colors shrink-0 flex items-center justify-center font-bold"
          >
            <Navigation size={14} />
          </button>
        </div>
      </form>

      {/* Preset Selector Dropdown */}
      {showPresets && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[1300] bg-black/95 border border-[#FFD700] rounded-2xl p-2.5 shadow-2xl backdrop-blur-md space-y-1.5 max-h-[65vh] overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-1 flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="text-[#FFD700]">Iconic UK Rights of Way Hotspots</span>
            <button onClick={() => setShowPresets(false)} className="text-zinc-400 hover:text-white p-0.5">✕</button>
          </div>
          <div className="grid grid-cols-1 gap-1 pt-1">
            {UK_PRESET_LOCATIONS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className="w-full text-left p-2 rounded-xl hover:bg-[#FFD700]/15 border border-transparent hover:border-[#FFD700]/30 transition-all flex items-center justify-between group"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-bold text-white group-hover:text-[#FFD700] truncate">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    {preset.region} ({preset.postcode})
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded shrink-0 whitespace-nowrap">
                  {preset.ways.length} Ways / {preset.points.length} Stiles
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Geocoding Results */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[1300] bg-black/95 border border-[#FFD700] rounded-2xl p-2 shadow-2xl backdrop-blur-md space-y-1 max-h-[65vh] overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-1 flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="text-[#FFD700]">Search Results (UK)</span>
            <button onClick={() => setResults([])} className="text-zinc-400 hover:text-white p-0.5">✕</button>
          </div>
          <div className="space-y-1 pt-1">
            {results.map((res, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSearchResult(res)}
                className="w-full text-left p-2 rounded-xl hover:bg-[#FFD700]/15 transition-colors flex items-start gap-2.5"
              >
                <MapPin size={14} className="text-[#FFD700] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{res.name}</div>
                  <div className="text-[10px] text-zinc-400 truncate">{res.display_name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
