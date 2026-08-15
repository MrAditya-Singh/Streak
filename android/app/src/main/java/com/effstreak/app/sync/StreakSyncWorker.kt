package com.effstreak.app.sync

import android.content.Context
import androidx.glance.appwidget.updateAll
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.effstreak.app.widget.EffStreakWidget

class StreakSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            // 1. Fetch remote updates from Firestore / API
            // 2. Recalculate streaks and efficiency
            // 3. Update Glance Home Screen widget
            EffStreakWidget().updateAll(applicationContext)
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
