import { useEffect, useRef, useState, useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polyline, 
  Marker, 
  Popup, 
  Tooltip,
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L, { Map as LeafletMap } from 'leaflet';
import { ProwWay, ProwPoint, ProwFilterState, ProwReport } from '../types';
import { createProwPointIcon, getProwStyle } from '../utils/mapIcons';

export type BaseMapType = 'osm' | 'dark' | 'satellite';

interface ProwMapProps {
  ways: ProwWay[];
  points: ProwPoint[];
  reports: ProwReport[];
  filters: ProwFilterState;
  selectedWay: ProwWay | null;
  selectedPoint: ProwPoint | null;
  onSelectWay: (way: ProwWay | null) => void;
  onSelectPoint: (point: ProwPoint | null) => void;
  onSelectReport: (report: ProwReport | null) => void;
  onViewportChange?: (bounds: { south: number; west: number; north: number; east: number; zoom: number }) => void;
  center: [number, number];
  zoom: number;
  userPosition: [number, number] | null;
  recordedTrack?: [number, number][];
  isAddingPoint: boolean;
  onMapClickForNewPoint?: (coords: [number, number]) => void;
  baseMap?: BaseMapType;
  showWaymarkedTrails?: boolean;
}

// Sub-component to handle map events and bounds change
function MapEventHandler({
  onViewportChange,
  isAddingPoint,
  onMapClickForNewPoint,
  center,
  zoom
}: {
  onViewportChange?: (bounds: { south: number; west: number; north: number; east: number; zoom: number }) => void;
  isAddingPoint: boolean;
  onMapClickForNewPoint?: (coords: [number, number]) => void;
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  const lastCenter = useRef<[number, number]>(center);

  // Pan to center if requested from outside
  useEffect(() => {
    if (center[0] !== lastCenter.current[0] || center[1] !== lastCenter.current[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
      lastCenter.current = center;
    }
  }, [center, zoom, map]);

  useMapEvents({
    moveend: () => {
      if (onViewportChange) {
        const bounds = map.getBounds();
        onViewportChange({
          south: bounds.getSouth(),
          west: bounds.getWest(),
          north: bounds.getNorth(),
          east: bounds.getEast(),
          zoom: map.getZoom()
        });
      }
    },
    click: (e) => {
      if (isAddingPoint && onMapClickForNewPoint) {
        onMapClickForNewPoint([e.latlng.lat, e.latlng.lng]);
      }
    }
  });

  return null;
}

// User location marker with radar pulse
function UserGpsMarker({ position }: { position: [number, number] | null }) {
  if (!position) return null;

  const userIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-[#FFD700]/30 rounded-full animate-ping"></div>
        <div class="w-4 h-4 bg-[#FFD700] border-2 border-black rounded-full shadow-lg z-10"></div>
      </div>
    `,
    className: 'custom-gps-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  return (
    <Marker position={position} icon={userIcon}>
      <Popup className="custom-leaflet-popup">
        <div className="text-xs font-bold text-black font-mono">
          📍 You are here (Warden Live GPS)
        </div>
      </Popup>
    </Marker>
  );
}

export default function ProwMap({
  ways,
  points,
  reports,
  filters,
  selectedWay,
  selectedPoint,
  onSelectWay,
  onSelectPoint,
  onSelectReport,
  onViewportChange,
  center,
  zoom,
  userPosition,
  recordedTrack = [],
  isAddingPoint,
  onMapClickForNewPoint,
  baseMap = 'osm',
  showWaymarkedTrails = true
}: ProwMapProps) {
  const [hoveredWayId, setHoveredWayId] = useState<string | number | null>(null);

  // Filtered ways
  const visibleWays = useMemo(() => {
    return ways.filter((way) => {
      if (way.prowType === 'footpath' && !filters.footpaths) return false;
      if (way.prowType === 'bridleway' && !filters.bridleways) return false;
      if (way.prowType === 'restricted_byway' && !filters.restrictedByways) return false;
      if (way.prowType === 'boat' && !filters.boats) return false;
      return true;
    });
  }, [ways, filters]);

  // Filtered points
  const visiblePoints = useMemo(() => {
    return points.filter((point) => {
      if ((point.type === 'stile' || point.type === 'kissing_gate' || point.type === 'gate') && !filters.stiles) return false;
      if ((point.type === 'trailhead' || point.type === 'guidepost') && !filters.trailheads) return false;
      return true;
    });
  }, [points, filters]);

  return (
    <div className={`h-full w-full relative ${isAddingPoint ? 'cursor-crosshair' : ''}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
        zoomControl={false}
      >
        <MapEventHandler
          onViewportChange={onViewportChange}
          isAddingPoint={isAddingPoint}
          onMapClickForNewPoint={onMapClickForNewPoint}
          center={center}
          zoom={zoom}
        />

        {/* Clean Base Map Tiles */}
        {baseMap === 'osm' && (
          <TileLayer
            key="tile-osm"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {baseMap === 'dark' && (
          <TileLayer
            key="tile-dark"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
        )}

        {baseMap === 'satellite' && (
          <TileLayer
            key="tile-satellite"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}

        {/* Optional Waymarked Trails UK (PROW Hiking Overlay) */}
        {showWaymarkedTrails && (
          <TileLayer
            key="tile-hiking-overlay"
            attribution='&copy; <a href="https://waymarkedtrails.org">Waymarked Trails</a>'
            url="https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png"
            opacity={0.85}
            maxZoom={18}
          />
        )}

        {/* Recorded GPS Trail / Breadcrumb Path */}
        {recordedTrack && recordedTrack.length > 1 && (
          <Polyline
            positions={recordedTrack}
            pathOptions={{
              color: '#FF0055',
              weight: 5,
              opacity: 0.9,
              dashArray: '2, 6',
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        )}

        {/* User GPS */}
        <UserGpsMarker position={userPosition} />

        {/* Render UK PROW Ways (Footpaths, Bridleways, Restricted Byways, BOATs) */}
        {visibleWays.map((way) => {
          const isSelected = selectedWay?.id === way.id;
          const isHovered = hoveredWayId === way.id;
          const style = getProwStyle(way.prowType, isHovered, isSelected);

          const typeLabel = 
            way.prowType === 'footpath' ? 'Public Footpath (FP)' :
            way.prowType === 'bridleway' ? 'Public Bridleway (BW)' :
            way.prowType === 'restricted_byway' ? 'Restricted Byway (RB)' :
            'Byway Open to All Traffic (BOAT)';

          return (
            <Polyline
              key={`way-${way.id}`}
              positions={way.coordinates}
              pathOptions={style}
              eventHandlers={{
                click: () => {
                  onSelectPoint(null);
                  onSelectReport(null);
                  onSelectWay(way);
                },
                mouseover: () => setHoveredWayId(way.id),
                mouseout: () => setHoveredWayId(null)
              }}
            >
              <Tooltip sticky direction="top" className="custom-prow-tooltip">
                <div className="text-xs font-bold font-sans">
                  <div className="text-[#FFD700] uppercase font-mono text-[10px]">{typeLabel}</div>
                  <div className="text-white">{way.name || way.ref || 'UK Right of Way'}</div>
                  {way.parish && <div className="text-[10px] text-zinc-300">Parish: {way.parish}</div>}
                  <div className="text-[9px] text-zinc-400 mt-0.5">Click for full legal rights & details</div>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Render Stiles, Gates, Trailheads, Guideposts */}
        {visiblePoints.map((point) => {
          const isSelected = selectedPoint?.id === point.id;
          const icon = createProwPointIcon(point.type, {
            condition: point.condition,
            dogFriendly: point.dogFriendly,
            isSelected: isSelected,
            subType: point.subType
          });

          return (
            <Marker
              key={`pt-${point.id}`}
              position={point.coordinates}
              icon={icon}
              eventHandlers={{
                click: () => {
                  onSelectWay(null);
                  onSelectReport(null);
                  onSelectPoint(point);
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -18]} className="custom-prow-tooltip">
                <div className="text-xs font-bold">
                  <div className="text-[#FFD700] uppercase font-mono text-[10px] flex items-center gap-1">
                    {point.type === 'stile' ? '🪜 Stile' : point.type === 'trailhead' ? '🚩 Trailhead' : point.type === 'kissing_gate' ? '🚪 Kissing Gate' : '🧭 Guidepost'}
                    {point.dogFriendly && <span className="text-emerald-400 text-[10px]">🐾 Dog Gate</span>}
                  </div>
                  <div className="text-white">{point.name || point.subType}</div>
                  {point.condition && (
                    <div className={`text-[10px] capitalize ${point.condition === 'broken' ? 'text-red-400 font-bold' : 'text-zinc-400'}`}>
                      Status: {point.condition}
                    </div>
                  )}
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Render Community Hazard Reports */}
        {filters.showReports && reports.map((report) => {
          const icon = createProwPointIcon('report_issue', { isSelected: false });
          return (
            <Marker
              key={`rep-${report.id}`}
              position={report.coordinates}
              icon={icon}
              eventHandlers={{
                click: () => {
                  onSelectWay(null);
                  onSelectPoint(null);
                  onSelectReport(report);
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -18]} className="custom-prow-tooltip">
                <div className="text-xs font-bold text-red-400">
                  ⚠️ {report.title}
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Banner if in Click-To-Add mode */}
      {isAddingPoint && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1200] bg-black/90 border-2 border-[#FFD700] text-[#FFD700] px-4 py-2 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 pointer-events-auto animate-bounce">
          <span>🎯 Click anywhere on the map to place the Stile / Trailhead</span>
        </div>
      )}
    </div>
  );
}
