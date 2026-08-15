package com.effstreak.app.data

data class StreakActivity(
    val id: String,
    val name: String,
    val category: String,
    val plannedMinutes: Int,
    val completed: Boolean,
    val streak: Int,
    val url: String = "",
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
    val activities: List<StreakActivity> = listOf(
        StreakActivity("leetcode", "LeetCode", "coding", 60, true, 42, "https://leetcode.com", true, 25),
        StreakActivity("codeforces", "Codeforces", "coding", 60, true, 18, "https://codeforces.com", true, 25),
        StreakActivity("gfg", "GFG", "coding", 60, true, 31, "https://geeksforgeeks.org", true, 20),
        StreakActivity("atcoder", "AtCoder", "coding", 45, false, 14, "https://atcoder.jp", false, 20),
        StreakActivity("github", "GitHub", "coding", 30, true, 26, "https://github.com", true, 20),
        StreakActivity("python", "Python", "coding", 45, false, 19, "https://python.org", true, 20),
        StreakActivity("project", "Project", "project", 60, false, 9, "https://github.com", true, 30),
        StreakActivity("gate", "GATE", "education", 120, true, 22, "", true, 35),
        StreakActivity("book", "Book", "education", 30, false, 16, "", false, 15),
        StreakActivity("german", "German B2", "education", 45, false, 11, "https://duolingo.com", false, 20),
        StreakActivity("internship", "Internship", "career", 60, false, 15, "", true, 25),
        StreakActivity("earn", "Earn", "career", 30, false, 8, "", false, 20),
        StreakActivity("gym", "Gym", "fitness", 60, false, 17, "", false, 25),
        StreakActivity("voice", "Voice", "personal", 20, false, 6, "", false, 15),
        StreakActivity("youtube", "YouTube", "personal", 30, false, 12, "https://youtube.com", false, 15)
    )
)
