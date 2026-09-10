import { ActivityItem, YearlyMatrixState, MonthlyHabitProgress, YearlyHabitSummary } from '../types';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_DAYS_IN_YEAR = (year: number): number[] => {
  return [
    31, // Jan
    (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28, // Feb
    31, // Mar
    30, // Apr
    31, // May
    30, // Jun
    31, // Jul
    31, // Aug
    30, // Sep
    31, // Oct
    30, // Nov
    31, // Dec
  ];
};

/**
 * Calculates month-wise progress metrics for all habits in a given month
 */
export function getMonthlyHabitProgress(
  activities: ActivityItem[],
  monthMatrix: Record<string, boolean[]>,
  monthName: string,
  year: number
): MonthlyHabitProgress[] {
  const monthIdx = MONTH_NAMES.indexOf(monthName);
  const totalDays = monthIdx !== -1 ? MONTH_DAYS_IN_YEAR(year)[monthIdx] : 30;

  return activities.map((habit) => {
    const daysArr = Array.isArray(monthMatrix[habit.id]) ? monthMatrix[habit.id] : [];
    const completedDays = daysArr.slice(0, totalDays).filter(Boolean).length;
    const completionRatePct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    return {
      habitId: habit.id,
      habitName: habit.name,
      monthName,
      year,
      completedDays,
      totalDays,
      completionRatePct,
    };
  });
}

/**
 * Calculates 1-year (12-month) progress summary for all habits
 */
export function getYearlyHabitProgress(
  activities: ActivityItem[],
  yearlyMatrix: YearlyMatrixState,
  year: number
): YearlyHabitSummary[] {
  const daysPerMonth = MONTH_DAYS_IN_YEAR(year);
  const totalDaysInYear = daysPerMonth.reduce((a, b) => a + b, 0);

  return activities.map((habit) => {
    let totalCompletedDaysInYear = 0;

    const monthlyBreakdown = MONTH_NAMES.map((mName, mIdx) => {
      const totalDays = daysPerMonth[mIdx];
      const monthKey = `${year}-${mName}`;
      const monthMatrix = yearlyMatrix[monthKey] || yearlyMatrix[mName] || {};
      const daysArr = Array.isArray(monthMatrix[habit.id]) ? monthMatrix[habit.id] : [];
      const completedDays = daysArr.slice(0, totalDays).filter(Boolean).length;
      const completionRatePct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      totalCompletedDaysInYear += completedDays;

      return {
        monthName: mName,
        monthIndex: mIdx,
        completedDays,
        totalDays,
        completionRatePct,
      };
    });

    const yearlyCompletionRatePct = totalDaysInYear > 0 
      ? Math.round((totalCompletedDaysInYear / totalDaysInYear) * 100) 
      : 0;

    return {
      habitId: habit.id,
      habitName: habit.name,
      year,
      monthlyBreakdown,
      totalCompletedDaysInYear,
      totalDaysInYear,
      yearlyCompletionRatePct,
    };
  });
}

/**
 * Calculates overall month-by-month consistency rate for all habits combined (for charts)
 */
export function getYearlyMonthlyOverallRates(
  activities: ActivityItem[],
  yearlyMatrix: YearlyMatrixState,
  year: number
): Array<{ monthName: string; shortName: string; completed: number; totalPossible: number; ratePct: number }> {
  const daysPerMonth = MONTH_DAYS_IN_YEAR(year);
  const habitCount = Math.max(1, activities.length);

  return MONTH_NAMES.map((mName, mIdx) => {
    const totalDays = daysPerMonth[mIdx];
    const totalPossible = habitCount * totalDays;
    const monthKey = `${year}-${mName}`;
    const monthMatrix = yearlyMatrix[monthKey] || yearlyMatrix[mName] || {};

    let completed = 0;
    activities.forEach((habit) => {
      const daysArr = Array.isArray(monthMatrix[habit.id]) ? monthMatrix[habit.id] : [];
      completed += daysArr.slice(0, totalDays).filter(Boolean).length;
    });

    const ratePct = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;

    return {
      monthName: mName,
      shortName: mName.slice(0, 3),
      completed,
      totalPossible,
      ratePct,
    };
  });
}
