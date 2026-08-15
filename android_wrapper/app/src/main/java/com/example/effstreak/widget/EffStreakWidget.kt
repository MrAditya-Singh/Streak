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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class EffStreakWidget : GlanceAppWidget() {

    override val sizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val prefs = context.getSharedPreferences("effstreak_widget_data", Context.MODE_PRIVATE)
        val overallStreak = prefs.getInt("overall_streak", 98)
        val level = prefs.getInt("level", 18)
        val xp = prefs.getInt("xp", 1840)
        val completedTasks = prefs.getInt("completed_tasks", 12)
        val totalTasks = prefs.getInt("total_tasks", 15)
        val lastSync = prefs.getString("last_sync", SimpleDateFormat("HH:mm", Locale.US).format(Date())) ?: "Live"

        val progressPct = if (totalTasks > 0) Math.round((completedTasks.toFloat() / totalTasks) * 100) else 0

        provideContent {
            GlanceTheme {
                WidgetGlanceContent(
                    streak = overallStreak,
                    level = level,
                    xp = xp,
                    completed = completedTasks,
                    total = totalTasks,
                    progressPct = progressPct,
                    lastSync = lastSync
                )
            }
        }
    }

    @Composable
    private fun WidgetGlanceContent(
        streak: Int,
        level: Int,
        xp: Int,
        completed: Int,
        total: Int,
        progressPct: Int,
        lastSync: String
    ) {
        val cardBg = Color(0xFF0F172A)
        val streakOrange = Color(0xFFFF5C00)
        val progressGreen = Color(0xFF10B981)
        val purpleAccent = Color(0xFFA855F7)
        val textMuted = Color(0xFF94A3B8)
        val textWhite = Color(0xFFFFFFFF)

        val isGoalDone = completed >= total && total > 0

        Box(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(ColorProvider(cardBg))
                .padding(12.dp)
                .clickable(actionStartActivity<MainActivity>()),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = GlanceModifier.fillMaxSize(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Top Row: Streak Banner
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "🔥 $streak Day Streak",
                        style = TextStyle(
                            color = ColorProvider(streakOrange),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.height(4.dp))

                // Stats Row: Level & Today's Progress Percentage
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Lv.$level Knight",
                        style = TextStyle(
                            color = ColorProvider(purpleAccent),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Spacer(modifier = GlanceModifier.defaultWeight())
                    Text(
                        text = "$progressPct% Today",
                        style = TextStyle(
                            color = ColorProvider(progressGreen),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.height(4.dp))

                // Visual Progress Bar & Habits Count
                val totalBars = 12
                val filledBars = if (total > 0) Math.min(totalBars, (completed * totalBars) / total) else 0
                val barStr = "█".repeat(filledBars) + "░".repeat(totalBars - filledBars)

                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = barStr,
                        style = TextStyle(
                            color = ColorProvider(progressGreen),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Spacer(modifier = GlanceModifier.defaultWeight())
                    Text(
                        text = "$completed/$total Habits",
                        style = TextStyle(
                            color = ColorProvider(textWhite),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.height(6.dp))

                // Bottom Status: Today's Goal Completion & Last Sync
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (isGoalDone) "✓ Today's Goal Complete!" else "⚡ Today's Goal Active",
                        style = TextStyle(
                            color = ColorProvider(if (isGoalDone) progressGreen else textMuted),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Spacer(modifier = GlanceModifier.defaultWeight())
                    Text(
                        text = "🔄 $lastSync",
                        style = TextStyle(
                            color = ColorProvider(textMuted),
                            fontSize = 9.sp
                        )
                    )
                }
            }
        }
    }
}
