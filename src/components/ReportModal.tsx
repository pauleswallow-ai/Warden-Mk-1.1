import { useState, FormEvent } from 'react';
import { ProwWay, ProwPoint, ProwReport } from '../types';
import { AlertTriangle, Plus, MapPin, CheckCircle, X } from 'lucide-react';

interface ReportModalProps {
  initialTarget?: { way?: ProwWay; point?: ProwPoint };
  userCoordinates?: [number, number] | null;
  persistentId: string;
  onClose: () => void;
  onSubmitReport: (report: ProwReport) => void;
  onAddNewPoint?: (newPoint: ProwPoint) => void;
}

export default function ReportModal({
  initialTarget,
  userCoordinates,
  persistentId,
  onClose,
  onSubmitReport,
  onAddNewPoint
}: ReportModalProps) {
  const [mode, setMode] = useState<'hazard' | 'add_stile'>('hazard');
  const [reportType, setReportType] = useState<ProwReport['type']>('broken_stile');
  const [title, setTitle] = useState(
    initialTarget?.point?.name 
      ? `Issue at ${initialTarget.point.name}` 
      : initialTarget?.way?.name 
      ? `Obstruction on ${initialTarget.way.name}`
      : 'Path Obstruction'
  );
  const [description, setDescription] = useState('');
  
  // Add new stile/trailhead state
  const [pointType, setPointType] = useState<'stile' | 'trailhead' | 'kissing_gate'>('stile');
  const [pointName, setPointName] = useState('');
  const [stileSubType, setStileSubType] = useState('Timber Step Stile');
  const [dogFriendly, setDogFriendly] = useState(true);
  const [condition, setCondition] = useState<'good' | 'fair' | 'broken'>('good');

  const coords = initialTarget?.point?.coordinates || 
    (initialTarget?.way?.coordinates && initialTarget.way.coordinates[0]) || 
    userCoordinates || 
    [52.9234, -2.1482];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (mode === 'hazard') {
      const newReport: ProwReport = {
        id: `rep-${Date.now()}`,
        targetId: initialTarget?.point?.id || initialTarget?.way?.id,
        type: reportType,
        category: initialTarget?.point ? 'stile' : 'path',
        coordinates: coords as [number, number],
        title: title || 'Warden Field Hazard Report',
        description: description || 'Reported hazard on UK Public Right of Way.',
        status: 'active',
        authorId: persistentId,
        createdAt: Date.now()
      };
      onSubmitReport(newReport);
    } else if (mode === 'add_stile' && onAddNewPoint) {
      const newPoint: ProwPoint = {
        id: `user-pt-${Date.now()}`,
        type: pointType,
        name: pointName || (pointType === 'stile' ? 'Field Step Stile' : pointType === 'trailhead' ? 'Public Trailhead' : 'Kissing Gate'),
        coordinates: coords as [number, number],
        subType: stileSubType,
        dogFriendly,
        condition,
        notes: description || 'Marked by Warden crowd user.',
        reportedBy: persistentId,
        timestamp: Date.now()
      };
      onAddNewPoint(newPoint);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
      <div className="bg-black border-2 border-[#FFD700] rounded-3xl max-w-md w-full p-6 text-[#FFD700] shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-full bg-zinc-900"
        >
          <X size={18} />
        </button>

        {/* Tab Toggle */}
        <div className="flex bg-zinc-900 p-1 rounded-xl mb-5 border border-zinc-800">
          <button
            type="button"
            onClick={() => setMode('hazard')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'hazard' ? 'bg-[#FFD700] text-black shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <AlertTriangle size={14} />
            Report Hazard / Obstruction
          </button>
          <button
            type="button"
            onClick={() => setMode('add_stile')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'add_stile' ? 'bg-[#FFD700] text-black shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Plus size={14} />
            Add Stile / Trailhead
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'hazard' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Hazard Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:border-[#FFD700] focus:outline-none"
                >
                  <option value="broken_stile">🪜 Broken / Dangerous Stile</option>
                  <option value="blocked_path">🚫 Overgrown / Blocked Path</option>
                  <option value="locked_gate">🔒 Illegal Locked Gate</option>
                  <option value="missing_sign">🧭 Missing / Broken PROW Fingerpost</option>
                  <option value="flooded">🌊 Severe Mud / Flooding</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Report Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Broken top step on Washdale stile"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:border-[#FFD700] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Field Details & Advice for Walkers
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Explain exact location, bypass route, or hazards (e.g. barbed wire, deep bog, rotten wood)..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:border-[#FFD700] focus:outline-none"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Feature Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPointType('stile')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 ${
                      pointType === 'stile' ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="text-base">🪜</span>
                    Stile
                  </button>
                  <button
                    type="button"
                    onClick={() => setPointType('trailhead')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 ${
                      pointType === 'trailhead' ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="text-base">🚩</span>
                    Trailhead
                  </button>
                  <button
                    type="button"
                    onClick={() => setPointType('kissing_gate')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 ${
                      pointType === 'kissing_gate' ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="text-base">🚪</span>
                    Gate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Name / Identifier
                </label>
                <input
                  type="text"
                  value={pointName}
                  onChange={(e) => setPointName(e.target.value)}
                  placeholder="e.g. North Pasture Timber Stile"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:border-[#FFD700] focus:outline-none"
                />
              </div>

              {pointType === 'stile' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Stile Construction
                    </label>
                    <select
                      value={stileSubType}
                      onChange={(e) => setStileSubType(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:border-[#FFD700] focus:outline-none"
                    >
                      <option value="Timber Step Stile">Timber Double-Step Stile</option>
                      <option value="Drystone Wall Ladder Stile">Stone Wall Ladder Stile</option>
                      <option value="Stone Squeeze Stile">Stone Squeeze Stile</option>
                      <option value="Clapper Stile">Clapper / Swing Stile</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <span className="text-xs text-zinc-300">Dog Friendly (Lift Latch / Dog Gap)</span>
                    <input
                      type="checkbox"
                      checked={dogFriendly}
                      onChange={(e) => setDogFriendly(e.target.checked)}
                      className="w-5 h-5 accent-[#FFD700] rounded"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Location Reference */}
          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 flex items-center gap-2">
            <MapPin size={14} className="text-[#FFD700] shrink-0" />
            <span>Target Location: {coords[0].toFixed(5)}, {coords[1].toFixed(5)}</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 text-xs font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[#FFD700] text-black font-black text-xs rounded-xl hover:bg-[#FFD700]/90 active:scale-95 transition-all shadow-lg"
            >
              {mode === 'hazard' ? 'Submit Warden Hazard Report' : 'Save Stile to Map'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
