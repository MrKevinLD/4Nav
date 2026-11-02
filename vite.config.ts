import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { IncomingMessage, ServerResponse } from 'http';

// Per-session cookie jar stored in memory for the local dev/preview server
const sessionCookieJars = new Map<string, Map<string, string>>();

function getSessionCookies(sessionId: string, domain: string): string {
  const jar = sessionCookieJars.get(`${sessionId}::${domain}`);
  if (!jar) return '';
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function storeSessionCookies(sessionId: string, domain: string, setCookieHeaders: string[]) {
  const key = `${sessionId}::${domain}`;
  const jar = sessionCookieJars.get(key) ?? new Map<string, string>();
  for (const header of setCookieHeaders) {
    const firstPart = header.split(';')[0];
    if (!firstPart) continue;
    const eqIdx = firstPart.indexOf('=');
    if (eqIdx > 0) {
      const name = firstPart.slice(0, eqIdx).trim();
      const val = firstPart.slice(eqIdx + 1).trim();
      jar.set(name, val);
    }
  }
  sessionCookieJars.set(key, jar);
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'quadnav-frame-inspector-and-proxy',
      configureServer(server) {
        server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
          if (!req.url) return next();

          // 1. Endpoint to clear a specific tab's server-side cookie jar
          if (req.url.startsWith('/api/clear-session')) {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const sessionId = urlObj.searchParams.get('session') || '';
            for (const key of Array.from(sessionCookieJars.keys())) {
              if (key.startsWith(`${sessionId}::`)) {
                sessionCookieJars.delete(key);
              }
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, clearedSession: sessionId }));
            return;
          }

          // 2. Endpoint to inspect whether a target URL blocks iframes via X-Frame-Options or CSP
          if (req.url.startsWith('/api/check-frame')) {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const targetUrl = urlObj.searchParams.get('url');
            if (!targetUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ blocked: false, reason: 'Missing URL' }));
              return;
            }

            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 5000);
              const response = await fetch(targetUrl, {
                method: 'HEAD',
                redirect: 'follow',
                signal: controller.signal,
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                },
              }).catch(() =>
                fetch(targetUrl, {
                  method: 'GET',
                  redirect: 'follow',
                  signal: controller.signal,
                  headers: {
                    'User-Agent':
                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                  },
                })
              );
              clearTimeout(timeout);

              const xfo = (response.headers.get('x-frame-options') || '').toUpperCase();
              const csp = response.headers.get('content-security-policy') || '';

              let blocked = false;
              let reason = '';

              if (xfo.includes('DENY') || xfo.includes('SAMEORIGIN')) {
                blocked = true;
                reason = `X-Frame-Options: ${xfo}`;
              } else if (csp.toLowerCase().includes('frame-ancestors')) {
                const match = csp.match(/frame-ancestors[^;]*/i);
                const directive = match ? match[0] : 'frame-ancestors';
                if (!directive.includes('*')) {
                  blocked = true;
                  reason = `CSP ${directive}`;
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  blocked,
                  reason,
                  status: response.status,
                  finalUrl: response.url || targetUrl,
                })
              );
            } catch (err) {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  blocked: false,
                  unreachable: true,
                  reason: err instanceof Error ? err.message : 'Network error',
                })
              );
            }
            return;
          }

          // 3. Session-isolated local proxy that strips X-Frame-Options & CSP frame-ancestors
          if (req.url.startsWith('/api/proxy')) {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const targetUrl = urlObj.searchParams.get('url');
            const sessionId = urlObj.searchParams.get('session') || 'default';

            if (!targetUrl) {
              res.statusCode = 400;
              res.end('URL ausente');
              return;
            }

            try {
              const parsedTarget = new URL(targetUrl);
              const cookieHeader = getSessionCookies(sessionId, parsedTarget.hostname);
              const response = await fetch(targetUrl, {
                redirect: 'follow',
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                  Accept:
                    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                  ...(cookieHeader ? { Cookie: cookieHeader } : {}),
                },
              });

              const rawSetCookies =
                typeof response.headers.getSetCookie === 'function'
                  ? response.headers.getSetCookie()
                  : [];
              if (rawSetCookies.length > 0) {
                storeSessionCookies(sessionId, parsedTarget.hostname, rawSetCookies);
              }

              const contentType = response.headers.get('content-type') || 'text/html; charset=utf-8';
              res.setHeader('Content-Type', contentType);
              // Explicitly allow framing inside our 2x2 grid
              res.removeHeader('X-Frame-Options');
              res.removeHeader('Content-Security-Policy');

              if (contentType.includes('text/html')) {
                let html = await response.text();
                const baseUrl = new URL(response.url || targetUrl).origin;
                const baseTag = `<base href="${baseUrl}/" />`;
                // Inject base tag + storage namespace shim so each tab session has isolated localStorage/sessionStorage in proxy mode
                const isolationScript = `
                  <script>
                    (function() {
                      try {
                        const SESSION_PREFIX = "__quadnav_${sessionId}_";
                        const origSetItem = Storage.prototype.setItem;
                        const origGetItem = Storage.prototype.getItem;
                        const origRemoveItem = Storage.prototype.removeItem;
                        Storage.prototype.setItem = function(k, v) { return origSetItem.call(this, SESSION_PREFIX + k, v); };
                        Storage.prototype.getItem = function(k) { return origGetItem.call(this, SESSION_PREFIX + k); };
                        Storage.prototype.removeItem = function(k) { return origRemoveItem.call(this, SESSION_PREFIX + k); };
                      } catch (e) {}
                    })();
                  </script>
                `;
                if (html.includes('<head>')) {
                  html = html.replace('<head>', `<head>${baseTag}${isolationScript}`);
                } else {
                  html = `${baseTag}${isolationScript}${html}`;
                }
                res.end(html);
              } else {
                const buffer = Buffer.from(await response.arrayBuffer());
                res.end(buffer);
              }
            } catch (err) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(`
                <!DOCTYPE html>
                <html lang="pt-BR">
                  <body style="background:#090A0C;color:#F3F4F6;font-family:system-ui;padding:24px;">
                    <h3 style="color:#EF4444;margin-top:0;">Não foi possível carregar via Proxy Local</h3>
                    <p style="color:#9CA3AF;font-size:14px;">${err instanceof Error ? err.message : 'Erro de conexão'}</p>
                  </body>
                </html>
              `);
            }
            return;
          }

          next();
        });
      },
    },
  ],
  server: {
    port: 3000,
    strictPort: true,
  },
});

