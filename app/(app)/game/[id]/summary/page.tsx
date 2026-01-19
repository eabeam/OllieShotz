'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useGame } from '@/lib/hooks/useGame'
import { useChildProfile } from '@/lib/hooks/useChildProfile'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { calculateStats, calculateStatsByPeriod, formatGPA } from '@/lib/utils/stats'

export default function GameSummaryPage() {
  const router = useRouter()
  const params = useParams()
  const gameId = params.id as string

  const { game, events, loading, error } = useGame(gameId)
  const { profile } = useChildProfile()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteGame = async () => {
    setDeleting(true)
    const supabase = createClient()

    const { error: deleteError } = await supabase
      .from('games')
      .delete()
      .eq('id', gameId)

    if (!deleteError) {
      router.push('/history')
    }
    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--foreground)]/60">Loading...</div>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-[var(--goal-red)] mb-4">{error || 'Game not found'}</div>
        <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    )
  }

  const stats = calculateStats(events)
  const periods = (game.periods as string[]) || ['P1', 'P2', 'P3']
  const statsByPeriod = calculateStatsByPeriod(events, periods)

  return (
    <div className="min-h-screen p-4 safe-top">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/history')}
          className="text-[var(--foreground)]/60 hover:text-[var(--foreground)] text-sm mb-2"
        >
          ← Back to History
        </button>
        <h1 className="text-2xl font-bold">vs {game.opponent}</h1>
        <div className="text-[var(--foreground)]/60">
          {new Date(game.game_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          {game.location && (
            <div className="text-sm mt-1">📍 {game.location}</div>
          )}
        </div>
      </div>

      {/* Overall Stats */}
      <Card className="mb-6">
        <div className="text-center">
          <div
            className="text-6xl font-bold mb-2"
            style={{ color: stats.savePercentage >= 90 ? 'var(--save-green)' : profile?.primary_color }}
          >
            {formatGPA(stats.savePercentage)}
          </div>
          <div className="text-[var(--foreground)]/60 mb-4">Goalie Performance Average</div>

          <div className="flex justify-center gap-8">
            <div>
              <div className="text-3xl font-bold text-[var(--save-green)]">{stats.saves}</div>
              <div className="text-sm text-[var(--foreground)]/60">Saves</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[var(--goal-red)]">{stats.goals}</div>
              <div className="text-sm text-[var(--foreground)]/60">Goals Allowed</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-sm text-[var(--foreground)]/60">Total Shots</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Period Breakdown */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">By Period</h2>
        <div className="space-y-3">
          {periods.map((period) => {
            const periodStats = statsByPeriod[period]
            return (
              <Card key={period} padding="sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{period}</div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-[var(--save-green)]">{periodStats.saves} saves</span>
                    <span className="text-[var(--goal-red)]">{periodStats.goals} goals</span>
                    <span className="font-medium">
                      {formatGPA(periodStats.savePercentage)}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Notes */}
      {game.notes && (
        <Card className="mb-6">
          <h3 className="text-sm font-medium text-[var(--foreground)]/60 mb-2">Notes</h3>
          <p>{game.notes}</p>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {game.status === 'completed' && (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => router.push(`/game/${gameId}`)}
          >
            View Game Details
          </Button>
        )}
        <Button
          variant="danger"
          fullWidth
          onClick={() => setShowDeleteModal(true)}
        >
          Delete Game
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Game?"
      >
        <p className="text-[var(--foreground)]/80 mb-4">
          Are you sure you want to delete this game vs {game.opponent}? This action cannot be undone.
        </p>
        <div className="flex gap-3 mb-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={handleDeleteGame}
            loading={deleting}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
