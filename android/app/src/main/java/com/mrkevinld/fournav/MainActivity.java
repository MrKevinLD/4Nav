package com.mrkevinld.fournav;

import android.net.Uri;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MainActivity extends BridgeActivity {

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
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setSupportMultipleWindows(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
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

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (uri == null) {
                return super.shouldInterceptRequest(view, request);
            }

            String scheme = uri.getScheme();
            String host = uri.getHost();

            // Local Capacitor web assets (e.g. localhost, capacitor://) are served by Capacitor local server
            if (scheme != null && (scheme.equals("capacitor") || host == null || host.equals("localhost") || host.equals("127.0.0.1"))) {
                return super.shouldInterceptRequest(view, request);
            }

            // Intercept external HTTP/HTTPS GET requests that could be framed documents (with X-Frame-Options)
            String method = request.getMethod();
            if ("GET".equalsIgnoreCase(method) && scheme != null && (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                Map<String, String> reqHeaders = request.getRequestHeaders();
                String accept = reqHeaders != null ? reqHeaders.get("Accept") : null;
                String secFetchDest = reqHeaders != null ? reqHeaders.get("Sec-Fetch-Dest") : null;
                String secFetchMode = reqHeaders != null ? reqHeaders.get("Sec-Fetch-Mode") : null;

                boolean isFrameOrDoc = (secFetchDest != null && (secFetchDest.equals("iframe") || secFetchDest.equals("frame") || secFetchDest.equals("document")))
                        || (secFetchMode != null && secFetchMode.equals("navigate"))
                        || (accept != null && accept.contains("text/html"));

                if (isFrameOrDoc) {
                    try {
                        String currentUrl = uri.toString();
                        HttpURLConnection conn = null;
                        int redirects = 0;

                        while (redirects < 6) {
                            URL target = new URL(currentUrl);
                            conn = (HttpURLConnection) target.openConnection();
                            conn.setRequestMethod("GET");
                            conn.setInstanceFollowRedirects(false);
                            conn.setConnectTimeout(10000);
                            conn.setReadTimeout(15000);

                            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36");
                            if (reqHeaders != null) {
                                for (Map.Entry<String, String> e : reqHeaders.entrySet()) {
                                    String k = e.getKey();
                                    if (!k.equalsIgnoreCase("User-Agent") && !k.equalsIgnoreCase("Host")) {
                                        conn.setRequestProperty(k, e.getValue());
                                    }
                                }
                            }

                            // Forward cookies from CookieManager
                            String cookie = CookieManager.getInstance().getCookie(currentUrl);
                            if (cookie != null && !cookie.isEmpty()) {
                                conn.setRequestProperty("Cookie", cookie);
                            }

                            conn.connect();

                            int code = conn.getResponseCode();

                            // Collect Set-Cookie headers back into CookieManager
                            Map<String, List<String>> headerFields = conn.getHeaderFields();
                            if (headerFields != null) {
                                for (Map.Entry<String, List<String>> entry : headerFields.entrySet()) {
                                    if ("Set-Cookie".equalsIgnoreCase(entry.getKey()) && entry.getValue() != null) {
                                        for (String val : entry.getValue()) {
                                            CookieManager.getInstance().setCookie(currentUrl, val);
                                        }
                                    }
                                }
                            }

                            // Follow redirects across protocols (e.g. http to https)
                            if (code == HttpURLConnection.HTTP_MOVED_PERM || code == HttpURLConnection.HTTP_MOVED_TEMP || code == 307 || code == 308) {
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
                            String message = conn.getResponseMessage();
                            String contentTypeHeader = conn.getContentType();
                            String mimeType = "text/html";
                            String encoding = "utf-8";

                            if (contentTypeHeader != null) {
                                String[] parts = contentTypeHeader.split(";");
                                mimeType = parts[0].trim();
                                if (parts.length > 1) {
                                    String p2 = parts[1].trim().toLowerCase();
                                    if (p2.startsWith("charset=")) {
                                        encoding = p2.substring(8).trim();
                                    }
                                }
                            }

                            // Strip X-Frame-Options and frame-ancestors from headers
                            Map<String, String> responseHeaders = new HashMap<>();
                            Map<String, List<String>> headerFields = conn.getHeaderFields();
                            if (headerFields != null) {
                                for (Map.Entry<String, List<String>> entry : headerFields.entrySet()) {
                                    String key = entry.getKey();
                                    if (key == null) continue;
                                    String lk = key.toLowerCase();

                                    if (lk.equals("x-frame-options")) {
                                        // Strip!
                                        continue;
                                    }
                                    if (lk.equals("content-security-policy") || lk.equals("content-security-policy-report-only")) {
                                        StringBuilder sb = new StringBuilder();
                                        for (String val : entry.getValue()) {
                                            String cleaned = val.replaceAll("(?i)frame-ancestors[^;]*;?", "");
                                            if (sb.length() > 0) sb.append("; ");
                                            sb.append(cleaned);
                                        }
                                        responseHeaders.put(key, sb.toString());
                                    } else if (!entry.getValue().isEmpty()) {
                                        responseHeaders.put(key, entry.getValue().get(0));
                                    }
                                }
                            }

                            responseHeaders.put("Access-Control-Allow-Origin", "*");

                            InputStream in = (code >= 400) ? conn.getErrorStream() : conn.getInputStream();
                            if (in == null) in = conn.getInputStream();

                            return new WebResourceResponse(
                                mimeType,
                                encoding,
                                code,
                                message != null ? message : "OK",
                                responseHeaders,
                                in
                            );
                        }
                    } catch (Exception ex) {
                        return super.shouldInterceptRequest(view, request);
                    }
                }
            }

            return super.shouldInterceptRequest(view, request);
        }
    }
}
