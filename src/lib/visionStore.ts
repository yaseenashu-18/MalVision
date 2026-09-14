import { broadcastSyncEvent } from './syncChannel';
import { getActiveSession } from './userStore';

export interface VisionResultData {
  id: string;
  userEmail?: string;
  imageName: string;
  prompt: string;
  resultSummary: string;
  riskScore: number;
  threatClassification: 'Safe' | 'Suspicious' | 'Malicious' | 'Unknown';
  timestamp: string;
}

let activeVisionCache: VisionResultData[] | null = null;

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const session = getActiveSession();
  if (session) {
    if (session.id) {
      headers['x-malvision-user-id'] = session.id;
      headers['Authorization'] = `Bearer ${session.id}`;
    }
    if (session.email) {
      headers['x-malvision-user-email'] = session.email;
    }
  }
  return headers;
}

export async function fetchServerVisionHistory(): Promise<VisionResultData[]> {
  try {
    const res = await fetch('/api/vision', {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        activeVisionCache = data.items.map((item: any) => ({
          id: item.id,
          imageName: item.imageName,
          prompt: item.prompt,
          resultSummary: item.resultSummary,
          riskScore: item.riskScore,
          threatClassification: item.threatClassification || 'Unknown',
          timestamp: new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        return activeVisionCache!;
      }
    }
  } catch (e) {
    console.warn('Vision history fetch notice:', e);
  }
  return activeVisionCache || [];
}

export function fetchVisionHistoryFromMongoDB(): VisionResultData[] {
  return activeVisionCache || [];
}

export async function saveVisionResultToMongoDB(
  result: Omit<VisionResultData, 'id' | 'timestamp'>
): Promise<VisionResultData[]> {
  try {
    const newRecord = {
      id: `vsn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      imageName: result.imageName,
      prompt: result.prompt,
      resultSummary: result.resultSummary,
      riskScore: result.riskScore,
      threatClassification: result.threatClassification || 'Unknown',
    };

    const res = await fetch('/api/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify(newRecord),
    });

    if (res.ok) {
      const updated = await fetchServerVisionHistory();
      broadcastSyncEvent('malvision:scan-created', { scanId: newRecord.id });
      return updated;
    }
  } catch (e) {
    console.error('Error saving Vision result:', e);
  }
  return fetchVisionHistoryFromMongoDB();
}

export function clearActiveVisionCache() {
  activeVisionCache = null;
}
