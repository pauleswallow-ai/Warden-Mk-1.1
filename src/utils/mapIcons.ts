import L from 'leaflet';
import { PointType } from '../types';

export function createProwPointIcon(
  type: PointType,
  options: {
    condition?: string;
    dogFriendly?: boolean;
    isSelected?: boolean;
    subType?: string;
  } = {}
): L.DivIcon {
  const { condition = 'good', dogFriendly = false, isSelected = false } = options;

  let bgClass = 'bg-[#1a1a1a] border-[#FFD700] text-[#FFD700]';
  let badge = '';
  let iconSvg = '';

  if (type === 'stile') {
    bgClass = condition === 'broken' 
      ? 'bg-red-950 border-red-500 text-red-400' 
      : condition === 'fair' 
      ? 'bg-amber-950 border-amber-400 text-amber-300' 
      : 'bg-black border-[#FFD700] text-[#FFD700]';

    iconSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 21V3" />
        <path d="M20 21V3" />
        <path d="M4 8h16" />
        <path d="M4 14h16" />
        <path d="M12 8v6" />
      </svg>
    `;
    badge = dogFriendly 
      ? '<span class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 text-[8px] font-bold rounded-full flex items-center justify-center text-black">🐾</span>' 
      : '';
  } else if (type === 'kissing_gate' || type === 'gate') {
    bgClass = 'bg-zinc-900 border-cyan-400 text-cyan-400';
    iconSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21V3" />
        <path d="M21 21V3" />
        <path d="M3 7h18" />
        <path d="M3 17h18" />
        <path d="m3 7 18 10" />
        <path d="m3 17 18-10" />
      </svg>
    `;
  } else if (type === 'trailhead') {
    bgClass = 'bg-[#FFD700] border-black text-black ring-2 ring-[#FFD700]/60';
    iconSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="currentColor" fill-opacity="0.3"/>
        <line x1="4" x2="4" y1="22" y2="15"/>
      </svg>
    `;
  } else if (type === 'guidepost') {
    bgClass = 'bg-black border-lime-400 text-lime-400';
    iconSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v20" />
        <path d="M12 4l7 3-7 3" />
        <path d="M12 11l-7 3 7 3" />
      </svg>
    `;
  } else if (type === 'report_issue') {
    bgClass = 'bg-red-600 border-white text-white animate-bounce';
    iconSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    `;
  }

  const selectedRing = isSelected ? 'ring-4 ring-[#FFD700] scale-125 z-50' : 'shadow-lg hover:scale-110';

  const html = `
    <div class="relative group cursor-pointer">
      <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform ${bgClass} ${selectedRing}">
        ${iconSvg}
      </div>
      ${badge}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-prow-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

export function getProwStyle(prowType: string, isHovered = false, isSelected = false) {
  switch (prowType) {
    case 'footpath':
      return {
        color: isSelected ? '#FFFFFF' : '#FFD700', // Warden Gold for footpaths
        weight: isSelected ? 6 : isHovered ? 5 : 3.5,
        opacity: 0.95,
        dashArray: '6, 6',
        lineCap: 'round' as const,
        lineJoin: 'round' as const
      };
    case 'bridleway':
      return {
        color: isSelected ? '#FFFFFF' : '#00E5FF', // Vivid Cyan for Bridleways
        weight: isSelected ? 6 : isHovered ? 5 : 4,
        opacity: 0.95,
        dashArray: '10, 6',
        lineCap: 'round' as const,
        lineJoin: 'round' as const
      };
    case 'restricted_byway':
      return {
        color: isSelected ? '#FFFFFF' : '#E040FB', // Magenta / Violet for Restricted Byways
        weight: isSelected ? 6 : isHovered ? 5 : 4.5,
        opacity: 0.95,
        dashArray: '12, 4, 3, 4',
        lineCap: 'round' as const,
        lineJoin: 'round' as const
      };
    case 'boat':
      return {
        color: isSelected ? '#FFFFFF' : '#FF5722', // Deep Orange/Red for Byways Open to All Traffic
        weight: isSelected ? 7 : isHovered ? 6 : 5,
        opacity: 0.95,
        dashArray: undefined,
        lineCap: 'round' as const,
        lineJoin: 'round' as const
      };
    default:
      return {
        color: '#A0A0A0',
        weight: 3,
        opacity: 0.7,
        dashArray: '4, 4'
      };
  }
}
