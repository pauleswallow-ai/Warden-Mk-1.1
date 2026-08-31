import { ProwWay, ProwPoint } from '../types';

export interface UkPresetLocation {
  id: string;
  name: string;
  region: string;
  postcode: string;
  center: [number, number];
  zoom: number;
  description: string;
  ways: ProwWay[];
  points: ProwPoint[];
}

export const UK_PRESET_LOCATIONS: UkPresetLocation[] = [
  {
    id: 'staffordshire-stone',
    name: 'Stone & Downs Banks (ST15)',
    region: 'Staffordshire',
    postcode: 'ST15 8UN',
    center: [52.9234, -2.1482],
    zoom: 14,
    description: 'Home sector for Warden ST15 ID series. Mixed woodland, open commons, and canal bridleways.',
    ways: [
      {
        id: 'st-fp-1',
        name: 'Downs Banks Valley Footpath',
        prowType: 'footpath',
        designation: 'Public Footpath',
        ref: 'Stone Rural FP 14',
        surface: 'Grass & Dirt',
        parish: 'Stone Rural',
        coordinates: [
          [52.9212, -2.1495],
          [52.9225, -2.1488],
          [52.9241, -2.1479],
          [52.9256, -2.1465],
          [52.9270, -2.1450]
        ]
      },
      {
        id: 'st-fp-2',
        name: 'Washdale Coppice Footpath',
        prowType: 'footpath',
        designation: 'Public Footpath',
        ref: 'Stone Rural FP 18',
        surface: 'Earth / Woodland',
        parish: 'Stone Rural',
        coordinates: [
          [52.9241, -2.1479],
          [52.9248, -2.1512],
          [52.9262, -2.1535],
          [52.9280, -2.1550]
        ]
      },
      {
        id: 'st-bw-1',
        name: 'Trent & Mersey Canal Towpath Bridleway',
        prowType: 'bridleway',
        designation: 'Public Bridleway',
        ref: 'Staffordshire BW 42',
        surface: 'Compacted Gravel',
        parish: 'Stone Urban',
        coordinates: [
          [52.9180, -2.1420],
          [52.9200, -2.1445],
          [52.9225, -2.1460],
          [52.9250, -2.1472],
          [52.9275, -2.1490],
          [52.9300, -2.1510]
        ]
      },
      {
        id: 'st-rb-1',
        name: 'Oulton Heath Restricted Byway',
        prowType: 'restricted_byway',
        designation: 'Restricted Byway',
        ref: 'Oulton RB 7',
        surface: 'Unsurfaced Track',
        parish: 'Oulton',
        coordinates: [
          [52.9280, -2.1430],
          [52.9295, -2.1415],
          [52.9315, -2.1400],
          [52.9340, -2.1380]
        ]
      },
      {
        id: 'st-boat-1',
        name: 'Kibblestone Ancient Driftway (BOAT)',
        prowType: 'boat',
        designation: 'Byway Open to All Traffic',
        ref: 'Staffordshire BOAT 12',
        surface: 'Rocky Green Lane',
        parish: 'Barlaston',
        coordinates: [
          [52.9315, -2.1400],
          [52.9330, -2.1425],
          [52.9355, -2.1450],
          [52.9378, -2.1480]
        ]
      }
    ],
    points: [
      {
        id: 'st-point-1',
        type: 'trailhead',
        name: 'Downs Banks National Trust Trailhead',
        subType: 'Main Trailhead & Car Park',
        coordinates: [52.9210, -2.1498],
        notes: 'Notice board with PROW map, dog waste bins, NT information post.',
        elevation: 115
      },
      {
        id: 'st-point-2',
        type: 'stile',
        name: 'Washdale Brook Step Stile',
        subType: 'Timber Step Stile with Dog Lift Latch',
        dogFriendly: true,
        condition: 'good',
        coordinates: [52.9241, -2.1479],
        notes: 'Double wooden step over boundary fence. Dog flap is operational.',
        elevation: 122
      },
      {
        id: 'st-point-3',
        type: 'stile',
        name: 'Coppice Fence Squeeze Stile',
        subType: 'Stone Squeeze Stile',
        dogFriendly: false,
        condition: 'fair',
        coordinates: [52.9262, -2.1535],
        notes: 'Narrow stone gap, tight for large backpacks.',
        elevation: 138
      },
      {
        id: 'st-point-4',
        type: 'kissing_gate',
        name: 'Oulton Meadow Kissing Gate',
        subType: 'Galvanised Steel Kissing Gate',
        dogFriendly: true,
        condition: 'good',
        coordinates: [52.9280, -2.1430],
        notes: 'Self-closing mechanism works smoothly. Wheelchair accessible RADAR latch.',
        elevation: 145
      },
      {
        id: 'st-point-5',
        type: 'guidepost',
        name: 'Kibblestone Crossroads Guidepost',
        subType: 'Oak 4-Way Fingerpost',
        coordinates: [52.9315, -2.1400],
        notes: 'Points to Oulton (1m), Downs Banks (0.5m), Barlaston (1.5m).',
        elevation: 152
      }
    ]
  },
  {
    id: 'peak-district-edale',
    name: 'Edale & Kinder Scout (S33)',
    region: 'Peak District National Park',
    postcode: 'S33 7ZA',
    center: [53.3650, -1.8150],
    zoom: 14,
    description: 'The start of the Pennine Way. High plateau footpaths, bridleways, packhorse ways, and stone stiles.',
    ways: [
      {
        id: 'ed-fp-1',
        name: 'Pennine Way - Jacob\'s Ladder Section',
        prowType: 'footpath',
        designation: 'Public Footpath',
        ref: 'Hope Woodlands FP 2',
        surface: 'Paved Gritstone & Earth',
        parish: 'Edale',
        coordinates: [
          [53.3638, -1.8590],
          [53.3665, -1.8650],
          [53.3710, -1.8710],
          [53.3755, -1.8735],
          [53.3810, -1.8740]
        ]
      },
      {
        id: 'ed-fp-2',
        name: 'The Nab to Ringing Roger Scramble',
        prowType: 'footpath',
        designation: 'Public Footpath',
        ref: 'Edale FP 11',
        surface: 'Steep Rocky Path',
        parish: 'Edale',
        coordinates: [
          [53.3680, -1.8170],
          [53.3730, -1.8150],
          [53.3785, -1.8120],
          [53.3830, -1.8110]
        ]
      },
      {
        id: 'ed-bw-1',
        name: 'Mam Tor - Hollins Cross Ridge Bridleway',
        prowType: 'bridleway',
        designation: 'Public Bridleway',
        ref: 'Castleton BW 19',
        surface: 'Stone Slabs & Compacted Dirt',
        parish: 'Castleton',
        coordinates: [
          [53.3490, -1.8100],
          [53.3525, -1.7990],
          [53.3550, -1.7880],
          [53.3570, -1.7770]
        ]
      },
      {
        id: 'ed-rb-1',
        name: 'Rushup Edge Restricted Byway',
        prowType: 'restricted_byway',
        designation: 'Restricted Byway',
        ref: 'Peak Forest RB 3',
        surface: 'Rough Stone Track',
        parish: 'Peak Forest',
        coordinates: [
          [53.3450, -1.8350],
          [53.3465, -1.8250],
          [53.3480, -1.8180],
          [53.3490, -1.8100]
        ]
      },
      {
        id: 'ed-boat-1',
        name: 'Chapel Gate Ancient Byway (BOAT)',
        prowType: 'boat',
        designation: 'Byway Open to All Traffic',
        ref: 'Derbyshire BOAT 51',
        surface: 'Engineered Stone / Unsealed',
        parish: 'Edale / Chapel',
        coordinates: [
          [53.3550, -1.8550],
          [53.3600, -1.8600],
          [53.3640, -1.8680],
          [53.3680, -1.8750]
        ]
      }
    ],
    points: [
      {
        id: 'ed-point-1',
        type: 'trailhead',
        name: 'The Old Nags Head (Pennine Way Trailhead)',
        subType: 'National Trail Official Trailhead',
        coordinates: [53.3655, -1.8165],
        notes: 'Official Northern Trailhead marker 0.0 miles for the Pennine Way.',
        elevation: 250
      },
      {
        id: 'ed-point-2',
        type: 'stile',
        name: 'Upper Booth Drystone Ladder Stile',
        subType: 'Gritstone Step & Timber Ladder Stile',
        dogFriendly: true,
        condition: 'good',
        coordinates: [53.3638, -1.8590],
        notes: 'Classic Peak District stone wall stile with timber rungs and latch gate.',
        elevation: 290
      },
      {
        id: 'ed-point-3',
        type: 'stile',
        name: 'Jacob\'s Ladder Base Step Stile',
        subType: 'Stone Flagged Stile',
        dogFriendly: false,
        condition: 'good',
        coordinates: [53.3710, -1.8710],
        notes: 'Very high stone wall, dog must be lifted.',
        elevation: 380
      },
      {
        id: 'ed-point-4',
        type: 'guidepost',
        name: 'Hollins Cross Memorial Guidepost',
        subType: 'Circular Stone Topographic Guidepost',
        coordinates: [53.3550, -1.7880],
        notes: 'Commemorative post with panoramic compass dial pointing to Sheffield and Manchester.',
        elevation: 395
      },
      {
        id: 'ed-point-5',
        type: 'kissing_gate',
        name: 'Grindsbrook Clough Bridle Gate',
        subType: 'Heavy Timber Spring Gate',
        dogFriendly: true,
        condition: 'good',
        coordinates: [53.3680, -1.8170],
        notes: 'Wide gate for mountain bikes and sheep containment.',
        elevation: 270
      }
    ]
  },
  {
    id: 'lake-district-keswick',
    name: 'Keswick & Catbells (CA12)',
    region: 'Lake District National Park',
    postcode: 'CA12 5JR',
    center: [54.5850, -3.1550],
    zoom: 14,
    description: 'Derwentwater trails, Catbells ridge footpath, Borrowdale bridleways, and fell stiles.',
    ways: [
      {
        id: 'ld-fp-1',
        name: 'Catbells Summit Spine Footpath',
        prowType: 'footpath',
        designation: 'Public Footpath',
        ref: 'Above Derwent FP 104',
        surface: 'Rock & Pitching Slabs',
        parish: 'Above Derwent',
        coordinates: [
          [54.5800, -3.1650],
          [54.5750, -3.1670],
          [54.5700, -3.1690],
          [54.5640, -3.1700]
        ]
      },
      {
        id: 'ld-fp-2',
        name: 'Derwentwater Western Shore Path',
        prowType: 'footpath',
        designation: 'Public Footpath',
        ref: 'Borrowdale FP 12',
        surface: 'Woodland Shingle',
        parish: 'Borrowdale',
        coordinates: [
          [54.5880, -3.1500],
          [54.5810, -3.1530],
          [54.5740, -3.1570],
          [54.5680, -3.1610]
        ]
      },
      {
        id: 'ld-bw-1',
        name: 'Portinscale to Grange Bridleway',
        prowType: 'bridleway',
        designation: 'Public Bridleway',
        ref: 'Cumbria BW 808',
        surface: 'Hardcore & Farm Track',
        parish: 'Portinscale',
        coordinates: [
          [54.5950, -3.1600],
          [54.5870, -3.1700],
          [54.5780, -3.1780],
          [54.5690, -3.1820]
        ]
      },
      {
        id: 'ld-rb-1',
        name: 'Manesty Ancient Restricted Byway',
        prowType: 'restricted_byway',
        designation: 'Restricted Byway',
        ref: 'Borrowdale RB 4',
        surface: 'Slate Rubble',
        parish: 'Borrowdale',
        coordinates: [
          [54.5650, -3.1650],
          [54.5600, -3.1620],
          [54.5540, -3.1580]
        ]
      },
      {
        id: 'ld-boat-1',
        name: 'Coach Road Fell Byway (BOAT)',
        prowType: 'boat',
        designation: 'Byway Open to All Traffic',
        ref: 'Cumbria BOAT 202',
        surface: 'Mountain Pass Gravel',
        parish: 'St Johns',
        coordinates: [
          [54.6020, -3.1200],
          [54.6050, -3.1000],
          [54.6090, -3.0800]
        ]
      }
    ],
    points: [
      {
        id: 'ld-point-1',
        type: 'trailhead',
        name: 'Hawes End Trailhead & Jetty',
        subType: 'Lakeshore Trailhead',
        coordinates: [54.5820, -3.1540],
        notes: 'Derwentwater launch ferry stop and main access point for Catbells climb.',
        elevation: 85
      },
      {
        id: 'ld-point-2',
        type: 'stile',
        name: 'Skelgill Farm Slate Stile',
        subType: 'Fell Wall Step Stile',
        dogFriendly: true,
        condition: 'good',
        coordinates: [54.5780, -3.1630],
        notes: 'Projecting slate steps through sheep drystone dyke. Very sturdy.',
        elevation: 160
      },
      {
        id: 'ld-point-3',
        type: 'stile',
        name: 'Gutherscale Mountain Fence Stile',
        subType: 'High Step Stile',
        dogFriendly: false,
        condition: 'fair',
        coordinates: [54.5800, -3.1650],
        notes: 'Steep climb over fell fence line.',
        elevation: 210
      },
      {
        id: 'ld-point-4',
        type: 'guidepost',
        name: 'Manesty Park Junction Fingerpost',
        subType: 'Cast Metal Cumbria Way Post',
        coordinates: [54.5650, -3.1650],
        notes: 'Marks intersection between All-Derwent FP and Cumbria Way Bridleway.',
        elevation: 95
      }
    ]
  },
  {
    id: 'surrey-hills-boxhill',
    name: 'Surrey Hills & Box Hill (RH5)',
    region: 'Surrey Hills AONB',
    postcode: 'RH5 6DF',
    center: [51.2480, -0.3150],
    zoom: 14,
    description: 'North Downs Way, stepping stones, chalk downland bridleways, restricted sunken lanes.',
    ways: [
      {
        id: 'sh-fp-1',
        name: 'North Downs Way - Box Hill Escarpment',
        prowType: 'footpath',
        designation: 'Public Footpath',
        ref: 'Surrey FP 142',
        surface: 'Chalk & Steps',
        parish: 'Mickleham',
        coordinates: [
          [51.2440, -0.3250],
          [51.2460, -0.3180],
          [51.2485, -0.3110],
          [51.2510, -0.3040]
        ]
      },
      {
        id: 'sh-bw-1',
        name: 'Pilgrims Way Bridleway',
        prowType: 'bridleway',
        designation: 'Public Bridleway',
        ref: 'Surrey BW 90',
        surface: 'Compact Chalk & Earth',
        parish: 'Dorking Rural',
        coordinates: [
          [51.2400, -0.3350],
          [51.2420, -0.3280],
          [51.2450, -0.3200],
          [51.2470, -0.3100]
        ]
      },
      {
        id: 'sh-rb-1',
        name: 'Mickleham Downs Sunken Restricted Byway',
        prowType: 'restricted_byway',
        designation: 'Restricted Byway',
        ref: 'Mickleham RB 15',
        surface: 'Historic Sunken Flint Lane',
        parish: 'Mickleham',
        coordinates: [
          [51.2550, -0.3200],
          [51.2580, -0.3150],
          [51.2610, -0.3090]
        ]
      },
      {
        id: 'sh-boat-1',
        name: 'Ranmore Common Green Lane (BOAT)',
        prowType: 'boat',
        designation: 'Byway Open to All Traffic',
        ref: 'Wotton BOAT 31',
        surface: 'Chalk & Ruts',
        parish: 'Ranmore',
        coordinates: [
          [51.2380, -0.3600],
          [51.2410, -0.3520],
          [51.2440, -0.3450]
        ]
      }
    ],
    points: [
      {
        id: 'sh-point-1',
        type: 'trailhead',
        name: 'Box Hill Visitor Centre Trailhead',
        subType: 'National Trust Hub',
        coordinates: [51.2485, -0.3110],
        notes: 'Major trailhead for Box Hill circulars and North Downs Way.',
        elevation: 200
      },
      {
        id: 'sh-point-2',
        type: 'stile',
        name: 'Broadwood Coppice Step Stile',
        subType: 'Timber Stile with Dog Hatch',
        dogFriendly: true,
        condition: 'good',
        coordinates: [51.2460, -0.3180],
        notes: 'Well maintained oak step stile over deer fence.',
        elevation: 165
      },
      {
        id: 'sh-point-3',
        type: 'kissing_gate',
        name: 'River Mole Stepping Stones Gate',
        subType: 'Heavy Oak Kissing Gate',
        dogFriendly: true,
        condition: 'good',
        coordinates: [51.2440, -0.3250],
        notes: 'Access gate leading to the River Mole stepping stones footpath.',
        elevation: 45
      }
    ]
  }
];
