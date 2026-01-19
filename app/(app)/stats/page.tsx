'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useChildProfile } from '@/lib/hooks/useChildProfile'
import { Card } from '@/components/ui/Card'
import { Game, GameEvent } from '@/lib/types/database'
import { calculateStats, formatGPA } from '@/lib/utils/stats'

type GameWithEvents = Game & { events: GameEvent[] }

export default function StatsPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useChildProfile()
  const [games, setGames] = useState<GameWithEvents[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profileLoading || !profile) return

    async function fetchGames() {
      const supabase = createClient()

      const { data } = await supabase
        .from('games')
        .select('*, events(*)')
        .eq('child_id', profile!.id)
        .eq('status', 'completed')
        .order('game_date', { ascending: true })

      if (data) {
        setGames(data as GameWithEvents[])
      }

      setLoading(false)
    }

    fetchGames()
  }, [profile, profileLoading])

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--foreground)]/60">Loading stats...</div>
      </div>
    )
  }

  // Calculate overall stats
  const allEvents = games.flatMap(g => g.events || [])
  const overallStats = calculateStats(allEvents)

  // Calculate stats per game for trend
  const gameStats = games.map(game => ({
    date: new Date(game.game_date),
    opponent: game.opponent,
    ...calculateStats(game.events || [])
  }))

  // Calculate stats by period across all games
  const periodStats: Record<string, { saves: number; goals: number }> = {}
  games.forEach(game => {
    const periods = (game.periods as string[]) || ['P1', 'P2', 'P3']
    periods.forEach(period => {
      if (!periodStats[period]) {
        periodStats[period] = { saves: 0, goals: 0 }
      }
      const periodEvents = (game.events || []).filter(e => e.period === period)
      periodStats[period].saves += periodEvents.filter(e => e.event_type === 'save').length
      periodStats[period].goals += periodEvents.filter(e => e.event_type === 'goal').length
    })
  })

  // Get last 10 games for trend chart
  const recentGames = gameStats.slice(-10)
  const maxShots = Math.max(...recentGames.map(g => g.total), 1)

  return (
    <div className="p-4 safe-top pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-[var(--foreground)]/60 hover:text-[var(--foreground)] text-sm mb-1"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Season Stats</h1>
        </div>
      </div>

      {games.length === 0 ? (
        <Card>
          <p className="text-center text-[var(--foreground)]/60 py-8">
            Complete some games to see your stats!
          </p>
        </Card>
      ) : (
        <>
          {/* Overall Season Stats */}
          <Card className="mb-6">
            <div className="text-center">
              <div className="text-sm text-[var(--foreground)]/60 uppercase tracking-wide mb-2">
                Season Overview ({games.length} games)
              </div>
              <div
                className="text-5xl font-bold mb-4"
                style={{ color: overallStats.savePercentage >= 90 ? 'var(--save-green)' : profile?.primary_color }}
              >
                {formatGPA(overallStats.savePercentage)}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-[var(--save-green)]">{overallStats.saves}</div>
                  <div className="text-xs text-[var(--foreground)]/60">Total Saves</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--goal-red)]">{overallStats.goals}</div>
                  <div className="text-xs text-[var(--foreground)]/60">Goals Allowed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{overallStats.total}</div>
                  <div className="text-xs text-[var(--foreground)]/60">Total Shots</div>
                </div>
              </div>
            </div>
          </Card>

          {/* GPA Trend Chart */}
          {recentGames.length > 1 && (
            <Card className="mb-6">
              <h2 className="text-lg font-semibold mb-4">GPA Trend (Last {recentGames.length} Games)</h2>
              <div className="h-48 relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-[var(--foreground)]/40">
                  <span>10.0</span>
                  <span>7.5</span>
                  <span>5.0</span>
                  <span>2.5</span>
                  <span>0.0</span>
                </div>
                {/* Chart area */}
                <div className="ml-10 h-full pr-2">
                  <svg className="w-full h-full" viewBox="0 0 350 160" preserveAspectRatio="xMidYMid meet">
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((pct) => (
                      <line
                        key={pct}
                        x1="0"
                        y1={140 - (pct / 100) * 130}
                        x2="350"
                        y2={140 - (pct / 100) * 130}
                        stroke="var(--border)"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Line chart */}
                    <polyline
                      fill="none"
                      stroke={profile?.primary_color || 'var(--primary)'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={recentGames.map((game, i) => {
                        const x = 10 + (i / Math.max(recentGames.length - 1, 1)) * 330
                        const y = 140 - (game.savePercentage / 100) * 130
                        return `${x},${y}`
                      }).join(' ')}
                    />

                    {/* Data points */}
                    {recentGames.map((game, i) => {
                      const x = 10 + (i / Math.max(recentGames.length - 1, 1)) * 330
                      const y = 140 - (game.savePercentage / 100) * 130
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="6"
                          fill={game.savePercentage >= 90 ? 'var(--save-green)' : profile?.primary_color || 'var(--primary)'}
                          stroke="var(--background)"
                          strokeWidth="2"
                        />
                      )
                    })}
                  </svg>
                </div>
              </div>
              <div className="flex justify-between text-xs text-[var(--foreground)]/40 mt-2 px-10">
                <span>{recentGames[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{recentGames[recentGames.length - 1]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </Card>
          )}

          {/* Saves vs Goals Bar */}
          <Card className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Save Rate</h2>
            <div className="relative h-8 rounded-full overflow-hidden bg-[var(--muted)]">
              <div
                className="absolute inset-y-0 left-0 bg-[var(--save-green)] transition-all duration-500"
                style={{ width: `${overallStats.savePercentage}%` }}
              />
              <div
                className="absolute inset-y-0 right-0 bg-[var(--goal-red)] transition-all duration-500"
                style={{ width: `${100 - overallStats.savePercentage}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                {overallStats.savePercentage.toFixed(1)}% saves
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-[var(--save-green)]">{overallStats.saves} saves</span>
              <span className="text-[var(--goal-red)]">{overallStats.goals} goals</span>
            </div>
          </Card>

          {/* Performance by Period */}
          {Object.keys(periodStats).length > 0 && (
            <Card className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Performance by Period</h2>
              <div className="space-y-3">
                {Object.entries(periodStats).map(([period, stats]) => {
                  const total = stats.saves + stats.goals
                  const pct = total > 0 ? (stats.saves / total) * 100 : 0
                  return (
                    <div key={period}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{period}</span>
                        <span className="text-[var(--foreground)]/60">
                          {formatGPA(pct)} ({stats.saves}S / {stats.goals}G)
                        </span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden bg-[var(--muted)]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct >= 90 ? 'var(--save-green)' : profile?.primary_color || 'var(--primary)'
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Recent Games Performance */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Recent Games</h2>
            <div className="space-y-2">
              {gameStats.slice(-5).reverse().map((game, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div>
                    <div className="font-medium text-sm">vs {game.opponent}</div>
                    <div className="text-xs text-[var(--foreground)]/60">
                      {game.date.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="font-bold"
                      style={{ color: game.savePercentage >= 90 ? 'var(--save-green)' : profile?.primary_color }}
                    >
                      {formatGPA(game.savePercentage)}
                    </div>
                    <div className="text-xs text-[var(--foreground)]/60">
                      {game.saves}S / {game.goals}G
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
