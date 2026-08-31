import { ProwWay, ProwPoint, ProwType, PointType } from '../types';

interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OverpassWay {
  type: 'way';
  id: number;
  nodes: number[];
  geometry?: Array<{ lat: number; lon: number }>;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: Array<OverpassNode | OverpassWay>;
}

// In-memory cache for fetched bounding boxes
const queryCache = new Map<string, { ways: ProwWay[]; points: ProwPoint[]; timestamp: number }>();

function determineProwType(tags: Record<string, string>): ProwType | null {
  const designation = (tags.designation || '').toLowerCase();
  const highway = (tags.highway || '').toLowerCase();
  const prow = (tags.prow || '').toLowerCase();

  if (
    designation.includes('byway_open_to_all_traffic') || 
    designation.includes('boat') || 
    prow === 'boat' ||
    highway === 'byway'
  ) {
    return 'boat';
  }

  if (
    designation.includes('restricted_byway') || 
    prow === 'restricted_byway' ||
    tags.motor_vehicle === 'no' && (highway === 'track' && designation.includes('byway'))
  ) {
    return 'restricted_byway';
  }

  if (
    designation.includes('bridleway') || 
    highway === 'bridleway' || 
    prow === 'bridleway' ||
    tags.horse === 'designated' ||
    tags.horse === 'yes' && (highway === 'path' || highway === 'track')
  ) {
    return 'bridleway';
  }

  if (
    designation.includes('footpath') || 
    prow === 'footpath' || 
    highway === 'footway' || 
    (highway === 'path' && tags.foot === 'designated') ||
    designation.includes('public_right_of_way')
  ) {
    return 'footpath';
  }

  // General foot access on paths in UK
  if (highway === 'path' || highway === 'footway') {
    return 'footpath';
  }

  return null;
}

function determinePointType(tags: Record<string, string>): { type: PointType; subType: string } | null {
  const barrier = (tags.barrier || '').toLowerCase();
  const information = (tags.information || '').toLowerCase();
  const highway = (tags.highway || '').toLowerCase();
  const tourism = (tags.tourism || '').toLowerCase();

  if (barrier === 'stile' || barrier.includes('stile')) {
    const stileType = tags.stile || 'Step Stile';
    return { type: 'stile', subType: `${stileType.replace(/_/g, ' ')}` };
  }

  if (barrier === 'kissing_gate') {
    return { type: 'kissing_gate', subType: 'Kissing Gate' };
  }

  if (barrier === 'gate' || barrier === 'swing_gate' || barrier === 'lift_gate') {
    return { type: 'gate', subType: 'Field / Access Gate' };
  }

  if (highway === 'trailhead' || information === 'trailhead') {
    return { type: 'trailhead', subType: tags.name ? `Trailhead: ${tags.name}` : 'Public Trailhead' };
  }

  if (information === 'guidepost' || information === 'signpost' || information === 'fingerpost') {
    return { type: 'guidepost', subType: 'PROW Guidepost / Fingerpost' };
  }

  if (tourism === 'information' && (information === 'board' || information === 'map')) {
    return { type: 'trailhead', subType: 'Trail Information Map Board' };
  }

  return null;
}

export async function fetchProwForBounds(
  south: number,
  west: number,
  north: number,
  east: number
): Promise<{ ways: ProwWay[]; points: ProwPoint[] }> {
  // Round to ~2 decimal places for cache key
  const cacheKey = `${south.toFixed(2)},${west.toFixed(2)},${north.toFixed(2)},${east.toFixed(2)}`;
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 15) {
    return { ways: cached.ways, points: cached.points };
  }

  const query = `
    [out:json][timeout:20];
    (
      way["designation"~"public_footpath|public_bridleway|restricted_byway|byway_open_to_all_traffic|public_right_of_way"](${south},${west},${north},${east});
      way["highway"~"bridleway|footway"](${south},${west},${north},${east});
      node["barrier"~"stile|kissing_gate"](${south},${west},${north},${east});
      node["highway"="trailhead"](${south},${west},${north},${east});
      node["information"~"trailhead|guidepost|fingerpost"](${south},${west},${north},${east});
    );
    out body geom 200;
  `;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data: OverpassResponse = await response.json();
      const ways: ProwWay[] = [];
      const points: ProwPoint[] = [];

      for (const element of data.elements) {
        if (element.type === 'way' && element.geometry && element.geometry.length > 1) {
          const tags = element.tags || {};
          const prowType = determineProwType(tags);
          if (prowType) {
            const coordinates: [number, number][] = element.geometry.map(g => [g.lat, g.lon]);
            const designation = tags.designation || tags.prow || (
              prowType === 'footpath' ? 'Public Footpath' :
              prowType === 'bridleway' ? 'Public Bridleway' :
              prowType === 'restricted_byway' ? 'Restricted Byway' :
              'Byway Open to All Traffic'
            );

            ways.push({
              id: `osm-w-${element.id}`,
              name: tags.name || tags.ref || `${designation}`,
              prowType,
              designation,
              ref: tags.ref || tags.loc_ref || tags.prow_ref,
              surface: tags.surface || tags.tracktype || 'Unsurfaced',
              parish: tags['parish:name'] || tags.operator || tags.admin_level,
              coordinates,
              source: 'OpenStreetMap UK PROW'
            });
          }
        } else if (element.type === 'node' && element.tags) {
          const ptInfo = determinePointType(element.tags);
          if (ptInfo) {
            const isDogFriendly = element.tags.dog === 'yes' || element.tags.dog_gate === 'yes' || element.tags.dog_friendly === 'yes';
            const condition = (element.tags.condition as any) || (element.tags.status as any) || 'good';

            points.push({
              id: `osm-n-${element.id}`,
              type: ptInfo.type,
              name: element.tags.name || element.tags.description || ptInfo.subType,
              coordinates: [element.lat, element.lon],
              subType: ptInfo.subType,
              dogFriendly: isDogFriendly,
              condition: ['good', 'fair', 'broken', 'overgrown', 'blocked'].includes(condition) ? condition : 'good',
              notes: element.tags.note || element.tags.description || element.tags.operator,
              elevation: element.tags.ele ? parseFloat(element.tags.ele) : undefined
            });
          }
        }
      }

      const result = { ways, points, timestamp: Date.now() };
      queryCache.set(cacheKey, result);
      return { ways, points };
    } catch (e) {
      console.warn(`Failed fetching from ${endpoint}, trying next...`, e);
    }
  }

  return { ways: [], points: [] };
}

export async function searchUkLocation(queryText: string): Promise<Array<{
  name: string;
  lat: number;
  lon: number;
  boundingbox?: [string, string, string, string];
  display_name: string;
}>> {
  try {
    const q = queryText.trim();
    if (!q) return [];

    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&q=${encodeURIComponent(q)}&limit=5`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.map((item: any) => ({
      name: item.name || item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      boundingbox: item.boundingbox,
      display_name: item.display_name
    }));
  } catch (error) {
    console.error('UK Geocoding error:', error);
    return [];
  }
}
