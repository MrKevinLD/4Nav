/**
 * 4Nav Navigation History Store
 * Tracks browsed pages per quadrant with timestamps, hosts, and fast restore capabilities.
 */

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  host: string;
  timestamp: number;
  quadrantNumber?: number;
}

const STORAGE_KEY_HISTORY = '4nav_browser_history';
const MAX_HISTORY_ITEMS = 500;

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
  } catch (err) {
    console.warn('Erro ao salvar histórico:', err);
  }
}

export function recordHistoryEntry(
  url: string,
  title?: string,
  quadrantNumber?: number
): void {
  if (!url || url === 'about:blank' || url.startsWith('javascript:')) return;

  try {
    let host = 'Web';
    try {
      const parsed = new URL(url);
      host = parsed.hostname.replace(/^www\./i, '');
    } catch {}

    const cleanTitle = title && title.trim() ? title.trim() : host;
    const history = loadHistory();

    // Prevent duplicate entries within 5 seconds for the same URL
    if (history.length > 0 && history[0].url === url && Date.now() - history[0].timestamp < 5000) {
      return;
    }

    const newItem: HistoryItem = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      url,
      title: cleanTitle,
      host,
      timestamp: Date.now(),
      quadrantNumber,
    };

    const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    saveHistory(updated);
  } catch (err) {
    console.warn('Falha ao registrar histórico:', err);
  }
}

export function deleteHistoryEntry(id: string): HistoryItem[] {
  const current = loadHistory();
  const updated = current.filter((item) => item.id !== id);
  saveHistory(updated);
  return updated;
}

export function clearAllHistory(): void {
  localStorage.removeItem(STORAGE_KEY_HISTORY);
}
