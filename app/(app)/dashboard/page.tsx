'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useChildProfile } from '@/lib/hooks/useChildProfile'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Game, GameEvent } from '@/lib/types/database'
import { calculateStats, formatGPA } from '@/lib/utils/stats'

export default function DashboardPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useChildProfile()
  const [recentGames, setRecentGames] = useState<(Game & { events: GameEvent[] })[]>([])
  const [liveGame, setLiveGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('Dashboard: Effect running', { profileLoading, profile: profile?.id })
    if (profileLoading) return
    if (!profile) {
      console.log('Dashboard: No profile found, redirecting to setup')
      setLoading(false)
      router.push('/setup')
      return
    }
    console.log('Dashboard: Profile found, fetching games')

    async function fetchGames() {
      const supabase = createClient()

      // Fetch recent games with events
      const { data: games } = await supabase
        .from('games')
        .select('*, events(*)')
        .eq('child_id', profile!.id)
        .order('game_date', { ascending: false })
        .limit(5)

      if (games) {
        const typedGames = games as (Game & { events: GameEvent[] })[]
        setRecentGames(typedGames)
        const live = typedGames.find(g => g.status === 'live')
        if (live) setLiveGame(live)
      }

      setLoading(false)
    }

    fetchGames()
  }, [profile, profileLoading, router])

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--foreground)]/60">Loading...</div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="p-4 safe-top">
      {/* App Branding */}
      <div className="text-center mb-6">
        <h1
          className="text-3xl font-black tracking-tight"
          style={{ color: profile.primary_color || 'var(--primary)' }}
        >
          OllieShotz
        </h1>
        <p className="text-xs text-[var(--foreground)]/50 uppercase tracking-widest">Goalie Tracker</p>
      </div>

      {/* Player Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-xl font-bold">{profile.name}</h2>
          {profile.jersey_number && (
            <span
              className="px-2 py-0.5 rounded-md text-sm font-bold"
              style={{ backgroundColor: profile.primary_color, color: '#fff' }}
            >
              #{profile.jersey_number}
            </span>
          )}
        </div>
        {profile.team_name && (
          <p className="text-[var(--foreground)]/60">{profile.team_name}</p>
        )}
      </div>

      {/* Live Game Banner */}
      {liveGame && (
        <Link href={`/game/${liveGame.id}`}>
          <Card className="mb-4 bg-[var(--primary)]/20 border-[var(--primary)]" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[var(--primary-light)] font-medium">LIVE GAME</div>
                <div className="font-semibold">vs {liveGame.opponent}</div>
              </div>
              <div className="bg-[var(--primary)] px-4 py-2 rounded-lg text-white font-medium">
                Continue
              </div>
            </div>
          </Card>
        </Link>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/game/new">
          <Button fullWidth size="lg" variant="primary">
            New Game
          </Button>
        </Link>
        <Link href="/history">
          <Button fullWidth size="lg" variant="secondary">
            View History
          </Button>
        </Link>
      </div>

      {/* Recent Games */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Games</h2>
        {recentGames.length === 0 ? (
          <Card>
            <p className="text-center text-[var(--foreground)]/60">
              No games yet. Start tracking!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentGames.map((game) => {
              const stats = calculateStats(game.events || [])
              return (
                <Link key={game.id} href={`/game/${game.id}`}>
                  <Card className="hover:bg-[var(--muted)]/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">vs {game.opponent}</div>
                        <div className="text-sm text-[var(--foreground)]/60">
                          {new Date(game.game_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {formatGPA(stats.savePercentage)}
                        </div>
                        <div className="text-sm text-[var(--foreground)]/60">
                          {stats.saves} saves, {stats.goals} goals
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
    </div>
  )
}
