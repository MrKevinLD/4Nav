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
            WebSettings settings = webView.getSettings();

            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setAllowFileAccessFromFileURLs(true);
            settings.setAllowUniversalAccessFromFileURLs(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setSupportMultipleWindows(false);
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
            });

            applyCustomWebViewClient();
        }
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
                wv.onPause();
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

            logMessage("OkHttp unblocked frame: " + urlStr + " (code: " + response.code() + ")");

            return new WebResourceResponse(
                    mimeType,
                    encoding,
                    response.code(),
                    response.message().isEmpty() ? "OK" : response.message(),
                    responseHeaders,
                    body != null ? body.byteStream() : new ByteArrayInputStream(new byte[0])
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
