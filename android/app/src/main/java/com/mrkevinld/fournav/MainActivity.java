package com.mrkevinld.fournav;

import android.app.AlertDialog;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
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
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
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

    // Native Opera GX-style Multi-WebView Dual Containers
    private FrameLayout nativeDualContainer;
    private WebView nativeWebView1;
    private WebView nativeWebView2;
    private LinearLayout j1Container;
    private LinearLayout j2Container;
    private LinearLayout j1Bar;
    private EditText j1UrlInput;
    private LinearLayout j2Bar;
    private EditText j2UrlInput;
    private View dividerView;
    private LinearLayout nativeHeaderBar;
    private LinearLayout nativeFooterBar;
    private TextView floatingRestoreBtn;
    private boolean nativeBarsVisible = true;
    private int currentLayoutMode = 0; // 0 = 50:50 Vertical, 1 = J1, 2 = J2
    private String urlPane1 = "https://play.roclassicidle.com.br/";
    private String urlPane2 = "https://play.roclassicidle.com.br/";

    private static final String PORTRAIT_EMULATION_JS =
            "(function() {" +
            "  try {" +
            "    if (window.screen) {" +
            "      Object.defineProperty(window.screen, 'orientation', {" +
            "        get: function() { return { angle: 0, type: 'portrait-primary', onchange: null, lock: function() { return Promise.resolve(); }, unlock: function() {} }; }," +
            "        configurable: true" +
            "      });" +
            "    }" +
            "    Object.defineProperty(window, 'orientation', { get: function() { return 0; }, configurable: true });" +
            "    if (window.matchMedia && !window.__4navMatchMediaHooked) {" +
            "      window.__4navMatchMediaHooked = true;" +
            "      var _mm = window.matchMedia;" +
            "      window.matchMedia = function(q) {" +
            "        var s = String(q || '').toLowerCase();" +
            "        if (s.indexOf('orientation: landscape') !== -1 || s.indexOf('orientation:landscape') !== -1 || s.indexOf('max-height: 599px') !== -1 || s.indexOf('max-height:599px') !== -1) {" +
            "          return { matches: false, media: q, onchange: null, addListener: function(){}, removeListener: function(){}, addEventListener: function(){}, removeEventListener: function(){}, dispatchEvent: function(){ return false; } };" +
            "        }" +
            "        if (s.indexOf('orientation: portrait') !== -1 || s.indexOf('orientation:portrait') !== -1) {" +
            "          return { matches: true, media: q, onchange: null, addListener: function(){}, removeListener: function(){}, addEventListener: function(){}, removeEventListener: function(){}, dispatchEvent: function(){ return false; } };" +
            "        }" +
            "        return _mm.apply(this, arguments);" +
            "      };" +
            "    }" +
            "    if (!document.getElementById('__4nav_hide_rotate')) {" +
            "      var st = document.createElement('style');" +
            "      st.id = '__4nav_hide_rotate';" +
            "      st.textContent = '#ri-gire-o-celular, [id*=\"gire-o-celular\"] { display: none !important; visibility: hidden !important; pointer-events: none !important; width: 0 !important; height: 0 !important; opacity: 0 !important; }';" +
            "      (document.head || document.documentElement).appendChild(st);" +
            "    }" +
            "    var el = document.getElementById('ri-gire-o-celular');" +
            "    if (el && el.parentNode) el.parentNode.removeChild(el);" +
            "    if (!window.ROConfig) window.ROConfig = {};" +
            "    window.ROConfig.enableHudDeitada = true;" +
            "  } catch(e) {}" +
            "})();";

    private static final String STANDALONE_SHIM_SCRIPT =
            "<script>" +
            "(function() {" +
            "  try {" +
            "    Object.defineProperty(window, 'top', { get: function() { return window; }, configurable: false, enumerable: true });" +
            "    Object.defineProperty(window, 'parent', { get: function() { return window; }, configurable: false, enumerable: true });" +
            "    Object.defineProperty(window, 'frameElement', { get: function() { return null; }, configurable: false, enumerable: true });" +
            "  } catch(e) {}" +
            "})();" +
            PORTRAIT_EMULATION_JS +
            "</script>" +
            "<style id='__4nav_hide_rotate'>" +
            "#ri-gire-o-celular, [id*='gire-o-celular'] { display: none !important; visibility: hidden !important; pointer-events: none !important; width: 0 !important; height: 0 !important; opacity: 0 !important; }" +
            "</style>";

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
            "              if (modal.id === 'Escape' || modal.classList.contains('popup') || modal.classList.contains('overlay') || modal.classList.contains('wl-window')) {" +
            "                modal.remove();" +
            "              }" +
            "            }" +
            "          }" +
            "        } catch (err) {}" +
            "      }, 150);" +
            "    }" +
            "  }" +
            "  document.addEventListener('click', checkAndDismissGhost, true);" +
            "  document.addEventListener('touchend', checkAndDismissGhost, true);" +
            "  window.__sweepAllGhostElements = function() {" +
            "    var selectors = ['#Escape', '#WinPopup', '#WinMSG', '#WinError', '.modal.fade:not(.show)', '.modal-backdrop', '.overlay[style*=\"opacity: 0\"]', '.wl-window'];" +
            "    selectors.forEach(function(sel) {" +
            "      try {" +
            "        document.querySelectorAll(sel).forEach(function(el) {" +
            "          el.style.setProperty('display', 'none', 'important');" +
            "          el.style.setProperty('pointer-events', 'none', 'important');" +
            "        });" +
            "      } catch (e) {}" +
            "    });" +
            "  };" +
            "  setInterval(function() {" +
            "    try {" +
            "      var inGame = document.querySelector('.Auto, [class*=\"Auto\"], [class*=\"auto\"], .ri-hud, #ro-shop-btn, [title*=\"Mochila\"], [title*=\"Skills\"]');" +
            "      var loginModal = document.querySelector('#WinLogin, .wl-window');" +
            "      if (inGame && loginModal) {" +
            "        loginModal.style.setProperty('display', 'none', 'important');" +
            "        loginModal.style.setProperty('pointer-events', 'none', 'important');" +
            "        if (loginModal.parentNode) loginModal.parentNode.removeChild(loginModal);" +
            "      }" +
            "    } catch (e) {}" +
            "  }, 800);" +
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

    public void injectPortraitEmulation(WebView webView) {
        if (webView == null) return;
        runOnUiThread(() -> {
            try {
                webView.evaluateJavascript(PORTRAIT_EMULATION_JS, null);
            } catch (Exception ignored) {}
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

        @android.webkit.JavascriptInterface
        public void showNativeDualScreen() {
            runOnUiThread(() -> {
                if (nativeDualContainer != null) {
                    nativeDualContainer.setVisibility(View.VISIBLE);
                } else {
                    setupNativeDualWebViews();
                }
            });
        }

        @android.webkit.JavascriptInterface
        public void hideNativeDualScreen() {
            runOnUiThread(() -> {
                if (nativeDualContainer != null) {
                    nativeDualContainer.setVisibility(View.GONE);
                }
            });
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

        // Setup Opera GX-style Native Multi-WebView Split Screen
        setupNativeDualWebViews();
    }

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density + 0.5f);
    }

    private TextView createStyledButton(String text, String textColorHex, String bgHex, Runnable onClick) {
        TextView btn = new TextView(this);
        btn.setText(text);
        btn.setTextColor(Color.parseColor(textColorHex));
        btn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        btn.setTypeface(null, Typeface.BOLD);
        btn.setGravity(Gravity.CENTER);
        int padH = dpToPx(8);
        int padV = dpToPx(5);
        btn.setPadding(padH, padV, padH, padV);

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor(bgHex));
        bg.setCornerRadius(dpToPx(3));
        bg.setStroke(dpToPx(1), Color.parseColor("#232832"));
        btn.setBackground(bg);

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.leftMargin = dpToPx(3);
        btn.setLayoutParams(lp);

        btn.setOnClickListener(v -> onClick.run());
        return btn;
    }

    private LinearLayout createPaneUrlBar(int paneIndex, String defaultUrl, String badgeText, String badgeTextColor, String badgeStrokeColor) {
        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setBackgroundColor(Color.parseColor("#0F131A"));
        bar.setGravity(Gravity.CENTER_VERTICAL);
        int padH = dpToPx(6);
        int padV = dpToPx(4);
        bar.setPadding(padH, padV, padH, padV);
        bar.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        // Badge J1 / J2
        TextView badge = new TextView(this);
        badge.setText(badgeText);
        badge.setTextColor(Color.parseColor(badgeTextColor));
        badge.setTypeface(null, Typeface.BOLD);
        badge.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        badge.setGravity(Gravity.CENTER);
        badge.setPadding(dpToPx(7), dpToPx(3), dpToPx(7), dpToPx(3));
        GradientDrawable badgeBg = new GradientDrawable();
        badgeBg.setColor(Color.parseColor("#171D27"));
        badgeBg.setStroke(dpToPx(1), Color.parseColor(badgeStrokeColor));
        badgeBg.setCornerRadius(dpToPx(4));
        badge.setBackground(badgeBg);
        bar.addView(badge);

        // URL Input
        EditText input = new EditText(this);
        input.setText(defaultUrl);
        input.setSingleLine(true);
        input.setMaxLines(1);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        input.setImeOptions(EditorInfo.IME_ACTION_GO);
        input.setTextColor(Color.parseColor("#E5E7EB"));
        input.setHint("Digite ou cole a URL...");
        input.setHintTextColor(Color.parseColor("#4B5563"));
        input.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        input.setPadding(dpToPx(8), dpToPx(4), dpToPx(8), dpToPx(4));

        GradientDrawable inputBg = new GradientDrawable();
        inputBg.setColor(Color.parseColor("#141822"));
        inputBg.setStroke(dpToPx(1), Color.parseColor("#252E3E"));
        inputBg.setCornerRadius(dpToPx(4));
        input.setBackground(inputBg);

        LinearLayout.LayoutParams inputParams = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        inputParams.leftMargin = dpToPx(5);
        inputParams.rightMargin = dpToPx(4);
        input.setLayoutParams(inputParams);

        if (paneIndex == 1) {
            j1UrlInput = input;
        } else {
            j2UrlInput = input;
        }

        input.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_GO || (event != null && event.getKeyCode() == KeyEvent.KEYCODE_ENTER)) {
                navigateToUrl(paneIndex, input.getText().toString());
                return true;
            }
            return false;
        });
        bar.addView(input);

        // Go button
        TextView btnGo = createStyledButton("Ir", "#FFFFFF", badgeStrokeColor, () -> {
            navigateToUrl(paneIndex, input.getText().toString());
        });
        bar.addView(btnGo);

        // Reload button
        TextView btnReload = createStyledButton("🔄", "#9CA3AF", "#1B202A", () -> {
            if (paneIndex == 1 && nativeWebView1 != null) nativeWebView1.reload();
            if (paneIndex == 2 && nativeWebView2 != null) nativeWebView2.reload();
        });
        bar.addView(btnReload);

        return bar;
    }

    private void navigateToUrl(int pane, String rawUrl) {
        if (rawUrl == null) return;
        String cleanUrl = rawUrl.trim();
        if (cleanUrl.isEmpty()) return;
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            cleanUrl = "https://" + cleanUrl;
        }
        if (pane == 1) {
            urlPane1 = cleanUrl;
            if (j1UrlInput != null) j1UrlInput.setText(cleanUrl);
            if (nativeWebView1 != null) nativeWebView1.loadUrl(cleanUrl);
        } else if (pane == 2) {
            urlPane2 = cleanUrl;
            if (j2UrlInput != null) j2UrlInput.setText(cleanUrl);
            if (nativeWebView2 != null) nativeWebView2.loadUrl(cleanUrl);
        }
    }

    public void updateUrlInputFromPage(WebView view, String url) {
        if (url == null || url.isEmpty() || url.startsWith("about:") || url.startsWith("javascript:")) return;
        runOnUiThread(() -> {
            if (view == nativeWebView1) {
                urlPane1 = url;
                if (j1UrlInput != null && !j1UrlInput.hasFocus()) {
                    j1UrlInput.setText(url);
                }
            } else if (view == nativeWebView2) {
                urlPane2 = url;
                if (j2UrlInput != null && !j2UrlInput.hasFocus()) {
                    j2UrlInput.setText(url);
                }
            }
        });
    }

    private void setupNativeDualWebViews() {
        if (nativeDualContainer != null) return;

        runOnUiThread(() -> {
            ViewGroup rootView = findViewById(android.R.id.content);
            if (rootView == null) return;

            nativeDualContainer = new FrameLayout(this);
            nativeDualContainer.setBackgroundColor(Color.parseColor("#090A0C"));

            LinearLayout mainLayout = new LinearLayout(this);
            mainLayout.setOrientation(LinearLayout.VERTICAL);
            mainLayout.setLayoutParams(new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
            ));

            // 1. TOP CONTROL BAR
            nativeHeaderBar = new LinearLayout(this);
            nativeHeaderBar.setOrientation(LinearLayout.HORIZONTAL);
            nativeHeaderBar.setBackgroundColor(Color.parseColor("#0D1017"));
            nativeHeaderBar.setGravity(Gravity.CENTER_VERTICAL);
            int padH = dpToPx(8);
            int padV = dpToPx(6);
            nativeHeaderBar.setPadding(padH, padV, padH, padV);
            nativeHeaderBar.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            ));

            TextView titleView = new TextView(this);
            titleView.setText("4NAV DUAL");
            titleView.setTextColor(Color.parseColor("#3B82F6"));
            titleView.setTypeface(null, Typeface.BOLD);
            titleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
            nativeHeaderBar.addView(titleView);

            View headerSpacer = new View(this);
            headerSpacer.setLayoutParams(new LinearLayout.LayoutParams(0, 0, 1.0f));
            nativeHeaderBar.addView(headerSpacer);

            TextView btnSplit = createStyledButton("50:50", "#EAB308", "#1E232D", () -> switchToLayoutMode(0));
            TextView btnJ1 = createStyledButton("J1", "#3B82F6", "#15181F", () -> switchToLayoutMode(1));
            TextView btnJ2 = createStyledButton("J2", "#3B82F6", "#15181F", () -> switchToLayoutMode(2));
            TextView btnHide = createStyledButton("✕ Ocultar", "#9CA3AF", "#15181F", this::toggleNativeBars);

            nativeHeaderBar.addView(btnSplit);
            nativeHeaderBar.addView(btnJ1);
            nativeHeaderBar.addView(btnJ2);
            nativeHeaderBar.addView(btnHide);

            mainLayout.addView(nativeHeaderBar);

            // 2. DUAL SPLIT WEBVIEWS (Each with dedicated URL bar)
            LinearLayout splitArea = new LinearLayout(this);
            splitArea.setOrientation(LinearLayout.VERTICAL);
            splitArea.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    0,
                    1.0f
            ));

            // J1 Container (URL Bar + WebView 1)
            j1Container = new LinearLayout(this);
            j1Container.setOrientation(LinearLayout.VERTICAL);
            j1Container.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    0,
                    1.0f
            ));
            j1Bar = createPaneUrlBar(1, urlPane1, "J1", "#60A5FA", "#2563EB");
            j1Container.addView(j1Bar);

            nativeWebView1 = new WebView(this);
            nativeWebView1.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    0,
                    1.0f
            ));
            configureChildWebSettings(nativeWebView1);
            nativeWebView1.setWebViewClient(new FourNavChildWebViewClient(this));
            nativeWebView1.setWebChromeClient(new WebChromeClient());
            j1Container.addView(nativeWebView1);

            // Divider
            dividerView = new View(this);
            dividerView.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    dpToPx(2)
            ));
            dividerView.setBackgroundColor(Color.parseColor("#232832"));

            // J2 Container (URL Bar + WebView 2)
            j2Container = new LinearLayout(this);
            j2Container.setOrientation(LinearLayout.VERTICAL);
            j2Container.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    0,
                    1.0f
            ));
            j2Bar = createPaneUrlBar(2, urlPane2, "J2", "#34D399", "#059669");
            j2Container.addView(j2Bar);

            nativeWebView2 = new WebView(this);
            nativeWebView2.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    0,
                    1.0f
            ));
            configureChildWebSettings(nativeWebView2);
            nativeWebView2.setWebViewClient(new FourNavChildWebViewClient(this));
            nativeWebView2.setWebChromeClient(new WebChromeClient());
            j2Container.addView(nativeWebView2);

            splitArea.addView(j1Container);
            splitArea.addView(dividerView);
            splitArea.addView(j2Container);

            mainLayout.addView(splitArea);

            // 3. BOTTOM CONTROL BAR
            nativeFooterBar = new LinearLayout(this);
            nativeFooterBar.setOrientation(LinearLayout.HORIZONTAL);
            nativeFooterBar.setBackgroundColor(Color.parseColor("#0D1017"));
            nativeFooterBar.setGravity(Gravity.CENTER_VERTICAL);
            nativeFooterBar.setPadding(padH, padV, padH, padV);
            nativeFooterBar.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            ));

            TextView statusWake = new TextView(this);
            statusWake.setText("⚡ 60 FPS • WakeLock");
            statusWake.setTextColor(Color.parseColor("#EAB308"));
            statusWake.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10);
            statusWake.setPadding(dpToPx(4), dpToPx(2), dpToPx(4), dpToPx(2));

            View footerSpacer = new View(this);
            footerSpacer.setLayoutParams(new LinearLayout.LayoutParams(0, 0, 1.0f));

            TextView btnClearMem = createStyledButton("🧹 Limpar", "#9CA3AF", "#15181F", () -> {
                CookieManager.getInstance().flush();
                System.gc();
            });
            TextView btnUrl = createStyledButton("🔗 URL Modal", "#3B82F6", "#15181F", this::promptChangeUrl);
            TextView btnWeb = createStyledButton("🏠 Web", "#9CA3AF", "#15181F", this::toggleNativeDualMode);

            nativeFooterBar.addView(statusWake);
            nativeFooterBar.addView(footerSpacer);
            nativeFooterBar.addView(btnClearMem);
            nativeFooterBar.addView(btnUrl);
            nativeFooterBar.addView(btnWeb);

            mainLayout.addView(nativeFooterBar);
            nativeDualContainer.addView(mainLayout);

            // 4. FLOATING RESTORE BUTTON (Shown when bars are hidden)
            floatingRestoreBtn = new TextView(this);
            floatingRestoreBtn.setText("⚙");
            floatingRestoreBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
            floatingRestoreBtn.setTextColor(Color.parseColor("#EAB308"));
            floatingRestoreBtn.setGravity(Gravity.CENTER);
            GradientDrawable floatBg = new GradientDrawable();
            floatBg.setColor(Color.parseColor("#CC111317"));
            floatBg.setStroke(dpToPx(1), Color.parseColor("#3B82F6"));
            floatBg.setCornerRadius(dpToPx(18));
            floatingRestoreBtn.setBackground(floatBg);
            FrameLayout.LayoutParams floatParam = new FrameLayout.LayoutParams(dpToPx(36), dpToPx(36));
            floatParam.gravity = Gravity.TOP | Gravity.END;
            floatParam.topMargin = dpToPx(8);
            floatParam.rightMargin = dpToPx(8);
            floatingRestoreBtn.setLayoutParams(floatParam);
            floatingRestoreBtn.setVisibility(View.GONE);
            floatingRestoreBtn.setOnClickListener(v -> toggleNativeBars());
            nativeDualContainer.addView(floatingRestoreBtn);

            rootView.addView(nativeDualContainer, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
            ));

            // Load initial URLs
            nativeWebView1.loadUrl(urlPane1);
            nativeWebView2.loadUrl(urlPane2);
            logMessage("Native Dual WebViews with individual URL bars mounted successfully!");
        });
    }

    private void switchToLayoutMode(int mode) {
        currentLayoutMode = mode;
        if (j1Container == null || j2Container == null || dividerView == null) return;

        if (mode == 0) { // 50:50 Vertical Split
            j1Container.setVisibility(View.VISIBLE);
            j2Container.setVisibility(View.VISIBLE);
            dividerView.setVisibility(View.VISIBLE);
            LinearLayout.LayoutParams p1 = (LinearLayout.LayoutParams) j1Container.getLayoutParams();
            p1.weight = 1.0f;
            j1Container.setLayoutParams(p1);
            LinearLayout.LayoutParams p2 = (LinearLayout.LayoutParams) j2Container.getLayoutParams();
            p2.weight = 1.0f;
            j2Container.setLayoutParams(p2);
        } else if (mode == 1) { // J1 Maximized
            j1Container.setVisibility(View.VISIBLE);
            j2Container.setVisibility(View.GONE);
            dividerView.setVisibility(View.GONE);
            LinearLayout.LayoutParams p1 = (LinearLayout.LayoutParams) j1Container.getLayoutParams();
            p1.weight = 1.0f;
            j1Container.setLayoutParams(p1);
        } else if (mode == 2) { // J2 Maximized
            j1Container.setVisibility(View.GONE);
            j2Container.setVisibility(View.VISIBLE);
            dividerView.setVisibility(View.GONE);
            LinearLayout.LayoutParams p2 = (LinearLayout.LayoutParams) j2Container.getLayoutParams();
            p2.weight = 1.0f;
            j2Container.setLayoutParams(p2);
        }
    }

    private void toggleNativeBars() {
        nativeBarsVisible = !nativeBarsVisible;
        int vis = nativeBarsVisible ? View.VISIBLE : View.GONE;
        if (nativeHeaderBar != null) nativeHeaderBar.setVisibility(vis);
        if (j1Bar != null) j1Bar.setVisibility(vis);
        if (j2Bar != null) j2Bar.setVisibility(vis);
        if (nativeFooterBar != null) nativeFooterBar.setVisibility(vis);
        if (floatingRestoreBtn != null) floatingRestoreBtn.setVisibility(nativeBarsVisible ? View.GONE : View.VISIBLE);
    }

    private void toggleNativeDualMode() {
        if (nativeDualContainer == null) return;
        boolean currentlyVisible = nativeDualContainer.getVisibility() == View.VISIBLE;
        nativeDualContainer.setVisibility(currentlyVisible ? View.GONE : View.VISIBLE);
        logMessage("Toggled Native Dual Mode to: " + (currentlyVisible ? "HIDDEN (React Active)" : "VISIBLE"));
    }

    private void promptChangeUrl() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Navegar para URL");

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(dpToPx(16), dpToPx(8), dpToPx(16), dpToPx(8));

        TextView label = new TextView(this);
        label.setText("Selecione a tela e digite o endereço:");
        label.setTextColor(Color.parseColor("#9CA3AF"));
        layout.addView(label);

        EditText input = new EditText(this);
        input.setText(currentLayoutMode == 2 ? urlPane2 : urlPane1);
        layout.addView(input);

        builder.setView(layout);
        builder.setPositiveButton("Carregar no J1", (dialog, which) -> {
            navigateToUrl(1, input.getText().toString());
        });
        builder.setNegativeButton("Carregar no J2", (dialog, which) -> {
            navigateToUrl(2, input.getText().toString());
        });
        builder.setNeutralButton("Cancelar", null);
        builder.show();
    }

    private static class FourNavChildWebViewClient extends WebViewClient {
        private final java.lang.ref.WeakReference<MainActivity> activityRef;

        public FourNavChildWebViewClient(MainActivity activity) {
            this.activityRef = new java.lang.ref.WeakReference<>(activity);
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            MainActivity act = activityRef.get();
            if (act != null) {
                act.injectPortraitEmulation(view);
                act.updateUrlInputFromPage(view, url);
            }
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            MainActivity act = activityRef.get();
            if (act != null) {
                act.injectPortraitEmulation(view);
                act.injectGhostPopupCleaner(view);
                act.updateUrlInputFromPage(view, url);
            }
        }

        @Override
        public void doUpdateVisitedHistory(WebView view, String url, boolean isReload) {
            super.doUpdateVisitedHistory(view, url, isReload);
            MainActivity act = activityRef.get();
            if (act != null) {
                act.updateUrlInputFromPage(view, url);
            }
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            if (request != null && request.getUrl() != null) {
                WebResourceResponse resp = processIntercept(request.getUrl().toString(), request.getMethod(), request.getRequestHeaders());
                if (resp != null) return resp;
            }
            return super.shouldInterceptRequest(view, request);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return false;
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
        if (nativeWebView1 != null) {
            try {
                nativeWebView1.resumeTimers();
                nativeWebView1.onResume();
                nativeWebView1.postInvalidate();
            } catch (Exception ignored) {}
        }
        if (nativeWebView2 != null) {
            try {
                nativeWebView2.resumeTimers();
                nativeWebView2.onResume();
                nativeWebView2.postInvalidate();
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
        if (nativeWebView1 != null) {
            try {
                nativeWebView1.resumeTimers();
            } catch (Exception ignored) {}
        }
        if (nativeWebView2 != null) {
            try {
                nativeWebView2.resumeTimers();
            } catch (Exception ignored) {}
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (nativeWebView1 != null) {
            try { nativeWebView1.destroy(); } catch (Exception ignored) {}
        }
        if (nativeWebView2 != null) {
            try { nativeWebView2.destroy(); } catch (Exception ignored) {}
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

                    // Inject standalone Chrome top-level window emulation at the top of <head>
                    int headIndex = html.toLowerCase(Locale.ROOT).indexOf("<head");
                    if (headIndex != -1) {
                        int closeHead = html.indexOf(">", headIndex);
                        if (closeHead != -1) {
                            html = html.substring(0, closeHead + 1) + STANDALONE_SHIM_SCRIPT + html.substring(closeHead + 1);
                        } else {
                            html = STANDALONE_SHIM_SCRIPT + html;
                        }
                    } else {
                        int htmlIndex = html.toLowerCase(Locale.ROOT).indexOf("<html");
                        if (htmlIndex != -1) {
                            int tagClose = html.indexOf(">", htmlIndex);
                            if (tagClose != -1) {
                                html = html.substring(0, tagClose + 1) + STANDALONE_SHIM_SCRIPT + html.substring(tagClose + 1);
                            } else {
                                html = STANDALONE_SHIM_SCRIPT + html;
                            }
                        } else {
                            html = STANDALONE_SHIM_SCRIPT + html;
                        }
                    }

                    // Inject ghost cleaner script before </body>
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
