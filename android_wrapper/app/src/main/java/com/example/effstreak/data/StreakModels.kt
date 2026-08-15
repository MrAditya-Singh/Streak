package com.example.effstreak.data

data class EmergencyTask(
    val id: String,
    val title: String,
    val createdAt: Long = System.currentTimeMillis(),
    val deadlineHours: Int = 24, // 24 or 48
    val deadlineAt: Long = System.currentTimeMillis() + 24 * 3600 * 1000L,
    val xpReward: Int = 5,
    val priority: Int = 5,
    val tag: String = "24H URGENT"
)

data class StreakActivity(
    val id: String,
    val name: String,
    val category: String,
    val plannedMinutes: Int,
    val completed: Boolean,
    val streak: Int,
    val url: String = "",
    val isApiTracked: Boolean = false,
    val priority: Int = 3,
    val countsTowardOverallStreak: Boolean = true,
    val xpReward: Int = 20
)

data class HunterAttributes(
    val strength: Int = 72,
    val intelligence: Int = 91,
    val discipline: Int = 84,
    val skill: Int = 78,
    val knowledge: Int = 85,
    val professional: Int = 68
)

data class StreakState(
    val overallStreak: Int = 97,
    val longestStreak: Int = 97,
    val level: Int = 18,
    val xp: Int = 1840,
    val xpTarget: Int = 2000,
    val efficiencyPct: Int = 82,
    val completedTasks: Int = 5,
    val totalTasks: Int = 15,
    val hunterRank: String = "A",
    val attributes: HunterAttributes = HunterAttributes(),
    val emergencyTasks: List<EmergencyTask> = listOf(
        EmergencyTask(
            id = "emg-assign",
            title = "Submit Project / Assignment Report",
            createdAt = System.currentTimeMillis() - 4 * 3600 * 1000L,
            deadlineHours = 24,
            deadlineAt = System.currentTimeMillis() + 20 * 3600 * 1000L,
            xpReward = 5,
            priority = 5,
            tag = "24H URGENT"
        ),
        EmergencyTask(
            id = "emg-bugfix",
            title = "Fix Critical Build & Release Server Issue",
            createdAt = System.currentTimeMillis() - 10 * 3600 * 1000L,
            deadlineHours = 48,
            deadlineAt = System.currentTimeMillis() + 38 * 3600 * 1000L,
            xpReward = 5,
            priority = 4,
            tag = "48H DIRECTIVE"
        )
    ),
    val activities: List<StreakActivity> = listOf(
        StreakActivity("leetcode", "LeetCode", "coding", 60, true, 42, "https://leetcode.com", isApiTracked = true, xpReward = 25),
        StreakActivity("codeforces", "Codeforces", "coding", 60, true, 18, "https://codeforces.com", isApiTracked = true, xpReward = 25),
        StreakActivity("gfg", "GFG", "coding", 60, true, 31, "https://geeksforgeeks.org", isApiTracked = true, xpReward = 20),
        StreakActivity("atcoder", "AtCoder", "coding", 45, false, 14, "https://atcoder.jp", isApiTracked = true, xpReward = 20),
        StreakActivity("github", "GitHub", "coding", 30, true, 26, "https://github.com", isApiTracked = true, xpReward = 20),
        StreakActivity("python", "Python", "coding", 45, false, 19, "https://python.org", isApiTracked = true, xpReward = 20),
        StreakActivity("project", "Project", "project", 60, false, 9, "https://github.com", isApiTracked = false, xpReward = 30),
        StreakActivity("gate", "GATE", "education", 120, true, 22, "", isApiTracked = false, xpReward = 35),
        StreakActivity("book", "Book", "education", 30, false, 16, "", isApiTracked = false, xpReward = 15),
        StreakActivity("german", "German B2", "education", 45, false, 11, "https://duolingo.com", isApiTracked = false, xpReward = 20),
        StreakActivity("internship", "Internship", "career", 60, false, 15, "", isApiTracked = false, xpReward = 25),
        StreakActivity("earn", "Earn", "career", 30, false, 8, "", isApiTracked = false, xpReward = 20),
        StreakActivity("gym", "Gym", "fitness", 60, false, 17, "", isApiTracked = false, xpReward = 25),
        StreakActivity("voice", "Voice", "personal", 20, false, 6, "", isApiTracked = false, xpReward = 15),
        StreakActivity("youtube", "YouTube", "personal", 30, false, 12, "https://youtube.com", isApiTracked = true, xpReward = 15)
    )
)
