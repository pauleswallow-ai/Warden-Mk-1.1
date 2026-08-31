import { ProwPoint, ProwReport, ProwWay } from '../types';

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

const WARDEN_FOLDER_NAME = 'UK PROW Warden Data';

/**
 * Searches for or creates a dedicated folder in the user's Google Drive.
 */
export async function getOrCreateWardenFolder(accessToken: string): Promise<string> {
  const query = encodeURIComponent(
    `name = '${WARDEN_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    throw new Error(`Failed to query Google Drive folder: ${errorText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: WARDEN_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Backups, trail audits, GPX tracks and PROW survey data from UK PROW Warden',
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create Google Drive folder: ${errorText}`);
  }

  const createData = await createRes.json();
  return createData.id;
}

/**
 * Lists all Warden files stored in Google Drive.
 */
export async function listDriveWardenFiles(accessToken: string): Promise<DriveFileInfo[]> {
  try {
    // List files inside the folder or with warden/prow tags
    const query = encodeURIComponent(
      `trashed = false and (name contains 'prow_' or name contains 'warden_' or name contains 'trail_' or mimeType = 'application/gpx+xml' or mimeType = 'application/json')`
    );

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,parents)&orderBy=modifiedTime desc&pageSize=30`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to list Google Drive files: ${errorText}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Error listing drive files:', err);
    throw err;
  }
}

/**
 * Uploads a file to Google Drive (using multipart upload).
 */
export async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  mimeType: string,
  content: string,
  folderId?: string
): Promise<DriveFileInfo> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata: Record<string, unknown> = {
    name: fileName,
    mimeType: mimeType,
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,modifiedTime,size,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive upload failed: ${errorText}`);
  }

  return await res.json();
}

/**
 * Downloads a file's raw content from Google Drive.
 */
export async function downloadFileFromDrive(accessToken: string, fileId: string): Promise<string> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to download file from Google Drive: ${errorText}`);
  }

  return await res.text();
}

/**
 * Deletes a file from Google Drive.
 */
export async function deleteFileFromDrive(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const errorText = await res.text();
    throw new Error(`Failed to delete file from Google Drive: ${errorText}`);
  }
}

/**
 * Helper to build a standard GPX 1.1 file from PROW points, hazards, and tracks.
 */
export function buildGpxContent(
  points: ProwPoint[],
  reports: ProwReport[],
  trackPoints?: [number, number][],
  trackName: string = 'UK PROW Survey'
): string {
  const timeStr = new Date().toISOString();

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="UK PROW Warden - Google Drive Sync" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(trackName)}</name>
    <desc>Survey of UK Public Rights of Way, stiles, kissing gates, trailheads, and hazard reports.</desc>
    <time>${timeStr}</time>
  </metadata>
`;

  // Waypoints for Stiles, Gates, Trailheads
  points.forEach((p) => {
    const sym = p.type === 'stile' ? 'Stile' : p.type === 'kissing_gate' ? 'Gate' : 'Trailhead';
    gpx += `  <wpt lat="${p.coordinates[0]}" lon="${p.coordinates[1]}">
    <name>${escapeXml(p.name || `${p.type.replace('_', ' ').toUpperCase()}`)}</name>
    <desc>${escapeXml(`${p.subType || ''} | Dog friendly: ${p.dogFriendly ? 'Yes' : 'No'} | Condition: ${p.condition || 'Unknown'}`)}</desc>
    <sym>${sym}</sym>
    <type>${p.type}</type>
  </wpt>\n`;
  });

  // Waypoints for Reports & Hazards
  reports.forEach((r) => {
    gpx += `  <wpt lat="${r.coordinates[0]}" lon="${r.coordinates[1]}">
    <name>${escapeXml(`[HAZARD] ${r.title}`)}</name>
    <desc>${escapeXml(`${r.type} - ${r.description} (Status: ${r.status})`)}</desc>
    <sym>Danger Area</sym>
    <type>hazard</type>
  </wpt>\n`;
  });

  // Track if available
  if (trackPoints && trackPoints.length > 0) {
    gpx += `  <trk>
    <name>${escapeXml(trackName)} Track</name>
    <trkseg>\n`;
    trackPoints.forEach(([lat, lng]) => {
      gpx += `      <trkpt lat="${lat}" lon="${lng}"><time>${timeStr}</time></trkpt>\n`;
    });
    gpx += `    </trkseg>
  </trk>\n`;
  }

  gpx += '</gpx>';
  return gpx;
}

/**
 * Helper to build JSON survey backup.
 */
export function buildProwJson(
  ways: ProwWay[],
  points: ProwPoint[],
  reports: ProwReport[],
  metadata: { areaName?: string; exportedAt?: string; wardenId?: string } = {}
): string {
  const payload = {
    appName: 'UK PROW Warden',
    exportVersion: '1.0.0',
    exportedAt: metadata.exportedAt || new Date().toISOString(),
    wardenId: metadata.wardenId,
    areaName: metadata.areaName,
    summary: {
      totalWays: ways.length,
      totalPoints: points.length,
      totalReports: reports.length,
      stilesCount: points.filter((p) => p.type === 'stile').length,
      gatesCount: points.filter((p) => p.type === 'kissing_gate' || p.type === 'gate').length,
      activeHazards: reports.filter((r) => r.status === 'active').length,
    },
    points,
    reports,
    ways,
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Helper to build CSV Council Hazard & Infrastructure Audit.
 */
export function buildAuditCsv(points: ProwPoint[], reports: ProwReport[]): string {
  const header = 'Type,Category,Latitude,Longitude,Name/Title,Condition/Status,Details,Dog Friendly,Recorded Date\n';
  
  const pointRows = points.map((p) => {
    return [
      `"${p.type}"`,
      '"Infrastructure"',
      p.coordinates[0],
      p.coordinates[1],
      `"${(p.name || p.type).replace(/"/g, '""')}"`,
      `"${p.condition || 'Unknown'}"`,
      `"${(p.notes || p.subType || '').replace(/"/g, '""')}"`,
      `"${p.dogFriendly ? 'Yes' : 'No'}"`,
      `"${p.timestamp ? new Date(p.timestamp).toISOString() : ''}"`,
    ].join(',');
  });

  const reportRows = reports.map((r) => {
    return [
      `"${r.type}"`,
      `"${r.category}"`,
      r.coordinates[0],
      r.coordinates[1],
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.status}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      '"N/A"',
      `"${new Date(r.createdAt).toISOString()}"`,
    ].join(',');
  });

  return header + [...pointRows, ...reportRows].join('\n');
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
