import { ProwWay, ProwPoint, ProwReport } from '../types';
import { 
  Footprints, 
  Compass, 
  AlertTriangle, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  ExternalLink,
  Navigation2,
  Share2,
  Info
} from 'lucide-react';

interface ProwInspectorProps {
  selectedWay: ProwWay | null;
  selectedPoint: ProwPoint | null;
  selectedReport?: ProwReport | null;
  onClose: () => void;
  onOpenReport: (item: { way?: ProwWay; point?: ProwPoint }) => void;
}

export default function ProwInspector({
  selectedWay,
  selectedPoint,
  selectedReport,
  onClose,
  onOpenReport
}: ProwInspectorProps) {
  if (!selectedWay && !selectedPoint && !selectedReport) return null;

  const renderWayDetails = (way: ProwWay) => {
    const isFootpath = way.prowType === 'footpath';
    const isBridlewayResult = way.prowType === 'bridleway';
    const isRestrictedByway = way.prowType === 'restricted_byway';
    const isBoat = way.prowType === 'boat';

    const typeBadgeBg = 
      isFootpath ? 'bg-[#FFD700] text-black' :
      isBridlewayResult ? 'bg-cyan-400 text-black' :
      isRestrictedByway ? 'bg-purple-500 text-white' :
      'bg-orange-500 text-white';

    const designationTitle = 
      isFootpath ? 'Public Footpath (FP)' :
      isBridlewayResult ? 'Public Bridleway (BW)' :
      isRestrictedByway ? 'Restricted Byway (RB)' :
      'Byway Open to All Traffic (BOAT)';

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className={`px-2.5 py-1 rounded text-xs font-black tracking-wider uppercase ${typeBadgeBg}`}>
              {way.prowType.replace('_', ' ')}
            </span>
            <h3 className="text-xl font-black text-white mt-2 leading-tight">
              {way.name || designationTitle}
            </h3>
            {way.ref && (
              <p className="text-xs font-mono text-[#FFD700] mt-0.5">
                Definitive Map Ref: {way.ref}
              </p>
            )}
          </div>
        </div>

        {/* Legal Rights Matrix */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Info size={14} className="text-[#FFD700]" />
            UK Legal Right of Access
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-1.5 rounded bg-zinc-900/80 border border-zinc-800">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>Walkers & Dogs</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded bg-zinc-900/80 border border-zinc-800">
              {isBridlewayResult || isRestrictedByway || isBoat ? (
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              ) : (
                <XCircle size={15} className="text-red-400 shrink-0" />
              )}
              <span className={!(isBridlewayResult || isRestrictedByway || isBoat) ? 'text-zinc-500' : ''}>
                Horse Riders
              </span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded bg-zinc-900/80 border border-zinc-800">
              {isBridlewayResult || isRestrictedByway || isBoat ? (
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              ) : (
                <XCircle size={15} className="text-red-400 shrink-0" />
              )}
              <span className={!(isBridlewayResult || isRestrictedByway || isBoat) ? 'text-zinc-500' : ''}>
                Cyclists
              </span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded bg-zinc-900/80 border border-zinc-800">
              {isBoat ? (
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              ) : (
                <XCircle size={15} className="text-red-400 shrink-0" />
              )}
              <span className={!isBoat ? 'text-zinc-500' : ''}>
                Motorized Vehicles
              </span>
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl">
            <div className="text-zinc-400">Surface Type</div>
            <div className="text-white font-medium capitalize mt-0.5">{way.surface || 'Unsurfaced/Grass'}</div>
          </div>
          <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl">
            <div className="text-zinc-400">Parish / Authority</div>
            <div className="text-white font-medium mt-0.5">{way.parish || 'UK County Council'}</div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onOpenReport({ way })}
          className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-98 text-sm"
        >
          <AlertTriangle size={17} />
          Report Obstruction / Issue on this Path
        </button>
      </div>
    );
  };

  const renderPointDetails = (point: ProwPoint) => {
    const isStile = point.type === 'stile';
    const isTrailhead = point.type === 'trailhead';
    const isGate = point.type === 'kissing_gate' || point.type === 'gate';
    const isGuidepost = point.type === 'guidepost';

    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-xs font-black tracking-wider uppercase bg-[#FFD700] text-black">
              {isStile ? 'Stile' : isTrailhead ? 'Trailhead' : isGate ? 'Gate' : 'Guidepost'}
            </span>
            {point.condition && (
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                point.condition === 'good' ? 'bg-emerald-950 border border-emerald-500 text-emerald-400' :
                point.condition === 'fair' ? 'bg-amber-950 border border-amber-500 text-amber-300' :
                'bg-red-950 border border-red-500 text-red-400'
              }`}>
                {point.condition} Condition
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-white mt-2 leading-tight">
            {point.name || point.subType || 'Access Waypoint'}
          </h3>
          {point.subType && point.name !== point.subType && (
            <p className="text-xs text-zinc-400 mt-1">{point.subType}</p>
          )}
        </div>

        {/* Stile specific features */}
        {isStile && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Dog-Friendly (Dog Gate/Lift):</span>
              <span className={`font-bold flex items-center gap-1 ${point.dogFriendly ? 'text-emerald-400' : 'text-amber-400'}`}>
                {point.dogFriendly ? '🐾 Yes (Dog Hatch)' : '⚠️ No (Lift Dog Over)'}
              </span>
            </div>
            {point.elevation && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Elevation:</span>
                <span className="text-white font-mono">{point.elevation} m</span>
              </div>
            )}
          </div>
        )}

        {/* Trailhead specific features */}
        {isTrailhead && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="text-zinc-300">
              Official starting point for designated UK trails and National Paths. Includes trail board / parking access.
            </div>
          </div>
        )}

        {point.notes && (
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300">
            <span className="text-zinc-500 font-bold block mb-1">WARDEN NOTES</span>
            {point.notes}
          </div>
        )}

        {/* Coordinates */}
        <div className="p-2.5 bg-black/60 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-400 flex items-center justify-between">
          <span>GPS: {point.coordinates[0].toFixed(5)}, {point.coordinates[1].toFixed(5)}</span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${point.coordinates[0]},${point.coordinates[1]}`);
              alert("GPS coordinates copied to clipboard!");
            }}
            className="text-[#FFD700] hover:underline"
          >
            Copy
          </button>
        </div>

        {/* Report Button */}
        <button
          onClick={() => onOpenReport({ point })}
          className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-98 text-sm"
        >
          <AlertTriangle size={17} />
          Report Stile or Access Hazard
        </button>
      </div>
    );
  };

  const renderReportDetails = (report: ProwReport) => {
    return (
      <div className="space-y-4">
        <div>
          <span className="px-2.5 py-1 rounded text-xs font-black tracking-wider uppercase bg-red-600 text-white">
            COMMUNITY HAZARD REPORT
          </span>
          <h3 className="text-xl font-black text-white mt-2 leading-tight">
            {report.title}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">Reported by Warden {report.authorId}</p>
        </div>

        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300">
          <span className="text-zinc-500 font-bold block mb-1">HAZARD DETAILS</span>
          {report.description}
        </div>

        <div className="p-2.5 bg-black/60 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-400">
          Status: <span className="text-amber-400 uppercase font-bold">{report.status}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1500] max-w-lg mx-auto p-4 pointer-events-auto">
      <div className="bg-black/95 border-2 border-[#FFD700] rounded-2xl p-5 shadow-2xl backdrop-blur-md relative max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full bg-zinc-900"
        >
          ✕
        </button>
        {selectedWay && renderWayDetails(selectedWay)}
        {selectedPoint && renderPointDetails(selectedPoint)}
        {selectedReport && renderReportDetails(selectedReport)}
      </div>
    </div>
  );
}
