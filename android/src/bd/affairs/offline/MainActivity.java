package bd.affairs.offline;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.ConsoleMessage;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Collections;

public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/app/index.html";
    private WebView webView;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout container = new FrameLayout(this);
        container.setBackgroundColor(Color.rgb(247, 246, 240));
        webView = new WebView(this);
        container.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        setContentView(container);
        // Respect status/navigation bars and display cutouts, including Android's edge-to-edge layout.
        container.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override public WindowInsets onApplyWindowInsets(View view, WindowInsets insets) {
                if (Build.VERSION.SDK_INT >= 30) {
                    android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                    view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                } else {
                    view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
                }
                return insets;
            }
        });
        container.requestApplyInsets();
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setSupportZoom(false); // The SVG handles pinch and pan itself.
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setTextZoom(100);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setWebViewClient(new LocalContentClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onConsoleMessage(ConsoleMessage message) {
                if (message.messageLevel() == ConsoleMessage.MessageLevel.ERROR) Log.e("BangladeshAffairs", message.message());
                return true;
            }
        });
        webView.loadUrl(HOME);
    }

    private boolean isLocal(Uri uri) {
        return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost()) && (uri.getPort() == -1 || uri.getPort() == 443);
    }

    private final class LocalContentClient extends WebViewClient {
        @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (!isLocal(uri) || !"GET".equals(request.getMethod())) return error(403, "Blocked");
            String asset = uri.getPath();
            if (asset == null || !asset.startsWith("/app/") || asset.contains("..") || asset.contains("\\") || asset.indexOf('\0') >= 0) return error(404, "Not found");
            try {
                return new WebResourceResponse(mime(asset), isText(asset) ? "UTF-8" : null, 200, "OK", Collections.singletonMap("Cache-Control", "no-store"), getAssets().open(asset.substring(1)));
            } catch (IOException missing) { return error(404, "Not found"); }
        }
        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isLocal(uri)) return false;
            if ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) {
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                catch (ActivityNotFoundException unavailable) { Toast.makeText(MainActivity.this, "Install a browser to open reference websites.", Toast.LENGTH_SHORT).show(); }
            }
            return true;
        }
    }

    private WebResourceResponse error(int status, String reason) {
        return new WebResourceResponse("text/plain", "UTF-8", status, reason, Collections.<String, String>emptyMap(), new ByteArrayInputStream(reason.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    }
    private boolean isText(String path) { return path.endsWith(".html") || path.endsWith(".js") || path.endsWith(".css") || path.endsWith(".txt"); }
    private String mime(String path) {
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".js")) return "text/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".woff2")) return "font/woff2";
        return "text/plain";
    }

    @Override public void onBackPressed() {
        webView.evaluateJavascript("(function(){var dialog=document.querySelector('dialog[open]');if(dialog){dialog.close();return true;}var map=document.querySelector('[data-tab=map]');if(map&&map.getAttribute('aria-current')!=='page'){map.click();window.scrollTo(0,0);return true;}return false;})()", new ValueCallback<String>() {
            @Override public void onReceiveValue(String handled) { if (!"true".equals(handled)) finish(); }
        });
    }
    @Override public void onPause() { webView.onPause(); super.onPause(); }
    @Override public void onResume() { super.onResume(); if (webView != null) webView.onResume(); }
    @Override public void onDestroy() { webView.destroy(); super.onDestroy(); }
}
