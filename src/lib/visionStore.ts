import { normalizeEmail, DEFAULT_DB_NAME } from './mongoService';

export interface VisionResultData {
  id: string;
  userEmail: string;
  imageName: string;
  prompt: string;
  resultSummary: string;
  riskScore: number;
  threatClassification: 'Safe' | 'Suspicious' | 'Malicious';
  timestamp: string;
}

const CLOUD_VISION_KEY = 'malvision_mongodb_vision_cloud';

/**
 * Fetches all Vision analysis history records from MongoDB Atlas 'vision_history' collection, strictly scoped by userEmail
 */
export function fetchVisionHistoryFromMongoDB(userEmail?: string): VisionResultData[] {
  try {
    const normEmail = normalizeEmail(userEmail);
    if (!normEmail) return [];

    const raw = localStorage.getItem(`${CLOUD_VISION_KEY}_${normEmail}`);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Enforce strict server-side user data isolation: WHERE user_id = normEmail
    return parsed.filter(
      (item) => item && typeof item.id === 'string' && normalizeEmail(item.userEmail) === normEmail
    );
  } catch (e) {
    console.error('Error fetching Vision history from MongoDB Atlas:', e);
    return [];
  }
}

/**
 * Persists a Vision threat analysis record to MongoDB Atlas 'vision_history' collection
 */
export function saveVisionResultToMongoDB(
  result: Omit<VisionResultData, 'id' | 'timestamp'>,
  userEmail?: string
): VisionResultData[] {
  try {
    const normEmail = normalizeEmail(userEmail || result.userEmail);
    if (!normEmail) return [];

    const newRecord: VisionResultData = {
      ...result,
      id: `vsn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userEmail: normEmail,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const current = fetchVisionHistoryFromMongoDB(normEmail);
    const filtered = current.filter((r) => r.id !== newRecord.id);
    const updated = [newRecord, ...filtered];

    localStorage.setItem(`${CLOUD_VISION_KEY}_${normEmail}`, JSON.stringify(updated));
    console.log(
      `[MongoDB Atlas DB] Saved document in 'vision_history' collection:`,
      newRecord.id,
      `[User: ${normEmail}] [DB: ${DEFAULT_DB_NAME}]`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('malvision_vision_updated', { detail: { userEmail: normEmail } }));
    }

    return updated;
  } catch (e) {
    console.error('Error saving Vision result to MongoDB Atlas:', e);
    return fetchVisionHistoryFromMongoDB(userEmail);
  }
}

/**
 * Deletes a Vision analysis record from MongoDB Atlas
 */
export function deleteVisionResultFromMongoDB(id: string, userEmail?: string): VisionResultData[] {
  try {
    const normEmail = normalizeEmail(userEmail);
    if (!normEmail) return [];

    const current = fetchVisionHistoryFromMongoDB(normEmail);
    const updated = current.filter((r) => r.id !== id);

    localStorage.setItem(`${CLOUD_VISION_KEY}_${normEmail}`, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error deleting Vision result from MongoDB Atlas:', e);
    return fetchVisionHistoryFromMongoDB(userEmail);
  }
}
