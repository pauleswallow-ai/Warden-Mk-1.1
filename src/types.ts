export type ProwType = 'footpath' | 'bridleway' | 'restricted_byway' | 'boat';

export type PointType = 'stile' | 'kissing_gate' | 'gate' | 'trailhead' | 'guidepost' | 'report_issue';

export interface ProwWay {
  id: string | number;
  name?: string;
  prowType: ProwType;
  designation?: string;
  ref?: string;
  surface?: string;
  coordinates: [number, number][]; // [lat, lng]
  parish?: string;
  source?: string;
  lengthMeters?: number;
}

export interface ProwPoint {
  id: string | number;
  type: PointType;
  name?: string;
  coordinates: [number, number]; // [lat, lng]
  subType?: string; // e.g., 'ladder_stile', 'step_stile', 'wooden_kissing_gate'
  dogFriendly?: boolean;
  condition?: 'good' | 'fair' | 'broken' | 'overgrown' | 'blocked';
  notes?: string;
  elevation?: number;
  reportedBy?: string;
  timestamp?: number;
}

export interface ProwReport {
  id: string;
  targetId?: string | number;
  type: 'broken_stile' | 'blocked_path' | 'missing_sign' | 'locked_gate' | 'flooded' | 'new_point';
  category: 'stile' | 'path' | 'trailhead' | 'other';
  coordinates: [number, number];
  title: string;
  description: string;
  status: 'active' | 'investigating' | 'resolved';
  authorId: string;
  createdAt: number;
}

export interface ProwFilterState {
  footpaths: boolean;
  bridleways: boolean;
  restrictedByways: boolean;
  boats: boolean;
  stiles: boolean;
  trailheads: boolean;
  showReports: boolean;
}
