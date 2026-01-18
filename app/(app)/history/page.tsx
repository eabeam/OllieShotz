'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useChildProfile } from '@/lib/hooks/useChildProfile'
import { Card } from '@/components/ui/Card'
import { Game, GameEvent } from '@/lib/types/database'
import { calculateStats, formatSavePercentage } from '@/lib/utils/stats'

type GameWithEvents = Game & { events: GameEvent[] }

export default function HistoryPage() {
  const { profile, loading: profileLoading } = useChildProfile()
  const [games, setGames] = useState<GameWithEvents[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'live'>('all')

  useEffect(() => {
    if (profileLoading || !profile) return

    async function fetchGames() {
      const supabase = createClient()

      const { data } = await supabase
        .from('games')
        .select('*, events(*)')
        .eq('child_id', profile!.id)
        .order('game_date', { ascending: false })

      if (data) {
        setGames(data as GameWithEvents[])
      }

      setLoading(false)
    }

    fetchGames()
  }, [profile, profileLoading])

  const filteredGames = games.filter(game => {
    if (filter === 'all') return true
    return game.status === filter
  })

  // Calculate overall stats
  const allEvents = games.flatMap(g => g.events || [])
  const overallStats = calculateStats(allEvents)

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--foreground)]/60">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4 safe-top">
      <h1 className="text-2xl font-bold mb-4">Game History</h1>

      {/* Overall Stats */}
      {games.length > 0 && (
        <Card className="mb-6">
          <div className="text-center">
            <div className="text-sm text-[var(--foreground)]/60 uppercase tracking-wide mb-2">
              Season Stats ({games.length} games)
            </div>
            <div className="text-4xl font-bold mb-2" style={{ color: profile?.primary_color }}>
              {formatSavePercentage(overallStats.savePercentage)}
            </div>
            <div className="flex justify-center gap-6 text-sm">
              <span className="text-[var(--save-green)]">{overallStats.saves} saves</span>
              <span className="text-[var(--goal-red)]">{overallStats.goals} goals</span>
            </div>
          </div>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['all', 'completed', 'live'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${filter === f
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--foreground)]/60'
              }
            `}
          >
            {f === 'all' ? 'All Games' : f === 'completed' ? 'Completed' : 'Live'}
          </button>
        ))}
      </div>

      {/* Games List */}
      {filteredGames.length === 0 ? (
        <Card>
          <p className="text-center text-[var(--foreground)]/60">
            {filter === 'all' ? 'No games yet' : `No ${filter} games`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredGames.map((game) => {
            const stats = calculateStats(game.events || [])
            return (
              <Link key={game.id} href={`/game/${game.id}/summary`}>
                <Card className="hover:bg-[var(--muted)]/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">vs {game.opponent}</span>
                        {game.status === 'live' && (
                          <span className="px-2 py-0.5 bg-[var(--goal-red)]/20 text-[var(--goal-red)] text-xs rounded-full">
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-[var(--foreground)]/60">
                        {new Date(game.game_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatSavePercentage(stats.savePercentage)}
                      </div>
                      <div className="text-sm text-[var(--foreground)]/60">
                        {stats.saves}S / {stats.goals}G
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
