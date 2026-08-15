// Backup & Export Service for JSON and CSV

import { UserProfile, ActivityItem, HistoricalDayRecord, ActivityLogEntry } from '../types';

export interface BackupData {
  version: string;
  exportedAt: string;
  user: UserProfile;
  activities: ActivityItem[];
  history: HistoricalDayRecord[];
  logs: ActivityLogEntry[];
}

/**
 * Generates and triggers download of a JSON backup file
 */
export function downloadJSONBackup(
  user: UserProfile,
  activities: ActivityItem[],
  history: HistoricalDayRecord[],
  logs: ActivityLogEntry[]
): void {
  const data: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    user,
    activities,
    history,
    logs,
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `effstreak_backup_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generates and triggers download of a CSV file for spreadsheet analysis
 */
export function downloadCSVBackup(history: HistoricalDayRecord[]): void {
  const headers = ['Date', 'AllCompleted', 'CompletedTasks', 'TotalTasks', 'PlannedMinutes', 'CompletedMinutes', 'EfficiencyPct', 'XPEarned'];
  const rows = history.map((h) => [
    h.date,
    h.allCompleted ? 'TRUE' : 'FALSE',
    h.completedCount,
    h.totalScheduled,
    h.plannedMinutes,
    h.completedMinutes,
    `${h.efficiencyPct}%`,
    h.xpEarned,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `effstreak_history_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates an uploaded JSON backup file
 */
export function parseJSONBackup(jsonString: string): BackupData {
  try {
    const data = JSON.parse(jsonString);
    if (!data.user || !data.activities) {
      throw new Error('Invalid backup structure: Missing user or activities.');
    }
    return data as BackupData;
  } catch (err) {
    throw new Error('Failed to parse backup JSON: ' + (err instanceof Error ? err.message : String(err)));
  }
}
