'use client'

import { GameEvent } from '@/lib/types/database'
import { calculateStats, formatSavePercentage } from '@/lib/utils/stats'

interface StatsDisplayProps {
  events: GameEvent[]
  primaryColor?: string
}

export function StatsDisplay({ events, primaryColor = '#1e40af' }: StatsDisplayProps) {
  const stats = calculateStats(events)

  return (
    <div className="text-center py-6">
      <div className="flex justify-center gap-12 mb-4">
        <div>
          <div className="text-4xl font-bold text-[var(--save-green)]">{stats.saves}</div>
          <div className="text-sm text-[var(--foreground)]/60 uppercase tracking-wide">Saves</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-[var(--goal-red)]">{stats.goals}</div>
          <div className="text-sm text-[var(--foreground)]/60 uppercase tracking-wide">Goals</div>
        </div>
      </div>
      <div
        className="text-5xl font-bold"
        style={{ color: stats.savePercentage >= 90 ? 'var(--save-green)' : primaryColor }}
      >
        {formatSavePercentage(stats.savePercentage)}
      </div>
      <div className="text-sm text-[var(--foreground)]/60 uppercase tracking-wide mt-1">
        Save Percentage
      </div>
    </div>
  )
}
