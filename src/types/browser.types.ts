export type QuadrantId = string;

export interface PaneState {
  id: string;
  quadrantNumber: number;
  positionLabel: string;
  url: string;
  inputUrl: string;
  title: string;
  history: string[];
  historyIndex: number;
  isLoading: boolean;
  reloadCounter: number;
  useProxy: boolean;
  /** Optional override to isolate this specific quadrant even from the other quadrants in the same tab */
  isolateSubPane: boolean;
  isMuted: boolean;
  zoomLevel: number;
  frameBlockedReason: string | null;
}

export interface BrowserTab {
  id: string;
  title: string;
  /** Sequential container number (e.g., 1, 2, 3...) */
  sessionNumber: number;
  /** Unique partition key for Electron & Proxy cookie jar (e.g., "tab-1-a8f9") */
  sessionId: string;
  /** Container badge color (strictly non-purple per DESIGN.md) */
  containerColor: string;
  /** List of ordered pane IDs currently open in this tab */
  paneOrder: string[];
  panes: Record<string, PaneState>;
  activePane: string;
  maximizedPane: string | null;
  /** Horizontal split percentage (left vs right column, default 50) */
  splitX: number;
  /** Vertical split percentage (top vs bottom row, default 50) */
  splitY: number;
  createdAt: number;
}

export interface QuickBookmark {
  title: string;
  url: string;
  category: string;
  badgeColor: string;
  needsProxyInWeb?: boolean;
}

export interface GridPreset {
  id: string;
  name: string;
  description: string;
  urls: Record<string, string>;
}

export interface AppSettings {
  /** Modo Leve Global: injeta regras para reduzir animações pesadas e consumo de CPU */
  enableLiteMode: boolean;
  /** Muta janelas que não estão ativas para economizar Web Audio API */
  muteBackgroundPanes: boolean;
  /** Redução de framerate / aceleração inteligente */
  limitBackgroundFramerate: boolean;
  /** Escala padrão de zoom (ex: 0.9 ou 1.0) para alívio de GPU */
  defaultZoomLevel: number;
  /** Tecla modificadora padrão para atalhos de janelas */
  modifierKey: 'Alt' | 'Ctrl' | 'Shift';
  /** Mapa de índice de janela (1..8) para atalho configurado (ex: { 1: "Alt+1", 2: "Alt+2" }) */
  maximizeShortcuts: Record<number, string>;
  /** URL padrão aberta ao clicar em "+ Adicionar Janela" */
  defaultNewPaneUrl: string;
  /** Impede o celular de bloquear ou desligar a tela durante o farm */
  keepScreenAwake: boolean;
  /** Modo Econômico Mobile: reduz FPS e brilho de shaders para poupar bateria */
  enableEcoBatteryMode: boolean;
}

export interface DownloadItem {
  id: string;
  filename: string;
  ext: string;
  url: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted' | 'blocked';
  speed: number;
  percent: number;
  startTime: number;
  completedTime?: number;
  savePath?: string;
  errorMessage?: string;
}

export interface ElectronBridgeAPI {
  isElectron: boolean;
  prepareSession: (partitionName: string) => Promise<{ ok: boolean; partitionName: string }>;
  clearSession: (partitionName: string) => Promise<{ ok: boolean; partitionName: string }>;
  openExternal: (targetUrl: string) => Promise<{ ok: boolean }>;
  onBlockedDownload?: (callback: (data: { filename: string; ext: string; timestamp: number }) => void) => () => void;
  onDownloadUpdated?: (callback: (item: DownloadItem) => void) => () => void;
  getDownloads?: () => Promise<DownloadItem[]>;
  openDownloadedFile?: (path: string) => Promise<{ ok: boolean; error?: string }>;
  showDownloadedFileInFolder?: (path: string) => Promise<{ ok: boolean }>;
  cancelDownload?: (id: string) => Promise<{ ok: boolean }>;
  clearDownloads?: () => Promise<{ ok: boolean }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronBridgeAPI;
  }
}
