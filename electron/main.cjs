const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('path');

// Keep all 4 quadrants and background tabs running at full speed (vital for WebGL games & streams)
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('enable-gpu-rasterization');

const configuredPartitions = new Set();
let mainWindowInstance = null;

const CHROME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';

/**
 * 1. ⚙️ Hardware Protection & Anti-Cryptojacking Filter
 * Known cryptomining script domains, pools, and signatures to block in webRequest.onBeforeRequest.
 */
const CRYPTOJACKING_PATTERNS = [
  'coinhive.com',
  'coinhive.min.js',
  'crypto-loot.com',
  'cryptoloot.pro',
  'webminepool.com',
  'coinimp.com',
  'minr.pw',
  'coin-have.com',
  'authedmine.com',
  'jsecoin.com',
  'deepminer.org',
  'coinlab.biz',
  'papoto.com',
  'cloudcoins.co',
  '2giga.link',
  'monerominer',
  'webassemblyminer',
  'miner.js',
  'cryptonight',
  'moneroengine',
  'xmr-miner',
  'browserminer',
  'webminerpool',
  'crypto-webminer',
  'moneromining',
  'harvest.js',
  'hashing.win',
];

/**
 * 3. 🛡️ Rigorous Sandboxing for Devices & Invasive Sensors
 */
const INVASIVE_PERMISSIONS = new Set([
  'media',
  'camera',
  'microphone',
  'geolocation',
  'notifications',
  'sensors',
  'midi',
  'midisysex',
  'usb',
  'bluetooth',
  'serial',
  'hid',
  'display-capture',
  'idle-detection',
  'screen-wake-lock',
  'window-management',
  'local-fonts',
]);

/**
 * 5. 🚫 Dangerous Executables & Scripts Blocklist for Download Guard
 */
const DANGEROUS_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.msi',
  '.vbs',
  '.ps1',
  '.scr',
  '.jar',
  '.com',
  '.pif',
  '.reg',
  '.cpl',
  '.gadget',
  '.hta',
  '.inf',
  '.ins',
  '.inx',
  '.isu',
  '.job',
  '.jse',
  '.lnk',
  '.msc',
  '.msp',
  '.mst',
  '.paf',
  '.rgs',
  '.sct',
  '.shb',
  '.shs',
  '.u3p',
  '.vb',
  '.vbe',
  '.ws',
  '.wsf',
  '.wsh',
]);

const activeDownloadsMap = new Map();
const downloadsHistory = [];

function broadcastDownload(data) {
  const existingIdx = downloadsHistory.findIndex((d) => d.id === data.id);
  if (existingIdx !== -1) {
    downloadsHistory[existingIdx] = { ...downloadsHistory[existingIdx], ...data };
  } else {
    downloadsHistory.unshift(data);
  }

  if (mainWindowInstance && !mainWindowInstance.isDestroyed()) {
    mainWindowInstance.webContents.send('download:updated', data);
  }
}

/**
 * Attaches Download Guard and Live Progress Tracking to a session.
 */
function attachDownloadGuard(targetSession) {
  targetSession.on('will-download', (event, item) => {
    const id = 'dl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const filename = item.getFilename() || 'download';
    const ext = path.extname(filename).toLowerCase();
    const totalBytes = item.getTotalBytes() || 0;
    const url = item.getURL() || '';
    const startTime = Date.now();

    activeDownloadsMap.set(id, item);

    if (DANGEROUS_EXTENSIONS.has(ext)) {
      event.preventDefault();
      item.cancel();
      activeDownloadsMap.delete(id);
      console.warn(`[4Nav Download Guard] Bloqueado executável de alto risco: ${filename}`);

      if (mainWindowInstance && !mainWindowInstance.isDestroyed()) {
        mainWindowInstance.webContents.send('security:blocked-download', {
          filename,
          ext,
          timestamp: Date.now(),
        });
      }

      broadcastDownload({
        id,
        filename,
        ext,
        url,
        totalBytes,
        receivedBytes: 0,
        state: 'blocked',
        speed: 0,
        percent: 0,
        startTime,
        completedTime: Date.now(),
        errorMessage: 'Bloqueado pelo Download Guard (executável proibido por segurança)',
      });
      return;
    }

    // Normal safe download
    broadcastDownload({
      id,
      filename,
      ext,
      url,
      totalBytes,
      receivedBytes: 0,
      state: 'progressing',
      speed: 0,
      percent: 0,
      startTime,
      savePath: item.getSavePath(),
    });

    let lastBytes = 0;
    let lastTime = Date.now();

    item.on('updated', (_evt, state) => {
      const now = Date.now();
      const deltaBytes = item.getReceivedBytes() - lastBytes;
      const deltaTime = (now - lastTime) / 1000;
      const speed = deltaTime > 0 ? Math.round(deltaBytes / deltaTime) : 0;
      lastBytes = item.getReceivedBytes();
      lastTime = now;

      const percent = totalBytes > 0 ? Math.round((item.getReceivedBytes() / totalBytes) * 100) : 0;

      broadcastDownload({
        id,
        filename,
        ext,
        url,
        totalBytes,
        receivedBytes: item.getReceivedBytes(),
        state: state === 'interrupted' ? 'interrupted' : 'progressing',
        speed,
        percent,
        startTime,
        savePath: item.getSavePath(),
      });
    });

    item.once('done', (_evt, state) => {
      activeDownloadsMap.delete(id);
      broadcastDownload({
        id,
        filename,
        ext,
        url,
        totalBytes: item.getTotalBytes() || item.getReceivedBytes(),
        receivedBytes: item.getReceivedBytes(),
        state: state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'interrupted',
        speed: 0,
        percent: state === 'completed' ? 100 : 0,
        startTime,
        completedTime: Date.now(),
        savePath: item.getSavePath(),
      });
    });
  });
}

/**
 * Attaches Sandboxing and Permission Denials to a session.
 */
function attachPermissionSandbox(targetSession) {
  targetSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const permLower = String(permission || '').toLowerCase();
    if (INVASIVE_PERMISSIONS.has(permLower)) {
      console.warn(`[4Nav Sandboxing] Permissão invasiva negada preventivamente: ${permission}`);
      return callback(false);
    }
    callback(false); // Default-deny security baseline
  });

  targetSession.setPermissionCheckHandler((_webContents, permission) => {
    const permLower = String(permission || '').toLowerCase();
    if (INVASIVE_PERMISSIONS.has(permLower)) {
      return false;
    }
    return false; // Default-deny
  });

  if (typeof targetSession.setDevicePermissionHandler === 'function') {
    targetSession.setDevicePermissionHandler(() => false);
  }
}

/**
 * Attaches Anti-Cryptojacking and Network Filters to a session.
 */
function attachNetworkSecurity(targetSession) {
  // 1. Anti-Cryptojacking Interceptor
  targetSession.webRequest.onBeforeRequest((details, callback) => {
    const urlLower = (details.url || '').toLowerCase();
    for (const pattern of CRYPTOJACKING_PATTERNS) {
      if (urlLower.includes(pattern)) {
        console.warn(`[4Nav Anti-Cryptojacking] Conexão maliciosa de mineração bloqueada: ${details.url}`);
        return callback({ cancel: true });
      }
    }
    callback({ cancel: false });
  });

  // 2. User-Agent Chrome Spoofing
  targetSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = { ...(details.requestHeaders || {}) };
    requestHeaders['User-Agent'] = CHROME_USER_AGENT;
    callback({ cancel: false, requestHeaders });
  });

  // 3. Header Sanitization (Bypass frame-ancestors / X-Frame-Options)
  targetSession.webRequest.onHeadersReceived((details, callback) => {
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

/**
 * Configures an isolated Chromium session partition with full 5-tier security suite.
 */
function ensurePartitionConfigured(partitionName) {
  if (!partitionName || configuredPartitions.has(partitionName)) return;
  configuredPartitions.add(partitionName);

  const partSession = session.fromPartition(partitionName, { cache: true });
  partSession.setUserAgent(CHROME_USER_AGENT);

  attachNetworkSecurity(partSession);
  attachPermissionSandbox(partSession);
  attachDownloadGuard(partSession);
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

  mainWindowInstance = mainWindow;

  // Configure default session security
  const defaultSess = session.defaultSession;
  defaultSess.setUserAgent(CHROME_USER_AGENT);
  attachNetworkSecurity(defaultSess);
  attachPermissionSandbox(defaultSess);
  attachDownloadGuard(defaultSess);

  // Pre-configure all 4 persistent slot partitions
  ['persist:slot1', 'persist:slot2', 'persist:slot3', 'persist:slot4'].forEach((slot) => {
    ensurePartitionConfigured(slot);
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

  // 4. 🔒 Navigation Guard: Intercepts & Contains Window Openings (Popups)
  app.on('web-contents-created', (_event, contents) => {
    if (contents.getType() === 'webview') {
      contents.setUserAgent(CHROME_USER_AGENT);
      contents.setWindowOpenHandler(({ url }) => {
        // Only allow valid HTTP/HTTPS schemes and contain inside modal popup with identical session
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return {
            action: 'allow',
            overrideBrowserWindowOptions: {
              width: 580,
              height: 720,
              parent: mainWindow,
              modal: false,
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
        console.warn(`[4Nav Navigation Guard] Bloqueada tentativa de popup não autorizada: ${url}`);
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

ipcMain.handle('downloads:get', () => {
  return downloadsHistory;
});

ipcMain.handle('downloads:openFile', async (_event, filePath) => {
  if (!filePath) return { ok: false, error: 'Caminho inválido' };
  try {
    const res = await shell.openPath(filePath);
    return { ok: !res, error: res };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('downloads:showInFolder', async (_event, filePath) => {
  if (!filePath) return { ok: false };
  try {
    shell.showItemInFolder(filePath);
    return { ok: true };
  } catch {
    return { ok: false };
  }
});

ipcMain.handle('downloads:cancel', (_event, id) => {
  const item = activeDownloadsMap.get(id);
  if (item) {
    item.cancel();
    activeDownloadsMap.delete(id);
    return { ok: true };
  }
  return { ok: false };
});

ipcMain.handle('downloads:clear', () => {
  downloadsHistory.length = 0;
  return { ok: true };
});

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
