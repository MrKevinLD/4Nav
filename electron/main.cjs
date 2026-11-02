const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('path');

// Keep all 4 quadrants and background tabs running at full speed (vital for WebGL games & streams)
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('enable-gpu-rasterization');

const configuredPartitions = new Set();

const CHROME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';

/**
 * Configures an isolated Chromium session partition for a specific browser tab or quadrant.
 * - Each partition ("persist:session-...") has its own Cookie Jar, LocalStorage, IndexedDB, Cache, and WebGL context.
 * - Strips restrictive X-Frame-Options / frame-ancestors headers and spoofs standard Chrome User-Agent.
 */
function ensurePartitionConfigured(partitionName) {
  if (!partitionName || configuredPartitions.has(partitionName)) return;
  configuredPartitions.add(partitionName);

  const partSession = session.fromPartition(partitionName, { cache: true });
  partSession.setUserAgent(CHROME_USER_AGENT);

  // Clean Electron from User-Agent header on every request so Google/Facebook/Cloudflare treat it as standard Chrome
  partSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = { ...(details.requestHeaders || {}) };
    requestHeaders['User-Agent'] = CHROME_USER_AGENT;
    callback({ cancel: false, requestHeaders });
  });

  partSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...(details.responseHeaders || {}) };

    for (const headerKey of Object.keys(responseHeaders)) {
      const lower = headerKey.toLowerCase();
      if (lower === 'x-frame-options') {
        delete responseHeaders[headerKey];
      } else if (
        lower === 'content-security-policy' ||
        lower === 'content-security-policy-report-only'
      ) {
        const cleaned = (responseHeaders[headerKey] || []).map((policy) =>
          policy.replace(/frame-ancestors[^;]*;?/gi, '')
        );
        responseHeaders[headerKey] = cleaned;
      }
    }

    callback({ cancel: false, responseHeaders });
  });
}

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1540,
    height: 940,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#090A0C',
    title: '4Nav — Navegador Multi-Sessão para Jogos Idle',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  // Automatically configure any <webview> partition before it attaches
  mainWindow.webContents.on('will-attach-webview', (_event, webPreferences, params) => {
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.backgroundThrottling = false;
    if (params.partition) {
      ensurePartitionConfigured(params.partition);
    }
  });

  // Allow OAuth login popups (e.g. "Login with Google / Facebook" inside games or sites)
  // while keeping the popup inside the exact same isolated session partition!
  app.on('web-contents-created', (_event, contents) => {
    if (contents.getType() === 'webview') {
      contents.setUserAgent(CHROME_USER_AGENT);
      contents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return {
            action: 'allow',
            overrideBrowserWindowOptions: {
              width: 540,
              height: 700,
              autoHideMenuBar: true,
              backgroundColor: '#090A0C',
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                session: contents.session,
              },
            },
          };
        }
        return { action: 'deny' };
      });
    }
  });

  const distIndex = path.join(__dirname, '..', 'dist', 'index.html');
  const useDevServer = process.argv.includes('--dev') || Boolean(process.env.ELECTRON_START_URL);

  if (useDevServer) {
    const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow.loadFile(distIndex);
    });
  } else {
    mainWindow.loadFile(distIndex);
  }
}

ipcMain.handle('session:prepare', (_event, partitionName) => {
  ensurePartitionConfigured(partitionName);
  return { ok: true, partitionName };
});

ipcMain.handle('session:clear', async (_event, partitionName) => {
  if (!partitionName) return { ok: false };
  const partSession = session.fromPartition(partitionName);
  await partSession.clearStorageData({
    storages: [
      'cookies',
      'localstorage',
      'indexdb',
      'serviceworkers',
      'cachestorage',
      'websql',
    ],
  });
  await partSession.clearCache();
  return { ok: true, partitionName };
});

ipcMain.handle('shell:openExternal', async (_event, targetUrl) => {
  if (typeof targetUrl === 'string' && /^https?:\/\//i.test(targetUrl)) {
    await shell.openExternal(targetUrl);
    return { ok: true };
  }
  return { ok: false };
});

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
