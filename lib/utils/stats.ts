import { GameEvent } from '@/lib/types/database'

export interface GameStats {
  saves: number
  goals: number
  total: number
  savePercentage: number
}

export function calculateStats(events: GameEvent[]): GameStats {
  const saves = events.filter(e => e.event_type === 'save').length
  const goals = events.filter(e => e.event_type === 'goal').length
  const total = saves + goals
  const savePercentage = total > 0 ? (saves / total) * 100 : 0

  return { saves, goals, total, savePercentage }
}

export function calculateStatsByPeriod(events: GameEvent[], periods: string[]): Record<string, GameStats> {
  const statsByPeriod: Record<string, GameStats> = {}

  for (const period of periods) {
    const periodEvents = events.filter(e => e.period === period)
    statsByPeriod[period] = calculateStats(periodEvents)
  }

  return statsByPeriod
}

export function formatSavePercentage(percentage: number): string {
  if (percentage === 0) return '0.0%'
  if (percentage === 100) return '100%'
  return `${percentage.toFixed(1)}%`
}

// GPA format: 92.5% becomes "GPA 9.25"
export function formatGPA(percentage: number): string {
  const gpa = percentage / 10
  if (gpa === 0) return 'GPA 0.00'
  if (gpa === 10) return 'GPA 10.00'
  return `GPA ${gpa.toFixed(2)}`
}
