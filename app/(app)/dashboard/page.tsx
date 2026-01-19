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

  // Check if Hawks color scheme (red-ish primary color)
  const isHawks = profile?.primary_color?.toLowerCase().includes('e60000') ||
                  profile?.primary_color?.toLowerCase().includes('cc0000') ||
                  profile?.primary_color?.toLowerCase().includes('ff0000')

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Faded jersey number */}
        {profile.jersey_number && (
          <div
            className="absolute -right-8 top-20 text-[200px] font-black leading-none select-none"
            style={{
              color: profile.primary_color,
              opacity: 0.08,
            }}
          >
            {profile.jersey_number}
          </div>
        )}

        {/* Hawks logo watermark */}
        {isHawks && (
          <img
            src="/images/hawks-logo.png"
            alt=""
            className="absolute right-4 bottom-32 w-64 h-64 object-contain opacity-[0.07]"
          />
        )}

        {/* Gradient accent */}
        <div
          className="absolute top-0 left-0 right-0 h-40"
          style={{
            background: `linear-gradient(180deg, ${profile.primary_color}20 0%, transparent 100%)`,
          }}
        />
      </div>

      {/* Team color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: profile.primary_color }}
      />

      <div className="relative p-4 safe-top">
        {/* App Branding with team accent */}
        <div className="text-center mb-6 pt-2">
          <div className="flex items-center justify-center gap-3 mb-1">
            {isHawks && (
              <img
                src="/images/hawks-logo.png"
                alt="Hawks"
                className="w-12 h-12 object-contain"
              />
            )}
            <h1
              className="text-4xl font-black tracking-tight"
              style={{ color: profile.primary_color }}
            >
              OllieShotz
            </h1>
          </div>
          <p className="text-xs text-[var(--foreground)]/50 uppercase tracking-widest">Goalie Tracker</p>
        </div>

        {/* Player Header - more prominent */}
        <div
          className="mb-6 p-4 rounded-2xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${profile.primary_color}30 0%, ${profile.primary_color}10 100%)`,
            border: `2px solid ${profile.primary_color}40`,
          }}
        >
          <div className="flex items-center gap-4">
            {/* Large jersey number badge */}
            {profile.jersey_number && (
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg"
                style={{ backgroundColor: profile.primary_color }}
              >
                {profile.jersey_number}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              {profile.team_name && (
                <p
                  className="font-medium"
                  style={{ color: profile.primary_color }}
                >
                  {profile.team_name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Live Game Banner - more vibrant */}
        {liveGame && (
          <Link href={`/game/${liveGame.id}`}>
            <div
              className="mb-4 p-4 rounded-2xl relative overflow-hidden animate-pulse"
              style={{
                background: `linear-gradient(135deg, ${profile.primary_color} 0%, ${profile.primary_color}dd 100%)`,
              }}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="text-white">
                  <div className="flex items-center gap-2 text-sm font-bold mb-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                    LIVE GAME
                  </div>
                  <div className="text-xl font-bold">vs {liveGame.opponent}</div>
                </div>
                <div className="bg-white px-5 py-2.5 rounded-xl font-bold shadow-lg"
                  style={{ color: profile.primary_color }}
                >
                  Continue →
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Quick Actions - bigger and bolder */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link href="/game/new">
            <Button fullWidth size="lg" variant="primary" className="h-16 text-lg">
              New Game
            </Button>
          </Link>
          <Link href="/history">
            <Button fullWidth size="lg" variant="secondary" className="h-16 text-lg">
              View History
            </Button>
          </Link>
        </div>

        {/* Recent Games - with team color accents */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span
              className="w-1 h-5 rounded-full"
              style={{ backgroundColor: profile.primary_color }}
            />
            Recent Games
          </h2>
          {recentGames.length === 0 ? (
            <Card>
              <p className="text-center text-[var(--foreground)]/60 py-4">
                No games yet. Start tracking!
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentGames.map((game) => {
                const stats = calculateStats(game.events || [])
                return (
                  <Link key={game.id} href={`/game/${game.id}`}>
                    <Card className="hover:scale-[1.02] transition-all border-l-4"
                      style={{ borderLeftColor: profile.primary_color }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-lg">vs {game.opponent}</div>
                          <div className="text-sm text-[var(--foreground)]/60">
                            {new Date(game.game_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className="text-xl font-bold"
                            style={{ color: stats.savePercentage >= 90 ? 'var(--save-green)' : profile.primary_color }}
                          >
                            {formatGPA(stats.savePercentage)}
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
      </div>
    </div>
  )
}
