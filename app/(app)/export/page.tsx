'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChildProfile } from '@/lib/hooks/useChildProfile'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Game, GameEvent } from '@/lib/types/database'
import { generateGameCSV, generateAllGamesCSV, downloadCSV } from '@/lib/utils/csv'
import { calculateStats, formatSavePercentage } from '@/lib/utils/stats'

type GameWithEvents = Game & { events: GameEvent[] }

export default function ExportPage() {
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
        .order('game_date', { ascending: false })

      if (data) {
        setGames(data as GameWithEvents[])
      }

      setLoading(false)
    }

    fetchGames()
  }, [profile, profileLoading])

  const handleExportAll = () => {
    const csv = generateAllGamesCSV(games)
    const filename = `ollieshotz-${profile?.name.toLowerCase().replace(/\s+/g, '-')}-season.csv`
    downloadCSV(csv, filename)
  }

  const handleExportGame = (game: GameWithEvents) => {
    const csv = generateGameCSV(game, game.events || [])
    const filename = `ollieshotz-${game.opponent.toLowerCase().replace(/\s+/g, '-')}-${game.game_date}.csv`
    downloadCSV(csv, filename)
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--foreground)]/60">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4 safe-top">
      <h1 className="text-2xl font-bold mb-4">Export Data</h1>

      {/* Export All */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Export All Games</div>
            <div className="text-sm text-[var(--foreground)]/60">
              {games.length} games in CSV format
            </div>
          </div>
          <Button
            onClick={handleExportAll}
            disabled={games.length === 0}
          >
            Download
          </Button>
        </div>
      </Card>

      {/* Individual Games */}
      <h2 className="text-lg font-semibold mb-3">Export Individual Game</h2>

      {games.length === 0 ? (
        <Card>
          <p className="text-center text-[var(--foreground)]/60">
            No games to export
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {games.map((game) => {
            const stats = calculateStats(game.events || [])
            return (
              <Card key={game.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">vs {game.opponent}</div>
                    <div className="text-sm text-[var(--foreground)]/60">
                      {new Date(game.game_date).toLocaleDateString()} • {formatSavePercentage(stats.savePercentage)}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExportGame(game)}
                  >
                    Export
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
