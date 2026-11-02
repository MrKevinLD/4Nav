package com.mrkevinld.fournav;

import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.zip.GZIPInputStream;
import java.util.zip.InflaterInputStream;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "4Nav";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Bridge bridge = this.getBridge();
        if (bridge != null) {
            WebView webView = bridge.getWebView();
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
            settings.setUserAgentString("Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36");

            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);

            bridge.setWebViewClient(new FourNavWebViewClient(bridge));
        }
    }

    private static class FourNavWebViewClient extends BridgeWebViewClient {
        public FourNavWebViewClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            // Keep all navigations within the webview and iframes without launching external intent apps
            return false;
        }

        private boolean isStaticAsset(Uri uri) {
            String path = uri.getPath();
            if (path == null) return false;
            String lower = path.toLowerCase(Locale.ROOT);
            return lower.endsWith(".js") || lower.endsWith(".mjs")
                    || lower.endsWith(".css")
                    || lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")
                    || lower.endsWith(".gif") || lower.endsWith(".webp") || lower.endsWith(".svg") || lower.endsWith(".ico")
                    || lower.endsWith(".woff") || lower.endsWith(".woff2") || lower.endsWith(".ttf") || lower.endsWith(".otf")
                    || lower.endsWith(".mp3") || lower.endsWith(".wav") || lower.endsWith(".ogg") || lower.endsWith(".mp4")
                    || lower.endsWith(".wasm") || lower.endsWith(".json") || lower.endsWith(".map");
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (uri == null) {
                return super.shouldInterceptRequest(view, request);
            }

            String scheme = uri.getScheme();
            String host = uri.getHost();

            // Local Capacitor web assets (e.g. localhost, capacitor://) are served by Capacitor local server
            if (scheme != null && (scheme.equalsIgnoreCase("capacitor") || host == null || host.equalsIgnoreCase("localhost") || host.equalsIgnoreCase("127.0.0.1"))) {
                return super.shouldInterceptRequest(view, request);
            }

            // Only intercept external HTTP/HTTPS GET requests that are HTML documents or non-static assets
            String method = request.getMethod();
            if ("GET".equalsIgnoreCase(method) && scheme != null && (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                
                // Let Chromium handle static binary/resource assets directly for optimal performance
                if (isStaticAsset(uri)) {
                    return super.shouldInterceptRequest(view, request);
                }

                try {
                    String currentUrl = uri.toString();
                    HttpURLConnection conn = null;
                    int redirects = 0;

                    while (redirects < 8) {
                        URL target = new URL(currentUrl);
                        conn = (HttpURLConnection) target.openConnection();
                        conn.setRequestMethod("GET");
                        conn.setInstanceFollowRedirects(false);
                        conn.setConnectTimeout(12000);
                        conn.setReadTimeout(18000);

                        // Emulate top-level Android Chrome navigation headers so WAF / Cloudflare never flags iframe framing
                        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36");
                        conn.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8");
                        conn.setRequestProperty("Accept-Language", "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7");
                        conn.setRequestProperty("Sec-Ch-Ua", "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\", \"Google Chrome\";v=\"132\"");
                        conn.setRequestProperty("Sec-Ch-Ua-Mobile", "?1");
                        conn.setRequestProperty("Sec-Ch-Ua-Platform", "\"Android\"");
                        conn.setRequestProperty("Sec-Fetch-Dest", "document");
                        conn.setRequestProperty("Sec-Fetch-Mode", "navigate");
                        conn.setRequestProperty("Sec-Fetch-Site", "none");
                        conn.setRequestProperty("Sec-Fetch-User", "?1");
                        conn.setRequestProperty("Upgrade-Insecure-Requests", "1");

                        // Forward relevant safe headers from WebView request, omitting forbidden/cross-site identifiers
                        Map<String, String> reqHeaders = request.getRequestHeaders();
                        if (reqHeaders != null) {
                            for (Map.Entry<String, String> e : reqHeaders.entrySet()) {
                                String k = e.getKey();
                                String v = e.getValue();
                                if (k == null || v == null) continue;
                                String lowerK = k.toLowerCase(Locale.ROOT);
                                if (!lowerK.equals("user-agent")
                                        && !lowerK.equals("host")
                                        && !lowerK.equals("accept-encoding")
                                        && !lowerK.equals("connection")
                                        && !lowerK.equals("sec-fetch-dest")
                                        && !lowerK.equals("sec-fetch-mode")
                                        && !lowerK.equals("sec-fetch-site")
                                        && !lowerK.equals("sec-fetch-user")
                                        && !lowerK.equals("referer")
                                        && !lowerK.equals("origin")) {
                                    try {
                                        conn.setRequestProperty(k, v);
                                    } catch (Exception ignored) {}
                                }
                            }
                        }

                        // Forward cookies from CookieManager
                        try {
                            String cookie = CookieManager.getInstance().getCookie(currentUrl);
                            if (cookie != null && !cookie.isEmpty()) {
                                conn.setRequestProperty("Cookie", cookie);
                            }
                        } catch (Exception ignored) {}

                        conn.connect();

                        int code = conn.getResponseCode();

                        // Collect Set-Cookie headers back into CookieManager
                        Map<String, List<String>> headerFields = conn.getHeaderFields();
                        if (headerFields != null) {
                            for (Map.Entry<String, List<String>> entry : headerFields.entrySet()) {
                                String key = entry.getKey();
                                if (key != null && (key.equalsIgnoreCase("Set-Cookie") || key.equalsIgnoreCase("Set-Cookie2")) && entry.getValue() != null) {
                                    for (String val : entry.getValue()) {
                                        if (val != null) {
                                            try {
                                                CookieManager.getInstance().setCookie(currentUrl, val);
                                            } catch (Exception ignored) {}
                                        }
                                    }
                                }
                            }
                        }

                        // Follow redirects across protocols
                        if (code == HttpURLConnection.HTTP_MOVED_PERM || code == HttpURLConnection.HTTP_MOVED_TEMP || code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                            String loc = conn.getHeaderField("Location");
                            if (loc != null) {
                                URL next = new URL(target, loc);
                                currentUrl = next.toString();
                                redirects++;
                                conn.disconnect();
                                continue;
                            }
                        }
                        break;
                    }

                    if (conn != null) {
                        int code = conn.getResponseCode();
                        String contentTypeHeader = conn.getContentType();
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

                        // Read response stream safely with GZIP/deflate handling
                        String contentEncoding = conn.getContentEncoding();
                        InputStream in = (code >= 400) ? conn.getErrorStream() : conn.getInputStream();
                        if (in != null) {
                            if ("gzip".equalsIgnoreCase(contentEncoding)) {
                                in = new GZIPInputStream(in);
                            } else if ("deflate".equalsIgnoreCase(contentEncoding)) {
                                in = new InflaterInputStream(in);
                            }
                        }

                        ByteArrayOutputStream bos = new ByteArrayOutputStream();
                        if (in != null) {
                            byte[] buf = new byte[8192];
                            int n;
                            while ((n = in.read(buf)) != -1) {
                                bos.write(buf, 0, n);
                            }
                            in.close();
                        }
                        byte[] bodyBytes = bos.toByteArray();

                        // If HTML document, inject <base> tag and frame unblock polyfill
                        if (mimeType.toLowerCase(Locale.ROOT).contains("html") && bodyBytes.length > 0) {
                            try {
                                String charsetName = encoding != null && !encoding.isEmpty() ? encoding : "UTF-8";
                                String html = new String(bodyBytes, charsetName);

                                // Expunge any meta http-equiv="X-Frame-Options" or CSP
                                html = html.replaceAll("(?i)<meta[^>]*http-equiv=[\"']?x-frame-options[\"']?[^>]*>", "");
                                html = html.replaceAll("(?i)<meta[^>]*http-equiv=[\"']?content-security-policy[\"']?[^>]*>", "");

                                String baseHref = currentUrl.endsWith("/") ? currentUrl : currentUrl + "/";
                                String injectedHead = "<head><base href=\"" + baseHref + "\"><script>"
                                        + "try { Object.defineProperty(window,'top',{get:function(){return window.self;}});"
                                        + "Object.defineProperty(window,'parent',{get:function(){return window.self;}}); } catch(e){}"
                                        + "</script>";

                                if (html.contains("<head>")) {
                                    html = html.replaceFirst("(?i)<head>", injectedHead);
                                } else if (html.contains("<html>")) {
                                    html = html.replaceFirst("(?i)<html>", "<html>" + injectedHead + "</head>");
                                } else {
                                    html = injectedHead + "</head>" + html;
                                }

                                bodyBytes = html.getBytes(StandardCharsets.UTF_8);
                                encoding = "utf-8";
                            } catch (Exception ignored) {}
                        }

                        // Build clean response headers: NO X-Frame-Options, NO Content-Security-Policy, NO restrictive headers
                        Map<String, String> responseHeaders = new HashMap<>();
                        responseHeaders.put("Content-Type", mimeType + "; charset=" + encoding);
                        responseHeaders.put("Access-Control-Allow-Origin", "*");
                        responseHeaders.put("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
                        responseHeaders.put("Access-Control-Allow-Headers", "*");
                        responseHeaders.put("Access-Control-Allow-Credentials", "true");
                        responseHeaders.put("Cache-Control", "no-cache");

                        Log.d(TAG, "Successfully intercepted and unblocked frame: " + uri);

                        return new WebResourceResponse(
                            mimeType,
                            encoding,
                            200,
                            "OK",
                            responseHeaders,
                            new ByteArrayInputStream(bodyBytes)
                        );
                    }
                } catch (Exception ex) {
                    Log.e(TAG, "Interception fallback for: " + uri, ex);
                    return super.shouldInterceptRequest(view, request);
                }
            }

            return super.shouldInterceptRequest(view, request);
        }
    }
}
