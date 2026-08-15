package com.effstreak.app.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
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
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import androidx.compose.ui.graphics.Color
import com.effstreak.app.data.StreakState

class EffStreakWidget : GlanceAppWidget() {

    override val sizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val state = StreakState() // In production, read from DataStore or Room

        provideContent {
            GlanceTheme {
                WidgetContent(state = state)
            }
        }
    }

    @Composable
    private fun WidgetContent(state: StreakState) {
        val cardBg = Color(0xFF131822)
        val greenColor = Color(0xFF58CC02)
        val orangeColor = Color(0xFFFF5C00)
        val textPrimary = Color(0xFFFFFFFF)
        val textSecondary = Color(0xFF94A3B8)

        Box(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(ColorProvider(cardBg))
                .padding(12.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = GlanceModifier.fillMaxSize(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Header: Flame + Streak + Efficiency
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "🔥 ${state.overallStreak}",
                        style = TextStyle(
                            color = ColorProvider(orangeColor),
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Spacer(modifier = GlanceModifier.defaultWeight())
                    Text(
                        text = "${state.completedTasks}/${state.totalTasks} DONE • ${state.efficiencyPct}%",
                        style = TextStyle(
                            color = ColorProvider(greenColor),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.height(8.dp))

                // Checklist Strip
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    state.activities.take(4).forEach { activity ->
                        val checkSymbol = if (activity.completed) "✓" else "○"
                        val symbolColor = if (activity.completed) greenColor else textSecondary

                        Column(
                            modifier = GlanceModifier.defaultWeight(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = activity.name.take(3),
                                style = TextStyle(color = ColorProvider(textSecondary), fontSize = 11.sp)
                            )
                            Text(
                                text = checkSymbol,
                                style = TextStyle(
                                    color = ColorProvider(symbolColor),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                        }
                    }
                }
            }
        }
    }
}
