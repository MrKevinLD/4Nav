package com.mrkevinld.fournav;

import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import okhttp3.Cookie;
import okhttp3.CookieJar;
import okhttp3.Headers;
import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import org.json.JSONArray;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "4Nav";
    private static final List<String> RECENT_LOGS = Collections.synchronizedList(new ArrayList<>());
    private static OkHttpClient okHttpClient;
    private static String appUserAgent;
    private FourNavWebViewClient customWebViewClient;

    private static final String GHOST_CLEANER_SCRIPT =
            "(function() {" +
            "  if (window.__4navGhostCleaner) return;" +
            "  window.__4navGhostCleaner = true;" +
            "  function isCloseLike(el) {" +
            "    if (!el) return false;" +
            "    var text = (el.innerText || el.textContent || '').trim().toLowerCase();" +
            "    var cls = (el.className && typeof el.className === 'string') ? el.className.toLowerCase() : '';" +
            "    var id = (el.id || '').toLowerCase();" +
            "    var label = (el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase();" +
            "    if (cls.indexOf('close') !== -1 || cls.indexOf('cancel') !== -1 || cls.indexOf('exit') !== -1 || cls.indexOf('fechar') !== -1) return true;" +
            "    if (id.indexOf('close') !== -1 || id.indexOf('cancel') !== -1 || id.indexOf('exit') !== -1 || id.indexOf('fechar') !== -1) return true;" +
            "    if (label.indexOf('fechar') !== -1 || label.indexOf('sair') !== -1 || label.indexOf('close') !== -1 || label.indexOf('cancel') !== -1) return true;" +
            "    if (text === 'continuar a jogar' || text === 'fechar jogo' || text === 'fechar' || text === 'cancelar' || text === '✕' || text === '×' || text === 'x') return true;" +
            "    return false;" +
            "  }" +
            "  function getEnclosingModal(target) {" +
            "    if (!target) return null;" +
            "    var curr = target;" +
            "    while (curr && curr !== document.body && curr !== document.documentElement) {" +
            "      if (curr.id === 'Escape' || curr.id === 'WinLogin' || curr.id === 'WinPopup' || curr.id === 'WinMSG' || curr.id === 'WinError') return curr;" +
            "      if (curr.classList && (curr.classList.contains('modal') || curr.classList.contains('popup') || curr.classList.contains('overlay') || curr.classList.contains('ri-window') || curr.classList.contains('wl-window') || curr.classList.contains('ri-janela-corpo'))) return curr;" +
            "      if (curr.getAttribute && curr.getAttribute('role') === 'dialog') return curr;" +
            "      if (curr.parentNode) { curr = curr.parentNode; } else if (curr.host) { return curr.host; } else { break; }" +
            "    }" +
            "    return null;" +
            "  }" +
            "  function checkAndDismissGhost(e) {" +
            "    var target = e.target;" +
            "    if (!target) return;" +
            "    var btn = target.closest ? target.closest('button, [role=\"button\"], a, input[type=\"button\"], .btn, .ri-btn, .close, .exit, .cancel') : target;" +
            "    if (!btn && isCloseLike(target)) btn = target;" +
            "    if (!btn || !isCloseLike(btn)) return;" +
            "    var modal = getEnclosingModal(btn);" +
            "    if (!modal && btn.getRootNode && btn.getRootNode().host) { modal = btn.getRootNode().host; }" +
            "    if (modal) {" +
            "      setTimeout(function() {" +
            "        try {" +
            "          if (modal && modal.parentNode) {" +
            "            var style = window.getComputedStyle ? window.getComputedStyle(modal) : modal.style;" +
            "            if (style && style.display !== 'none' && style.visibility !== 'hidden') {" +
            "              modal.style.setProperty('display', 'none', 'important');" +
            "              modal.style.setProperty('pointer-events', 'none', 'important');" +
            "              modal.classList.remove('ri-aberta');" +
            "              if (modal.id === 'Escape' || modal.classList.contains('popup') || modal.classList.contains('overlay')) {" +
            "                modal.remove();" +
            "              }" +
            "            }" +
            "          }" +
            "        } catch (err) {}" +
            "      }, 180);" +
            "    }" +
            "  }" +
            "  document.addEventListener('click', checkAndDismissGhost, true);" +
            "  document.addEventListener('touchend', checkAndDismissGhost, true);" +
            "  window.__sweepAllGhostElements = function() {" +
            "    var selectors = ['#Escape', '#WinPopup', '#WinMSG', '#WinError', '.modal.fade:not(.show)', '.modal-backdrop', '.overlay[style*=\"opacity: 0\"]'];" +
            "    selectors.forEach(function(sel) {" +
            "      try {" +
            "        document.querySelectorAll(sel).forEach(function(el) {" +
            "          el.style.setProperty('display', 'none', 'important');" +
            "          el.style.setProperty('pointer-events', 'none', 'important');" +
            "        });" +
            "      } catch (e) {}" +
            "    });" +
            "  };" +
            "})();";

    public void injectGhostPopupCleaner(WebView webView) {
        if (webView == null) return;
        runOnUiThread(() -> {
            try {
                webView.evaluateJavascript(GHOST_CLEANER_SCRIPT, null);
                logMessage("Ghost popup cleaner evaluated on WebView");
            } catch (Exception e) {
                logMessage("evaluateJavascript error: " + e.getMessage());
            }
        });
    }

    public static void logMessage(String msg) {
        Log.d(TAG, msg);
        synchronized (RECENT_LOGS) {
            if (RECENT_LOGS.size() > 100) {
                RECENT_LOGS.remove(0);
            }
            RECENT_LOGS.add(msg);
        }
    }

    public class AndroidBridgeInterface {
        @android.webkit.JavascriptInterface
        public void setKeepScreenOn(boolean keepOn) {
            runOnUiThread(() -> {
                if (keepOn) {
                    getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    logMessage("Screen WakeLock: ACTIVE (FLAG_KEEP_SCREEN_ON)");
                } else {
                    getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    logMessage("Screen WakeLock: RELEASED");
                }
            });
        }

        @android.webkit.JavascriptInterface
        public void clearMemoryCache() {
            runOnUiThread(() -> {
                Bridge b = getBridge();
                if (b != null && b.getWebView() != null) {
                    b.getWebView().clearCache(true);
                }
                System.gc();
                logMessage("Native memory cache cleared & System.gc() called");
            });
        }

        @android.webkit.JavascriptInterface
        public void cleanGhostPopups() {
            runOnUiThread(() -> {
                Bridge b = getBridge();
                if (b != null && b.getWebView() != null) {
                    injectGhostPopupCleaner(b.getWebView());
                }
            });
        }

        @android.webkit.JavascriptInterface
        public String getRecentLogs() {
            synchronized (RECENT_LOGS) {
                return new JSONArray(RECENT_LOGS).toString();
            }
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen awake by default for idle farming games
        getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        initOkHttp();

        Bridge bridge = this.getBridge();
        if (bridge != null) {
            WebView webView = bridge.getWebView();
            WebView.setWebContentsDebuggingEnabled(true);
            webView.setBackgroundColor(android.graphics.Color.parseColor("#090A0C"));
            webView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);
            WebSettings settings = webView.getSettings();

            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setAllowFileAccessFromFileURLs(true);
            settings.setAllowUniversalAccessFromFileURLs(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setSupportMultipleWindows(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setSafeBrowsingEnabled(false);
            settings.setGeolocationEnabled(true);
            settings.setTextZoom(100);

            // Chrome standard viewport, hardware acceleration and caching behavior
            settings.setUseWideViewPort(true);
            settings.setLoadWithOverviewMode(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setDatabaseEnabled(true);
            settings.setDomStorageEnabled(true);
            
            // Use real Android Chrome User-Agent without '; wv' so Google and websites treat it as a standard Chrome browser
            try {
                String defaultUa = WebSettings.getDefaultUserAgent(this);
                appUserAgent = defaultUa != null ? defaultUa.replace("; wv", "") : "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.6834.163 Mobile Safari/537.36";
            } catch (Exception e) {
                appUserAgent = "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.6834.163 Mobile Safari/537.36";
            }
            settings.setUserAgentString(appUserAgent);

            // Register native bridge for performance and screen wake lock
            webView.addJavascriptInterface(new AndroidBridgeInterface(), "AndroidBridge");

            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);

            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                    if (consoleMessage != null) {
                        String msg = "[" + consoleMessage.messageLevel() + "] "
                                + consoleMessage.message() + " -- Line "
                                + consoleMessage.lineNumber() + " of "
                                + consoleMessage.sourceId();
                        logMessage("JS: " + msg);
                    }
                    return super.onConsoleMessage(consoleMessage);
                }

                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, android.os.Message resultMsg) {
                    if (resultMsg == null) return false;
                    logMessage("WebChromeClient: onCreateWindow triggered (isDialog=" + isDialog + ", isUserGesture=" + isUserGesture + ")");

                    WebView popupWebView = new WebView(MainActivity.this);
                    configureChildWebSettings(popupWebView);

                    android.app.Dialog popupDialog = new android.app.Dialog(MainActivity.this, android.R.style.Theme_DeviceDefault_Dialog_NoActionBar);

                    android.widget.LinearLayout container = new android.widget.LinearLayout(MainActivity.this);
                    container.setOrientation(android.widget.LinearLayout.VERTICAL);
                    container.setBackgroundColor(android.graphics.Color.parseColor("#090A0C"));

                    android.widget.RelativeLayout header = new android.widget.RelativeLayout(MainActivity.this);
                    header.setBackgroundColor(android.graphics.Color.parseColor("#111317"));
                    int p10 = (int) (10 * getResources().getDisplayMetrics().density);
                    header.setPadding(p10, p10, p10, p10);

                    android.widget.TextView titleView = new android.widget.TextView(MainActivity.this);
                    titleView.setText("Janela Flutuante");
                    titleView.setTextColor(android.graphics.Color.parseColor("#F3F4F6"));
                    titleView.setTextSize(13);
                    android.widget.RelativeLayout.LayoutParams titleParams = new android.widget.RelativeLayout.LayoutParams(
                            android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT,
                            android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT
                    );
                    titleParams.addRule(android.widget.RelativeLayout.ALIGN_PARENT_LEFT);
                    titleParams.addRule(android.widget.RelativeLayout.CENTER_VERTICAL);
                    header.addView(titleView, titleParams);

                    android.widget.Button closeBtn = new android.widget.Button(MainActivity.this);
                    closeBtn.setText("✕ Fechar");
                    closeBtn.setTextColor(android.graphics.Color.parseColor("#EF4444"));
                    closeBtn.setBackgroundColor(android.graphics.Color.parseColor("#181B21"));
                    closeBtn.setTextSize(12);
                    android.widget.RelativeLayout.LayoutParams btnParams = new android.widget.RelativeLayout.LayoutParams(
                            android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT,
                            android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT
                    );
                    btnParams.addRule(android.widget.RelativeLayout.ALIGN_PARENT_RIGHT);
                    btnParams.addRule(android.widget.RelativeLayout.CENTER_VERTICAL);
                    header.addView(closeBtn, btnParams);

                    container.addView(header, new android.widget.LinearLayout.LayoutParams(
                            android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
                    ));

                    container.addView(popupWebView, new android.widget.LinearLayout.LayoutParams(
                            android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                            android.widget.LinearLayout.LayoutParams.MATCH_PARENT
                    ));

                    popupDialog.setContentView(container);
                    if (popupDialog.getWindow() != null) {
                        popupDialog.getWindow().setLayout(
                                (int) (getResources().getDisplayMetrics().widthPixels * 0.92),
                                (int) (getResources().getDisplayMetrics().heightPixels * 0.85)
                        );
                    }

                    closeBtn.setOnClickListener(v -> {
                        if (popupDialog.isShowing()) {
                            popupDialog.dismiss();
                        }
                        popupWebView.destroy();
                    });

                    popupDialog.setOnDismissListener(dialogInterface -> {
                        try {
                            popupWebView.destroy();
                        } catch (Exception ignored) {}
                    });

                    popupWebView.setWebChromeClient(new WebChromeClient() {
                        @Override
                        public void onCloseWindow(WebView window) {
                            logMessage("popupWebView onCloseWindow triggered");
                            if (popupDialog.isShowing()) {
                                popupDialog.dismiss();
                            }
                            window.destroy();
                        }
                    });

                    popupWebView.setWebViewClient(new BridgeWebViewClient(getBridge()) {
                        @Override
                        public void onPageFinished(WebView view, String url) {
                            super.onPageFinished(view, url);
                            injectGhostPopupCleaner(view);
                        }

                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                            return false;
                        }

                        @Override
                        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                            if (request != null && request.getUrl() != null) {
                                WebResourceResponse resp = processIntercept(request.getUrl().toString(), request.getMethod(), request.getRequestHeaders());
                                if (resp != null) return resp;
                            }
                            return super.shouldInterceptRequest(view, request);
                        }
                    });

                    popupDialog.show();

                    WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                    transport.setWebView(popupWebView);
                    resultMsg.sendToTarget();
                    return true;
                }
            });

            applyCustomWebViewClient();
        }
    }

    private void configureChildWebSettings(WebView childWebView) {
        childWebView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);
        childWebView.setBackgroundColor(android.graphics.Color.parseColor("#090A0C"));
        WebSettings s = childWebView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setSupportMultipleWindows(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setSafeBrowsingEnabled(false);
        s.setGeolocationEnabled(true);
        s.setTextZoom(100);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (appUserAgent != null) {
            s.setUserAgentString(appUserAgent);
        }
        CookieManager.getInstance().setAcceptThirdPartyCookies(childWebView, true);
    }

    @Override
    public void onResume() {
        super.onResume();
        Bridge bridge = this.getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            WebView wv = bridge.getWebView();
            try {
                wv.resumeTimers();
                wv.onResume();
                wv.postInvalidate();
            } catch (Exception ignored) {}
        }
        applyCustomWebViewClient();
    }

    @Override
    public void onPause() {
        super.onPause();
        Bridge bridge = this.getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            WebView wv = bridge.getWebView();
            try {
                // Keep JS timers and game animation execution active in background across all windows
                wv.resumeTimers();
            } catch (Exception ignored) {}
        }
    }

    private void initOkHttp() {
        if (okHttpClient != null) return;

        CookieJar cookieJar = new CookieJar() {
            @Override
            public void saveFromResponse(HttpUrl url, List<Cookie> cookies) {
                CookieManager cm = CookieManager.getInstance();
                String urlStr = url.toString();
                for (Cookie c : cookies) {
                    String cookieStr = c.toString();
                    if (!cookieStr.toLowerCase(Locale.ROOT).contains("samesite=")) {
                        cookieStr += "; SameSite=None; Secure";
                    }
                    cm.setCookie(urlStr, cookieStr);
                }
                cm.flush();
            }

            @Override
            public List<Cookie> loadForRequest(HttpUrl url) {
                CookieManager cm = CookieManager.getInstance();
                String cookieHeader = cm.getCookie(url.toString());
                if (cookieHeader == null || cookieHeader.isEmpty()) {
                    return Collections.emptyList();
                }
                List<Cookie> result = new ArrayList<>();
                String[] pairs = cookieHeader.split(";");
                for (String pair : pairs) {
                    String[] parts = pair.trim().split("=", 2);
                    if (parts.length == 2) {
                        try {
                            Cookie c = new Cookie.Builder()
                                    .name(parts[0].trim())
                                    .value(parts[1].trim())
                                    .domain(url.host())
                                    .path("/")
                                    .build();
                            result.add(c);
                        } catch (Exception ignored) {}
                    }
                }
                return result;
            }
        };

        okHttpClient = new OkHttpClient.Builder()
                .cookieJar(cookieJar)
                .followRedirects(true)
                .followSslRedirects(true)
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(20, TimeUnit.SECONDS)
                .build();
    }

    private void applyCustomWebViewClient() {
        Bridge bridge = this.getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            if (customWebViewClient == null) {
                customWebViewClient = new FourNavWebViewClient(bridge, this);
                bridge.setWebViewClient(customWebViewClient);
                bridge.getWebView().setWebViewClient(customWebViewClient);
                logMessage("FourNavWebViewClient applied to Bridge and WebView");
            }
        }
    }

    private static boolean isStaticAsset(Uri uri) {
        String path = uri.getPath();
        if (path == null) return false;
        String lower = path.toLowerCase(Locale.ROOT);

        String host = uri.getHost();
        if (host != null && host.toLowerCase(Locale.ROOT).contains("assets.roclassicidle.com.br")) {
            // Let Chromium handle all binary game files directly, except the root probe which we handle if requested
            if (path.length() > 1) {
                return true;
            }
        }

        return lower.endsWith(".js") || lower.endsWith(".mjs")
                || lower.endsWith(".css")
                || lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")
                || lower.endsWith(".gif") || lower.endsWith(".webp") || lower.endsWith(".svg") || lower.endsWith(".ico")
                || lower.endsWith(".bmp") || lower.endsWith(".tga")
                || lower.endsWith(".woff") || lower.endsWith(".woff2") || lower.endsWith(".ttf") || lower.endsWith(".otf")
                || lower.endsWith(".mp3") || lower.endsWith(".wav") || lower.endsWith(".ogg") || lower.endsWith(".mp4")
                || lower.endsWith(".wasm") || lower.endsWith(".json") || lower.endsWith(".map")
                || lower.endsWith(".grf") || lower.endsWith(".spr") || lower.endsWith(".act")
                || lower.endsWith(".gat") || lower.endsWith(".rsw") || lower.endsWith(".rsm")
                || lower.endsWith(".pal") || lower.endsWith(".txt") || lower.endsWith(".xml")
                || lower.endsWith(".lua") || lower.endsWith(".lub");
    }

    public static WebResourceResponse processIntercept(String urlStr, String method) {
        return processIntercept(urlStr, method, null);
    }

    public static WebResourceResponse processIntercept(String urlStr, String method, Map<String, String> incomingHeaders) {
        Uri uri = Uri.parse(urlStr);
        if (uri == null) return null;

        String scheme = uri.getScheme();
        String host = uri.getHost();

        // Local Capacitor web assets (e.g. localhost, capacitor://) are served by Capacitor local server
        if (scheme != null && (scheme.equalsIgnoreCase("capacitor") || host == null || host.equalsIgnoreCase("localhost") || host.equalsIgnoreCase("127.0.0.1"))) {
            return null;
        }

        // Only intercept external HTTP/HTTPS requests
        if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
            return null;
        }

        // Synthetic 200 response for RagIdle remoteClient health probe
        if (host != null && host.toLowerCase(Locale.ROOT).contains("assets.roclassicidle.com.br")) {
            String path = uri.getPath();
            if (path == null || path.isEmpty() || path.equals("/")) {
                Map<String, String> probeHeaders = new HashMap<>();
                probeHeaders.put("Content-Type", "text/plain; charset=utf-8");
                probeHeaders.put("Access-Control-Allow-Origin", "*");
                probeHeaders.put("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
                probeHeaders.put("Access-Control-Allow-Headers", "*");
                return new WebResourceResponse("text/plain", "utf-8", 200, "OK", probeHeaders, new ByteArrayInputStream("OK".getBytes(StandardCharsets.UTF_8)));
            }
        }

        // Let Chromium handle static binary/resource assets directly for optimal performance
        if (isStaticAsset(uri)) {
            return null;
        }

        // Only intercept GET requests for HTML documents or frames
        if (method != null && !"GET".equalsIgnoreCase(method)) {
            return null;
        }

        // If incoming request headers are available, verify whether this request is an HTML document / iframe navigation
        if (incomingHeaders != null && !incomingHeaders.isEmpty()) {
            String fetchDest = incomingHeaders.get("Sec-Fetch-Dest");
            if (fetchDest == null) fetchDest = incomingHeaders.get("sec-fetch-dest");
            // If destination is specified and NOT a document or iframe (e.g. empty, script, style, image, font), let Chromium handle it directly!
            if (fetchDest != null && !fetchDest.equalsIgnoreCase("document") && !fetchDest.equalsIgnoreCase("iframe")) {
                return null;
            }

            String accept = incomingHeaders.get("Accept");
            if (accept == null) accept = incomingHeaders.get("accept");
            // If Accept does not ask for HTML and destination is not an iframe, let Chromium handle it directly!
            if (accept != null && !accept.toLowerCase(Locale.ROOT).contains("text/html") && (fetchDest == null || !fetchDest.equalsIgnoreCase("iframe"))) {
                return null;
            }
        } else {
            // No headers provided (legacy callback): only intercept root or .html pages
            String path = uri.getPath();
            if (path != null && path.contains(".")) {
                String lower = path.toLowerCase(Locale.ROOT);
                if (!lower.endsWith(".html") && !lower.endsWith(".htm") && !lower.endsWith(".php") && !lower.endsWith(".asp") && !lower.endsWith(".aspx")) {
                    return null;
                }
            }
        }

        try {
            logMessage("OkHttp Unblocking HTML Frame: " + urlStr);

            Request.Builder reqBuilder = new Request.Builder()
                    .url(urlStr)
                    .get();

            // Forward the actual browser request headers to avoid triggering bot detection on Google, Twitch, etc.
            if (incomingHeaders != null && !incomingHeaders.isEmpty()) {
                for (Map.Entry<String, String> entry : incomingHeaders.entrySet()) {
                    String name = entry.getKey();
                    if (!name.equalsIgnoreCase("Host") && !name.equalsIgnoreCase("Content-Length") && !name.equalsIgnoreCase("Accept-Encoding") && !name.equalsIgnoreCase("Cookie")) {
                        reqBuilder.header(name, entry.getValue());
                    }
                }
            } else {
                reqBuilder.header("User-Agent", appUserAgent != null ? appUserAgent : "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.6834.163 Mobile Safari/537.36");
                reqBuilder.header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8");
                reqBuilder.header("Accept-Language", "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7");
                reqBuilder.header("Upgrade-Insecure-Requests", "1");
            }

            Response response = okHttpClient.newCall(reqBuilder.build()).execute();
            ResponseBody body = response.body();

            String contentTypeHeader = response.header("Content-Type", "text/html; charset=utf-8");
            String mimeType = "text/html";
            String encoding = "utf-8";

            if (contentTypeHeader != null) {
                String[] parts = contentTypeHeader.split(";");
                mimeType = parts[0].trim();
                if (parts.length > 1) {
                    String p2 = parts[1].trim().toLowerCase(Locale.ROOT);
                    if (p2.startsWith("charset=")) {
                        encoding = p2.substring(8).trim();
                    }
                }
            }

            // Build sanitized response headers: NO X-Frame-Options, NO Content-Security-Policy, NO CORP
            Map<String, String> responseHeaders = new HashMap<>();
            Headers okHeaders = response.headers();
            for (int i = 0; i < okHeaders.size(); i++) {
                String name = okHeaders.name(i);
                String lower = name.toLowerCase(Locale.ROOT);
                if (lower.equals("x-frame-options") || lower.equals("frame-options")
                        || lower.equals("content-security-policy") || lower.equals("content-security-policy-report-only")
                        || lower.equals("cross-origin-resource-policy") || lower.equals("cross-origin-embedder-policy")
                        || lower.equals("cross-origin-opener-policy")) {
                    continue;
                }
                responseHeaders.put(name, okHeaders.value(i));
            }

            responseHeaders.put("Access-Control-Allow-Origin", "*");
            responseHeaders.put("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
            responseHeaders.put("Access-Control-Allow-Headers", "*");
            responseHeaders.put("Access-Control-Allow-Credentials", "true");
            responseHeaders.put("Cross-Origin-Resource-Policy", "cross-origin");

            byte[] responseBytes = new byte[0];
            if (body != null) {
                if (mimeType.toLowerCase(Locale.ROOT).contains("html")) {
                    String html = body.string();
                    String scriptTag = "<script>" + GHOST_CLEANER_SCRIPT + "</script>";
                    if (html.contains("</body>")) {
                        html = html.replace("</body>", scriptTag + "</body>");
                    } else {
                        html += scriptTag;
                    }
                    responseBytes = html.getBytes(StandardCharsets.UTF_8);
                } else {
                    responseBytes = body.bytes();
                }
            }

            logMessage("OkHttp unblocked frame: " + urlStr + " (code: " + response.code() + ")");

            return new WebResourceResponse(
                    mimeType,
                    encoding,
                    response.code(),
                    response.message().isEmpty() ? "OK" : response.message(),
                    responseHeaders,
                    new ByteArrayInputStream(responseBytes)
            );
        } catch (Exception ex) {
            logMessage("OkHttp error for " + urlStr + ": " + ex.getClass().getSimpleName() + " - " + ex.getMessage());
            Log.e(TAG, "OkHttp failed for: " + urlStr, ex);
            String errorMsg = ex.getClass().getSimpleName() + ": " + ex.getMessage();
            String errorHtml = "<!DOCTYPE html><html><body style=\"background:#090A0C;color:#EF4444;font-family:sans-serif;padding:24px;text-align:center;\">"
                    + "<div style=\"max-width:400px;margin:40px auto;border:1px solid #232832;background:#111317;padding:20px;border-radius:4px;\">"
                    + "<h3 style=\"color:#F3F4F6;margin-top:0;\">Falha ao Conectar</h3>"
                    + "<p style=\"color:#9CA3AF;font-size:12px;\">Ocorreu um erro ao interceptar o site: <br><code style=\"color:#3B82F6;\">" + urlStr + "</code></p>"
                    + "<p style=\"background:#181B21;padding:8px;font-size:11px;color:#F87171;word-break:break-all;\">" + errorMsg + "</p>"
                    + "<button onclick=\"location.reload()\" style=\"background:#3B82F6;color:#FFF;border:none;padding:8px 16px;border-radius:2px;font-weight:bold;cursor:pointer;margin-top:10px;\">Recarregar</button>"
                    + "</div></body></html>";
            Map<String, String> errHeaders = new HashMap<>();
            errHeaders.put("Content-Type", "text/html; charset=utf-8");
            errHeaders.put("Access-Control-Allow-Origin", "*");
            return new WebResourceResponse("text/html", "utf-8", 200, "OK", errHeaders, new ByteArrayInputStream(errorHtml.getBytes(StandardCharsets.UTF_8)));
        }
    }

    private static class FourNavWebViewClient extends BridgeWebViewClient {
        private final java.lang.ref.WeakReference<MainActivity> activityRef;

        public FourNavWebViewClient(Bridge bridge, MainActivity activity) {
            super(bridge);
            this.activityRef = new java.lang.ref.WeakReference<>(activity);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            MainActivity activity = activityRef.get();
            if (activity != null) {
                activity.injectGhostPopupCleaner(view);
            }
        }

        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            boolean didCrash = detail != null && detail.didCrash();
            logMessage("CRITICAL: WebView render process gone! didCrash=" + didCrash);
            if (view != null) {
                try {
                    view.destroy();
                } catch (Exception ignored) {}
            }
            MainActivity activity = activityRef.get();
            if (activity != null && !activity.isFinishing()) {
                activity.runOnUiThread(() -> {
                    try {
                        logMessage("Recreating MainActivity to restore WebView after renderProcessGone...");
                        activity.recreate();
                    } catch (Exception e) {
                        logMessage("Failed to recreate activity: " + e.getMessage());
                    }
                });
            }
            return true;
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            // Keep all navigations within the webview and iframes without launching external intent apps
            return false;
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
            if (url != null) {
                WebResourceResponse resp = processIntercept(url, "GET", null);
                if (resp != null) return resp;
            }
            return super.shouldInterceptRequest(view, url);
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            if (request != null && request.getUrl() != null) {
                WebResourceResponse resp = processIntercept(request.getUrl().toString(), request.getMethod(), request.getRequestHeaders());
                if (resp != null) return resp;
            }
            return super.shouldInterceptRequest(view, request);
        }
    }
}
