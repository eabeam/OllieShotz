import { Game, GameEvent } from '@/lib/types/database'
import { calculateStats, formatSavePercentage } from './stats'

export function generateGameCSV(game: Game, events: GameEvent[]): string {
  const stats = calculateStats(events)
  const periods = (game.periods as string[]) || ['P1', 'P2', 'P3']

  const lines: string[] = []

  // Header info
  lines.push('OllieShotz Game Export')
  lines.push(`Date,${game.game_date}`)
  lines.push(`Opponent,${game.opponent}`)
  lines.push(`Status,${game.status}`)
  lines.push('')

  // Overall stats
  lines.push('Overall Stats')
  lines.push('Saves,Goals,Total Shots,Save %')
  lines.push(`${stats.saves},${stats.goals},${stats.total},${formatSavePercentage(stats.savePercentage)}`)
  lines.push('')

  // Stats by period
  lines.push('Stats by Period')
  lines.push('Period,Saves,Goals,Save %')
  for (const period of periods) {
    const periodEvents = events.filter(e => e.period === period)
    const periodStats = calculateStats(periodEvents)
    lines.push(`${period},${periodStats.saves},${periodStats.goals},${formatSavePercentage(periodStats.savePercentage)}`)
  }
  lines.push('')

  // Event log
  lines.push('Event Log')
  lines.push('Time,Type,Period')
  for (const event of events) {
    lines.push(`${event.recorded_at},${event.event_type},${event.period}`)
  }

  return lines.join('\n')
}

export function generateAllGamesCSV(games: (Game & { events: GameEvent[] })[]): string {
  const lines: string[] = []

  lines.push('OllieShotz Season Export')
  lines.push(`Generated,${new Date().toISOString()}`)
  lines.push('')

  // Summary table
  lines.push('Game Summary')
  lines.push('Date,Opponent,Status,Saves,Goals,Total Shots,Save %')

  let totalSaves = 0
  let totalGoals = 0

  for (const game of games) {
    const stats = calculateStats(game.events || [])
    totalSaves += stats.saves
    totalGoals += stats.goals
    lines.push(`${game.game_date},${game.opponent},${game.status},${stats.saves},${stats.goals},${stats.total},${formatSavePercentage(stats.savePercentage)}`)
  }

  lines.push('')

  // Season totals
  const totalShots = totalSaves + totalGoals
  const seasonSavePercentage = totalShots > 0 ? (totalSaves / totalShots) * 100 : 0

  lines.push('Season Totals')
  lines.push('Games,Total Saves,Total Goals,Total Shots,Season Save %')
  lines.push(`${games.length},${totalSaves},${totalGoals},${totalShots},${formatSavePercentage(seasonSavePercentage)}`)

  return lines.join('\n')
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
