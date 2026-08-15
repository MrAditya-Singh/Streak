package com.example.effstreak.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import androidx.compose.ui.graphics.Color
import com.example.effstreak.MainActivity
import com.example.effstreak.data.StreakState

class EffStreakWidget : GlanceAppWidget() {

    override val sizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val state = StreakState()

        provideContent {
            GlanceTheme {
                WidgetContent(state = state)
            }
        }
    }

    @Composable
    private fun WidgetContent(state: StreakState) {
        val cardBg = Color(0xFF0A0E1A)
        val greenColor = Color(0xFF10B981)
        val orangeColor = Color(0xFFFB923C)
        val purpleColor = Color(0xFFA855F7)
        val textPrimary = Color(0xFFFFFFFF)
        val textSecondary = Color(0xFF94A3B8)

        // Only platforms with API streak integration (No offline plans)
        val apiPlatformIds = setOf("leetcode", "codeforces", "gfg", "github")
        val apiActivities = state.activities.filter { it.id in apiPlatformIds }

        Box(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(ColorProvider(cardBg))
                .padding(10.dp)
                .clickable(actionStartActivity<MainActivity>()), // Double-tap/tap opens app
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = GlanceModifier.fillMaxSize(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Header Row: Flame Crystal Overall Streak + Solo Leveling Knight Badge
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "🔥 ${state.overallStreak}d",
                        style = TextStyle(
                            color = ColorProvider(orangeColor),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Spacer(modifier = GlanceModifier.defaultWeight())
                    Text(
                        text = "Lv.${state.level} Knight • API LIVE",
                        style = TextStyle(
                            color = ColorProvider(purpleColor),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.height(6.dp))

                // Connected API Platform Streaks Row (Strictly API Streaks, No Offline Plans)
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    apiActivities.forEach { activity ->
                        val platformShort = when (activity.id) {
                            "leetcode" -> "Leet"
                            "codeforces" -> "CF"
                            "gfg" -> "GFG"
                            "github" -> "GH"
                            else -> activity.name.take(3)
                        }

                        Column(
                            modifier = GlanceModifier.defaultWeight(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = platformShort,
                                style = TextStyle(
                                    color = ColorProvider(textSecondary), 
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                            Text(
                                text = "🔥${activity.streak}",
                                style = TextStyle(
                                    color = ColorProvider(textPrimary),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                            Text(
                                text = if (activity.completed) "✓" else "○",
                                style = TextStyle(
                                    color = ColorProvider(if (activity.completed) greenColor else textSecondary),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                        }
                    }
                }

                Spacer(modifier = GlanceModifier.height(2.dp))

                // Bottom Subtitle
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Double-tap to open app ↗",
                        style = TextStyle(
                            color = ColorProvider(Color(0xFF38BDF8)),
                            fontSize = 9.sp
                        )
                    )
                }
            }
        }
    }
}
