package com.example.effstreak

import android.annotation.SuppressLint
import android.content.Context
import android.os.Bundle
import android.view.View
import android.webkit.*
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.viewinterop.AndroidView
import com.example.effstreak.widget.EffStreakWidget
import androidx.glance.appwidget.updateAll
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {
    private var webView: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Transparent system bars for AMOLED immersive experience
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        )

        setContent {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = Color(0xFF0B0F19)
            ) {
                EffectiveStreakAppWebView { wv ->
                    webView = wv
                }
            }
        }
    }

    override fun onBackPressed() {
        if (webView?.canGoBack() == true) {
            webView?.goBack()
        } else {
            super.onBackPressed()
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun EffectiveStreakAppWebView(onWebViewCreated: (WebView) -> Unit) {
    val targetUrl = "https://effective-streak.vercel.app"

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    allowFileAccess = true
                    allowContentAccess = true
                    loadWithOverviewMode = true
                    useWideViewPort = true
                    setSupportZoom(false)
                    cacheMode = WebSettings.LOAD_DEFAULT
                    mediaPlaybackRequiresUserGesture = false
                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                }

                // Native bridge for Home Screen Widget updates
                addJavascriptInterface(object {
                    @JavascriptInterface
                    fun updateWidgetState(streak: Int, level: Int, xp: Int, completed: Int, total: Int) {
                        val prefs = context.getSharedPreferences("effstreak_widget_data", Context.MODE_PRIVATE)
                        prefs.edit()
                            .putInt("overall_streak", streak)
                            .putInt("level", level)
                            .putInt("xp", xp)
                            .putInt("completed_tasks", completed)
                            .putInt("total_tasks", total)
                            .putString("last_sync", SimpleDateFormat("HH:mm", Locale.US).format(Date()))
                            .apply()

                        CoroutineScope(Dispatchers.Main).launch {
                            try {
                                EffStreakWidget().updateAll(context)
                            } catch (e: Exception) {
                                // Glance update
                            }
                        }
                    }
                }, "AndroidNativeBridge")

                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                        return false
                    }
                }

                webChromeClient = WebChromeClient()

                setBackgroundColor(android.graphics.Color.parseColor("#0B0F19"))
                loadUrl(targetUrl)

                onWebViewCreated(this)
            }
        }
    )
}