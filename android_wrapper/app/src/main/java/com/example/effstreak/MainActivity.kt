package com.example.effstreak

import android.content.Context
import android.graphics.BitmapFactory
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.*
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.effstreak.data.EmergencyTask
import com.example.effstreak.data.StreakActivity
import com.example.effstreak.data.StreakState
import kotlinx.coroutines.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// ⚡ Real-Time Network Sync Helper (Mobile -> Laptop / Cloud Render)
fun syncToggleToBackend(habitId: String, completed: Boolean) {
    CoroutineScope(Dispatchers.IO).launch {
        val hosts = listOf(
            "https://streak-backend-api.onrender.com",
            "http://127.0.0.1:5000",
            "http://localhost:5000",
            "http://192.168.0.122:5000",
            "http://10.0.2.2:5000"
        )
        for (host in hosts) {
            try {
                val url = URL("$host/api/sync/toggle")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 1500
                conn.readTimeout = 1500
                val body = "{\"userId\":\"aditya-singh\",\"habitId\":\"$habitId\",\"completed\":$completed}"
                conn.outputStream.use { it.write(body.toByteArray()) }
                if (conn.responseCode == 200) {
                    android.util.Log.d("EffStreakSync", "Successfully synced $habitId -> $completed via $host")
                    break
                }
            } catch (e: Exception) {
                // Fallback to next host
            }
        }
    }
}

fun updateWidgetCache(context: Context, state: StreakState) {
    val prefs = context.getSharedPreferences("effstreak_widget_data", Context.MODE_PRIVATE)
    prefs.edit()
        .putInt("overall_streak", state.overallStreak)
        .putInt("level", state.level)
        .putInt("xp", state.xp)
        .putInt("completed_tasks", state.activities.count { it.completed })
        .putInt("total_tasks", state.activities.size)
        .putString("last_sync", SimpleDateFormat("HH:mm", Locale.US).format(Date()))
        .apply()
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            EffStreakPureAmoledMasterScreen()
        }
    }
}

data class AnimePlatformItem(
    val name: String,
    val streak: String,
    val color: Color,
    val imagePath: String,
    val tag: String
)

@Composable
fun AssetImage(
    assetPath: String,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop
) {
    val context = LocalContext.current
    val bitmap = remember(assetPath) {
        try {
            context.assets.open(assetPath).use { inputStream ->
                BitmapFactory.decodeStream(inputStream)?.asImageBitmap()
            }
        } catch (e: Exception) {
            null
        }
    }
    if (bitmap != null) {
        Image(
            bitmap = bitmap,
            contentDescription = contentDescription,
            modifier = modifier,
            contentScale = contentScale
        )
    }
}

@Composable
fun EffStreakPureAmoledMasterScreen() {
    var isDarkMode by remember { mutableStateOf(true) }
    var state by remember { mutableStateOf(StreakState()) }
    var selectedNavIndex by remember { mutableStateOf(0) }

    val bgGradient = if (isDarkMode) {
        Brush.verticalGradient(
            listOf(Color(0xFF000000), Color(0xFF04060A), Color(0xFF000000))
        )
    } else {
        Brush.verticalGradient(
            listOf(Color(0xFFF1F5FB), Color(0xFFE8EEF8), Color(0xFFF6F8FD))
        )
    }

    val cardBg = if (isDarkMode) Color(0xFF0B101D) else Color(0xFFFFFFFF)
    val cardBorder = if (isDarkMode) Color(0xFF1E293B) else Color(0xFFE6ECF5)
    val textPrimary = if (isDarkMode) Color(0xFFFFFFFF) else Color(0xFF1E293B)
    val textSecondary = if (isDarkMode) Color(0xFF94A3B8) else Color(0xFF64748B)
    val textMuted = if (isDarkMode) Color(0xFF64748B) else Color(0xFF94A3B8)
    val accentPurple = if (isDarkMode) Color(0xFFA78BFA) else Color(0xFF6366F1)
    val streakOrange = Color(0xFFFF5C00)
    val successGreen = if (isDarkMode) Color(0xFF34D399) else Color(0xFF10B981)

    val infiniteTransition = rememberInfiniteTransition(label = "IdleAnimation")
    val heroFloatOffset by infiniteTransition.animateFloat(
        initialValue = -4f,
        targetValue = 4f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "HeroFloat"
    )

    var showAddActivityDialog by remember { mutableStateOf(false) }
    var showAddEmergencyDialog by remember { mutableStateOf(false) }

    val onAddEmergencyTask: (EmergencyTask) -> Unit = { newEmg ->
        state = state.copy(emergencyTasks = listOf(newEmg) + state.emergencyTasks)
    }

    val onCompleteEmergencyTask: (String) -> Unit = { id ->
        state = state.copy(
            emergencyTasks = state.emergencyTasks.filter { it.id != id },
            xp = minOf(state.xpTarget, state.xp + 5)
        )
    }

    val onDeleteEmergencyTask: (String) -> Unit = { id ->
        state = state.copy(emergencyTasks = state.emergencyTasks.filter { it.id != id })
    }

    val onFreezeStreak: () -> Unit = {
        if (state.xp >= 500) {
            state = state.copy(xp = state.xp - 500)
        }
    }

    val context = LocalContext.current
    LaunchedEffect(state) {
        updateWidgetCache(context, state)
    }

    // ⚡ Real-Time Poller for Instant Laptop Clicks
    LaunchedEffect(Unit) {
        withContext(Dispatchers.IO) {
            while (isActive) {
                try {
                    for (host in listOf("https://streak-backend-api.onrender.com", "http://127.0.0.1:5000", "http://localhost:5000", "http://192.168.0.122:5000", "http://10.0.2.2:5000")) {
                        try {
                            val url = URL("$host/api/sync/state?userId=aditya-singh")
                            val conn = url.openConnection() as HttpURLConnection
                            conn.requestMethod = "GET"
                            conn.connectTimeout = 800
                            conn.readTimeout = 800
                            if (conn.responseCode == 200) {
                                val resp = conn.inputStream.bufferedReader().readText()
                                val json = JSONObject(resp)
                                val sObj = json.optJSONObject("state")
                                val mObj = sObj?.optJSONObject("matrix")
                                if (mObj != null) {
                                    withContext(Dispatchers.Main) {
                                        val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
                                        var anyChanged = false
                                        val nextActs = state.activities.map { act ->
                                            val habitMatrix = mObj.optJSONObject(act.id)
                                            val isDoneToday = if (habitMatrix?.has(todayStr) == true) habitMatrix.optBoolean(todayStr) else null
                                            if (isDoneToday != null && isDoneToday != act.completed) {
                                                anyChanged = true
                                                act.copy(
                                                    completed = isDoneToday,
                                                    streak = if (isDoneToday) act.streak + 1 else maxOf(0, act.streak - 1)
                                                )
                                            } else act
                                        }
                                        if (anyChanged) {
                                            state = state.copy(activities = nextActs)
                                        }
                                    }
                                }
                                break
                            }
                        } catch (e: Exception) {
                            // Try next host
                        }
                    }
                } catch (e: Exception) {
                    // Retry
                }
                delay(1000)
            }
        }
    }

    val onToggleTask: (String) -> Unit = { id ->
        var nextCompleted = false
        val updatedList = state.activities.map { act ->
            if (act.id == id) {
                val next = !act.completed
                nextCompleted = next
                act.copy(
                    completed = next,
                    streak = if (next) act.streak + 1 else maxOf(0, act.streak - 1)
                )
            } else act
        }
        val doneCount = updatedList.count { it.completed }
        val totalPlanned = updatedList.sumOf { it.plannedMinutes }
        val doneMinutes = updatedList.filter { it.completed }.sumOf { it.plannedMinutes }
        val newEff = if (totalPlanned > 0) (doneMinutes * 100 / totalPlanned) else 0

        state = state.copy(
            activities = updatedList,
            completedTasks = doneCount,
            totalTasks = updatedList.size,
            efficiencyPct = newEff,
            xp = minOf(state.xpTarget, state.xp + if (doneCount > state.completedTasks) 35 else 0)
        )

        // ⚡ Instantly broadcast mobile tap to Laptop!
        syncToggleToBackend(id, nextCompleted)
    }

    val onAddTask: (StreakActivity) -> Unit = { newAct ->
        val updatedList = listOf(newAct) + state.activities
        val doneCount = updatedList.count { it.completed }
        state = state.copy(
            activities = updatedList,
            totalTasks = updatedList.size,
            completedTasks = doneCount
        )
    }

    val onDeleteTask: (String) -> Unit = { id ->
        val updatedList = state.activities.filter { it.id != id }
        val doneCount = updatedList.count { it.completed }
        state = state.copy(
            activities = updatedList,
            totalTasks = updatedList.size,
            completedTasks = doneCount
        )
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = if (isDarkMode) Color(0xFF000000) else Color(0xFFF1F5FB)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(bgGradient)
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                contentPadding = PaddingValues(top = 52.dp, bottom = 100.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // 1. Top Header Bar
                item {
                    MasterTopHeaderBar(
                        isDarkMode = isDarkMode,
                        textPrimary = textPrimary,
                        textSecondary = textSecondary,
                        cardBg = cardBg,
                        cardBorder = cardBorder,
                        onToggleTheme = { isDarkMode = !isDarkMode }
                    )
                }

                // 2. Hero Artwork Banner
                item {
                    MasterHeroArtworkBanner(
                        isDarkMode = isDarkMode,
                        floatOffset = heroFloatOffset
                    )
                }

                // 3. Emergency Work Planner
                item {
                    MasterEmergencyWorkPlanner(
                        state = state,
                        isDarkMode = isDarkMode,
                        cardBg = cardBg,
                        cardBorder = cardBorder,
                        textPrimary = textPrimary,
                        textSecondary = textSecondary,
                        onAddClick = { showAddEmergencyDialog = true },
                        onCompleteTask = onCompleteEmergencyTask,
                        onDeleteTask = onDeleteEmergencyTask
                    )
                }

                // 4. Plan Interactive Checklist
                item {
                    MasterTodayPlanChecklist(
                        state = state,
                        isDarkMode = isDarkMode,
                        cardBg = cardBg,
                        cardBorder = cardBorder,
                        textPrimary = textPrimary,
                        textSecondary = textSecondary,
                        accentPurple = accentPurple,
                        streakOrange = streakOrange,
                        onToggleTask = onToggleTask,
                        onAddClick = { showAddActivityDialog = true },
                        onDeleteTask = onDeleteTask
                    )
                }

                // 5. Level & Streak Ribbon
                item {
                    MasterLevelAndStreakRibbon(
                        state = state,
                        isDarkMode = isDarkMode,
                        cardBg = cardBg,
                        cardBorder = cardBorder,
                        textPrimary = textPrimary,
                        accentPurple = accentPurple,
                        streakOrange = streakOrange,
                        onFreezeStreak = onFreezeStreak
                    )
                }

                // 6. Today's Activity & Efficiency Gauge
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(modifier = Modifier.weight(1f)) {
                            MasterTodayActivityTimeline(
                                isDarkMode = isDarkMode,
                                cardBg = cardBg,
                                cardBorder = cardBorder,
                                textPrimary = textPrimary,
                                textMuted = textMuted,
                                accentPurple = accentPurple,
                                successGreen = successGreen
                            )
                        }
                        Box(modifier = Modifier.weight(1f)) {
                            MasterEfficiencyGauge(
                                state = state,
                                isDarkMode = isDarkMode,
                                cardBg = cardBg,
                                cardBorder = cardBorder,
                                textPrimary = textPrimary,
                                textSecondary = textSecondary,
                                accentPurple = accentPurple,
                                successGreen = successGreen
                            )
                        }
                    }
                }

                // 7. 6 Platform Cards
                item {
                    MasterPlatformCardsGrid(
                        isDarkMode = isDarkMode,
                        cardBg = cardBg,
                        cardBorder = cardBorder,
                        textPrimary = textPrimary,
                        textMuted = textMuted
                    )
                }

                // 8. Quick Stats Row
                item {
                    MasterQuickStats(
                        state = state,
                        isDarkMode = isDarkMode,
                        cardBg = cardBg,
                        cardBorder = cardBorder,
                        textPrimary = textPrimary,
                        textSecondary = textSecondary,
                        streakOrange = streakOrange,
                        successGreen = successGreen
                    )
                }

                // 9. Heatmap & Motivation Row
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(modifier = Modifier.weight(1f)) {
                            MasterActivityHeatmap(
                                isDarkMode = isDarkMode,
                                cardBg = cardBg,
                                cardBorder = cardBorder,
                                textPrimary = textPrimary,
                                textSecondary = textSecondary
                            )
                        }
                        Box(modifier = Modifier.weight(1f)) {
                            MasterMotivationCard(
                                isDarkMode = isDarkMode,
                                cardBg = cardBg,
                                cardBorder = cardBorder,
                                textPrimary = textPrimary
                            )
                        }
                    }
                }
            }

            // Floating Bottom Navigation Bar
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                MasterBottomNavBar(
                    isDarkMode = isDarkMode,
                    cardBorder = cardBorder,
                    textSecondary = textSecondary,
                    accentPurple = accentPurple,
                    selectedIndex = selectedNavIndex,
                    onSelect = { selectedNavIndex = it }
                )
            }

            if (showAddActivityDialog) {
                MasterAddActivityDialog(
                    isDarkMode = isDarkMode,
                    cardBg = cardBg,
                    cardBorder = cardBorder,
                    textPrimary = textPrimary,
                    textSecondary = textSecondary,
                    accentPurple = accentPurple,
                    onDismiss = { showAddActivityDialog = false },
                    onAdd = { newAct ->
                        onAddTask(newAct)
                        showAddActivityDialog = false
                    }
                )
            }

            if (showAddEmergencyDialog) {
                MasterAddEmergencyTaskDialog(
                    isDarkMode = isDarkMode,
                    cardBg = cardBg,
                    cardBorder = cardBorder,
                    textPrimary = textPrimary,
                    textSecondary = textSecondary,
                    onDismiss = { showAddEmergencyDialog = false },
                    onAdd = { newEmg ->
                        onAddEmergencyTask(newEmg)
                        showAddEmergencyDialog = false
                    }
                )
            }
        }
    }
}

// --- 1. Top Header Bar ---
@Composable
fun MasterTopHeaderBar(
    isDarkMode: Boolean,
    textPrimary: Color,
    textSecondary: Color,
    cardBg: Color,
    cardBorder: Color,
    onToggleTheme: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            modifier = Modifier.weight(1f),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .border(2.5.dp, if (isDarkMode) Color(0xFF818CF8) else Color(0xFFCBD5E1), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                AssetImage(
                    assetPath = "images/char_hero.jpg",
                    contentDescription = "Avatar",
                    modifier = Modifier.fillMaxSize()
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = if (isDarkMode) "Good evening, Eren!" else "Good morning, Eren!",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        color = textPrimary,
                        maxLines = 1
                    )
                    Text(text = if (isDarkMode) "🌙" else "👋", fontSize = 14.sp)
                }
                Text(
                    text = "Discipline today, success tomorrow.",
                    fontSize = 10.5.sp,
                    color = textSecondary,
                    maxLines = 1
                )
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(
                shape = CircleShape,
                color = cardBg,
                border = BorderStroke(1.dp, cardBorder),
                shadowElevation = if (isDarkMode) 6.dp else 2.dp,
                modifier = Modifier
                    .size(38.dp)
                    .clickable { onToggleTheme() }
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(text = if (isDarkMode) "☀️" else "🌙", fontSize = 15.sp)
                }
            }

            Surface(
                shape = CircleShape,
                color = cardBg,
                border = BorderStroke(1.dp, cardBorder),
                shadowElevation = if (isDarkMode) 6.dp else 2.dp,
                modifier = Modifier.size(38.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(text = "🔔", fontSize = 15.sp)
                }
            }

            Surface(
                shape = CircleShape,
                color = cardBg,
                border = BorderStroke(1.dp, cardBorder),
                shadowElevation = if (isDarkMode) 6.dp else 2.dp,
                modifier = Modifier.size(38.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(text = "⚙️", fontSize = 15.sp)
                }
            }
        }
    }
}

// --- 2. Hero Banner ---
@Composable
fun MasterHeroArtworkBanner(isDarkMode: Boolean, floatOffset: Float) {
    val bannerGradient = if (isDarkMode) {
        Brush.horizontalGradient(
            listOf(Color(0xFF130E2B), Color(0xFF0F172A), Color(0xFF0A0F1D))
        )
    } else {
        Brush.horizontalGradient(
            listOf(Color(0xFFD4E2F7), Color(0xFFE6EEFA), Color(0xFFF3F7FD))
        )
    }

    Card(
        shape = RoundedCornerShape(26.dp),
        colors = CardDefaults.cardColors(containerColor = if (isDarkMode) Color(0xFF0C101C) else Color(0xFFDDE7F6)),
        border = BorderStroke(1.dp, if (isDarkMode) Color(0x33818CF8) else Color(0xFFFFFFFF)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(bannerGradient)
                .padding(horizontal = 18.dp, vertical = 16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    modifier = Modifier.weight(1.2f),
                    verticalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    Text(
                        text = if (isDarkMode) "Shadow Monarch" else "Small steps",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isDarkMode) Color(0xFFA5B4FC) else Color(0xFF3B4F74)
                    )
                    Text(
                        text = "Big future. ✦",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        color = if (isDarkMode) Color(0xFFC084FC) else Color(0xFF4F46E5)
                    )
                    Text(
                        text = "Keep going, you're\ndoing amazing! 💪",
                        fontSize = 12.sp,
                        color = if (isDarkMode) Color(0xFF94A3B8) else Color(0xFF475569),
                        lineHeight = 16.sp
                    )
                }

                Box(
                    modifier = Modifier
                        .size(105.dp)
                        .offset(y = floatOffset.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(95.dp)
                            .clip(CircleShape)
                            .border(3.dp, if (isDarkMode) Color(0xFF818CF8) else Color(0xFFFFFFFF), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        AssetImage(
                            assetPath = "images/char_hero.jpg",
                            contentDescription = "Hero Anime Boy",
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                }
            }
        }
    }
}

// --- 3. Level & Streak Ribbon ---
@Composable
fun MasterLevelAndStreakRibbon(
    state: StreakState,
    isDarkMode: Boolean,
    cardBg: Color,
    cardBorder: Color,
    textPrimary: Color,
    accentPurple: Color,
    streakOrange: Color,
    onFreezeStreak: () -> Unit
) {
    val isAllDone = state.totalTasks > 0 && state.completedTasks == state.totalTasks

    Surface(
        shape = RoundedCornerShape(22.dp),
        color = cardBg,
        border = BorderStroke(1.dp, cardBorder),
        shadowElevation = if (isDarkMode) 6.dp else 2.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(if (isDarkMode) Color(0xFF1E1B4B) else Color(0xFFEEF2FF)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "🛡️", fontSize = 18.sp)
                }
                Column {
                    Text(text = "Level ${state.level}", fontSize = 12.sp, fontWeight = FontWeight.Black, color = textPrimary)
                    Text(text = "1 Month = Level 1", fontSize = 9.sp, color = accentPurple, fontWeight = FontWeight.Bold)
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(text = "🔥", fontSize = 20.sp)
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(text = "${state.overallStreak}", fontSize = 14.sp, fontWeight = FontWeight.Black, color = textPrimary)
                        Text(text = "Plan Streak", fontSize = 9.sp, color = streakOrange, fontWeight = FontWeight.Bold)
                    }
                    Text(
                        text = if (isAllDone) "✓ All done" else "${state.completedTasks}/${state.totalTasks} done",
                        fontSize = 8.sp,
                        color = if (isAllDone) Color(0xFF10B981) else textPrimary.copy(alpha = 0.6f),
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(text = "${state.xp} / ${state.xpTarget} XP", fontSize = 11.sp, fontWeight = FontWeight.Black, color = accentPurple)
                Box(
                    modifier = Modifier
                        .width(75.dp)
                        .height(5.dp)
                        .clip(CircleShape)
                        .background(if (isDarkMode) Color(0xFF1E293B) else Color(0xFFE2E8F0))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth((state.xp.toFloat() / state.xpTarget).coerceIn(0f, 1f))
                            .clip(CircleShape)
                            .background(Brush.horizontalGradient(listOf(Color(0xFF818CF8), Color(0xFFC084FC))))
                    )
                }
            }
        }
    }
}

// --- 4. Emergency Work Planner ---
@Composable
fun MasterEmergencyWorkPlanner(
    state: StreakState,
    isDarkMode: Boolean,
    cardBg: Color,
    cardBorder: Color,
    textPrimary: Color,
    textSecondary: Color,
    onAddClick: () -> Unit,
    onCompleteTask: (String) -> Unit,
    onDeleteTask: (String) -> Unit
) {
    Surface(
        shape = RoundedCornerShape(22.dp),
        color = cardBg,
        border = BorderStroke(1.dp, cardBorder),
        shadowElevation = if (isDarkMode) 6.dp else 2.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(text = "🚨", fontSize = 16.sp)
                    Text(text = "EMERGENCY DIRECTIVES", fontSize = 12.sp, fontWeight = FontWeight.Black, color = textPrimary)
                }
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFFEF4444).copy(alpha = 0.15f),
                    modifier = Modifier.clickable { onAddClick() }
                ) {
                    Text(text = "+ Add", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEF4444), modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                }
            }

            if (state.emergencyTasks.isEmpty()) {
                Text(text = "No active emergency tasks.", fontSize = 11.sp, color = textSecondary)
            } else {
                state.emergencyTasks.forEach { task ->
                    Row(
                        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(if (isDarkMode) Color(0xFF1E293B).copy(alpha = 0.4f) else Color(0xFFF1F5F9)).padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = task.title, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = textPrimary)
                            Text(text = "${task.deadlineHours}h left • +5 XP", fontSize = 10.sp, color = Color(0xFFEF4444))
                        }
                        Button(
                            onClick = { onCompleteTask(task.id) },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                            modifier = Modifier.height(28.dp)
                        ) {
                            Text("Done", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// --- 5. Today Plan Interactive Checklist ---
@Composable
fun MasterTodayPlanChecklist(
    state: StreakState,
    isDarkMode: Boolean,
    cardBg: Color,
    cardBorder: Color,
    textPrimary: Color,
    textSecondary: Color,
    accentPurple: Color,
    streakOrange: Color,
    onToggleTask: (String) -> Unit,
    onAddClick: () -> Unit,
    onDeleteTask: (String) -> Unit
) {
    Surface(
        shape = RoundedCornerShape(22.dp),
        color = cardBg,
        border = BorderStroke(1.dp, cardBorder),
        shadowElevation = if (isDarkMode) 6.dp else 2.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(text = "TODAY'S HABITS", fontSize = 12.sp, fontWeight = FontWeight.Black, color = textPrimary)
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = accentPurple.copy(alpha = 0.15f),
                    modifier = Modifier.clickable { onAddClick() }
                ) {
                    Text(text = "+ New Habit", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = accentPurple, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                }
            }

            state.activities.forEach { act ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (isDarkMode) Color(0xFF1E293B).copy(alpha = 0.3f) else Color(0xFFF8FAFC))
                        .clickable { onToggleTask(act.id) }
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Box(
                            modifier = Modifier
                                .size(22.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (act.completed) Color(0xFF10B981) else Color.Transparent)
                                .border(1.5.dp, if (act.completed) Color(0xFF10B981) else Color(0xFF94A3B8), RoundedCornerShape(6.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (act.completed) {
                                Text("✓", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Black)
                            }
                        }
                        Text(text = act.name, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = textPrimary)
                    }
                    Text(text = "🔥 ${act.streak}d", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = streakOrange)
                }
            }
        }
    }
}

// --- 6. Platform Cards Grid ---
@Composable
fun MasterPlatformCardsGrid(
    isDarkMode: Boolean,
    cardBg: Color,
    cardBorder: Color,
    textPrimary: Color,
    textMuted: Color
) {
    val cards = listOf(
        AnimePlatformItem("LeetCode", "🔥 42", Color(0xFFFF5C00), "images/char_leetcode.jpg", "LC"),
        AnimePlatformItem("Codeforces", "🔥 18", Color(0xFF38BDF8), "images/char_codeforces.jpg", "CF"),
        AnimePlatformItem("GFG", "🔥 31", Color(0xFF34D399), "images/char_gfg.jpg", "GF"),
        AnimePlatformItem("GitHub", "🔥 26", Color(0xFFE2E8F0), "images/char_github.jpg", "GH"),
        AnimePlatformItem("YouTube", "🔥 12", Color(0xFFFF4B4B), "images/char_youtube.jpg", "YT"),
        AnimePlatformItem("Projects", "🔥 9", Color(0xFFFBBF24), "images/char_hero.jpg", "PR")
    )

    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            cards.take(3).forEach { item ->
                Box(modifier = Modifier.weight(1f)) {
                    MasterPlatformCardItem(item, isDarkMode, cardBg, cardBorder, textPrimary, textMuted)
                }
            }
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            cards.drop(3).take(3).forEach { item ->
                Box(modifier = Modifier.weight(1f)) {
                    MasterPlatformCardItem(item, isDarkMode, cardBg, cardBorder, textPrimary, textMuted)
                }
            }
        }
    }
}

@Composable
fun MasterPlatformCardItem(
    item: AnimePlatformItem,
    isDarkMode: Boolean,
    cardBg: Color,
    cardBorder: Color,
    textPrimary: Color,
    textMuted: Color
) {
    Surface(
        shape = RoundedCornerShape(18.dp),
        color = cardBg,
        border = BorderStroke(1.dp, cardBorder),
        shadowElevation = if (isDarkMode) 6.dp else 2.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .border(2.dp, item.color.copy(alpha = if (isDarkMode) 0.8f else 0.4f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                AssetImage(assetPath = item.imagePath, contentDescription = item.name, modifier = Modifier.fillMaxSize())
            }
            Text(text = item.name, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = textPrimary)
            Text(text = item.streak, fontSize = 10.sp, fontWeight = FontWeight.Black, color = item.color)
        }
    }
}

// --- 7. Today Activity Timeline ---
@Composable
fun MasterTodayActivityTimeline(
    isDarkMode: Boolean,
    cardBg: Color,
    cardBorder: Color,
    textPrimary: Color,
    textMuted: Color,
    accentPurple: Color,
    successGreen: Color
) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = cardBg,
        border = BorderStroke(1.dp, cardBorder),
        shadowElevation = if (isDarkMode) 6.dp else 2.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(text = "TODAY'S ACTIVITY", fontSize = 11.sp, fontWeight = FontWeight.Black, color = textPrimary)
            Text(text = "✓ 4 actions completed\n⚡ Last: GitHub push at 22:40", fontSize = 10.sp, color = textMuted, lineHeight = 14.sp)
        }
    }
}

// --- 8. Efficiency Gauge ---
@Composable
fun MasterEfficiencyGauge(
    state: StreakState,
    isDarkMode: Boolean,
    cardBg: Color,
    cardBorder: Color,
    textPrimary: Color,
    textSecondary: Color,
    accentPurple: Color,
    successGreen: Color
) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = cardBg,
        border = BorderStroke(1.dp, cardBorder),
        shadowElevation = if (isDarkMode) 6.dp else 2.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(text = "EFFICIENCY", fontSize = 11.sp, fontWeight = FontWeight.Black, color = textPrimary)
            Text(text = "${state.efficiencyPct}%", fontSize = 24.sp, fontWeight = FontWeight.Black, color = successGreen)
            Text(text = "Target: ≥85%", fontSize = 9.sp, color = textSecondary)
        }
    }
}

// --- 9. Quick Stats Row ---
@Composable
fun MasterQuickStats(
    state: StreakState,
    isDarkMode: Boolean,
    cardBg: Color,
    cardBorder: Color,
    textPrimary: Color,
    textSecondary: Color,
    streakOrange: Color,
    successGreen: Color
) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Surface(shape = RoundedCornerShape(16.dp), color = cardBg, border = BorderStroke(1.dp, cardBorder), modifier = Modifier.weight(1f)) {
            Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = "COMPLETION", fontSize = 9.sp, color = textSecondary, fontWeight = FontWeight.Bold)
                Text(text = "${state.completedTasks}/${state.totalTasks}", fontSize = 16.sp, fontWeight = FontWeight.Black, color = successGreen)
            }
        }
        Surface(shape = RoundedCornerShape(16.dp), color = cardBg, border = BorderStroke(1.dp, cardBorder), modifier = Modifier.weight(1f)) {
            Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = "MONTH STREAK", fontSize = 9.sp, color = textSecondary, fontWeight = FontWeight.Bold)
                Text(text = "${state.overallStreak}d", fontSize = 16.sp, fontWeight = FontWeight.Black, color = streakOrange)
            }
        }
    }
}

// --- 10. Heatmap & Motivation ---
@Composable
fun MasterActivityHeatmap(isDarkMode: Boolean, cardBg: Color, cardBorder: Color, textPrimary: Color, textSecondary: Color) {
    Surface(shape = RoundedCornerShape(20.dp), color = cardBg, border = BorderStroke(1.dp, cardBorder), modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(text = "ACTIVITY HEATMAP", fontSize = 10.sp, fontWeight = FontWeight.Black, color = textPrimary)
            Text(text = "90-Day Matrix Active", fontSize = 10.sp, color = textSecondary)
        }
    }
}

@Composable
fun MasterMotivationCard(isDarkMode: Boolean, cardBg: Color, cardBorder: Color, textPrimary: Color) {
    Surface(shape = RoundedCornerShape(20.dp), color = cardBg, border = BorderStroke(1.dp, cardBorder), modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(text = "HUNTER MOTIVATION", fontSize = 10.sp, fontWeight = FontWeight.Black, color = textPrimary)
            Text(text = "Level up every day. 🔥", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFFA78BFA))
        }
    }
}

// --- 11. Bottom Nav Bar ---
@Composable
fun MasterBottomNavBar(
    isDarkMode: Boolean,
    cardBorder: Color,
    textSecondary: Color,
    accentPurple: Color,
    selectedIndex: Int,
    onSelect: (Int) -> Unit
) {
    Surface(
        shape = RoundedCornerShape(24.dp),
        color = if (isDarkMode) Color(0xFF0F172A).copy(alpha = 0.95f) else Color(0xFFFFFFFF).copy(alpha = 0.95f),
        border = BorderStroke(1.dp, cardBorder),
        shadowElevation = 8.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            listOf("🔥 Dashboard", "📊 Matrix", "⚡ Sync", "👤 Profile").forEachIndexed { index, label ->
                val isSel = index == selectedIndex
                Text(
                    text = label,
                    fontSize = 11.sp,
                    fontWeight = if (isSel) FontWeight.Black else FontWeight.Medium,
                    color = if (isSel) accentPurple else textSecondary,
                    modifier = Modifier.clickable { onSelect(index) }.padding(6.dp)
                )
            }
        }
    }
}

// --- 12. Dialogs ---
@Composable
fun MasterAddActivityDialog(
    isDarkMode: Boolean,
    cardBg: Color,
    cardBorder: Color,
    textPrimary: Color,
    textSecondary: Color,
    accentPurple: Color,
    onDismiss: () -> Unit,
    onAdd: (StreakActivity) -> Unit
) {
    var name by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(text = "Add Daily Habit", fontWeight = FontWeight.Black) },
        text = {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Habit Name") },
                singleLine = true
            )
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank()) {
                        onAdd(
                            StreakActivity(
                                id = "act_${System.currentTimeMillis()}",
                                name = name.trim(),
                                category = "Core",
                                plannedMinutes = 30,
                                streak = 1,
                                completed = false
                            )
                        )
                    }
                }
            ) {
                Text("Add")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@Composable
fun MasterAddEmergencyTaskDialog(
    isDarkMode: Boolean,
    cardBg: Color,
    cardBorder: Color,
    textPrimary: Color,
    textSecondary: Color,
    onDismiss: () -> Unit,
    onAdd: (EmergencyTask) -> Unit
) {
    var name by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(text = "Add Emergency Task", fontWeight = FontWeight.Black) },
        text = {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Directive Name (24-48h)") },
                singleLine = true
            )
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank()) {
                        onAdd(
                            EmergencyTask(
                                id = "emg_${System.currentTimeMillis()}",
                                title = name.trim(),
                                deadlineHours = 24
                            )
                        )
                    }
                }
            ) {
                Text("Add Directives")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}