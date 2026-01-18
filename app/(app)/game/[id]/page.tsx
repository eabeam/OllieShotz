'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGame } from '@/lib/hooks/useGame'
import { useChildProfile } from '@/lib/hooks/useChildProfile'
import { StatsDisplay } from '@/components/game/StatsDisplay'
import { PeriodSelector } from '@/components/game/PeriodSelector'
import { LiveTracker } from '@/components/game/LiveTracker'
import { EventList } from '@/components/game/EventList'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'

export default function GamePage() {
  const router = useRouter()
  const params = useParams()
  const gameId = params.id as string

  const { game, events, loading, error, addEvent, undoLastEvent, updateGameStatus } = useGame(gameId)
  const { profile } = useChildProfile()

  const [currentPeriod, setCurrentPeriod] = useState<string>('')
  const [showEndModal, setShowEndModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Set initial period when game loads
  useEffect(() => {
    if (game?.periods && !currentPeriod) {
      const periods = game.periods as string[]
      setCurrentPeriod(periods[0] || 'P1')
    }
  }, [game, currentPeriod])

  const handleSave = async () => {
    if (actionLoading) return
    setActionLoading(true)
    await addEvent('save', currentPeriod)
    setActionLoading(false)
  }

  const handleGoal = async () => {
    if (actionLoading) return
    setActionLoading(true)
    await addEvent('goal', currentPeriod)
    setActionLoading(false)
  }

  const handleUndo = async () => {
    if (actionLoading) return
    setActionLoading(true)
    await undoLastEvent()
    setActionLoading(false)
  }

  const handleEndGame = async () => {
    setActionLoading(true)
    await updateGameStatus('completed')
    setActionLoading(false)
    setShowEndModal(false)
    router.push(`/game/${gameId}/summary`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--foreground)]/60">Loading game...</div>
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

  const periods = (game.periods as string[]) || ['P1', 'P2', 'P3']
  const isLive = game.status === 'live'

  return (
    <div className="min-h-screen flex flex-col p-4 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-[var(--foreground)]/60 hover:text-[var(--foreground)] text-sm mb-1"
          >
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold">vs {game.opponent}</h1>
          <div className="text-sm text-[var(--foreground)]/60">
            {new Date(game.game_date).toLocaleDateString()}
          </div>
        </div>
        {isLive && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[var(--goal-red)] rounded-full animate-pulse" />
            <span className="text-sm font-medium text-[var(--goal-red)]">LIVE</span>
          </div>
        )}
      </div>

      {/* Period Selector */}
      <div className="mb-4">
        <PeriodSelector
          periods={periods}
          currentPeriod={currentPeriod}
          onPeriodChange={setCurrentPeriod}
        />
      </div>

      {/* Stats */}
      <Card className="mb-4">
        <StatsDisplay events={events} primaryColor={profile?.primary_color} />
      </Card>

      {/* Tracking Buttons (only if live) */}
      {isLive ? (
        <div className="flex-1 flex flex-col">
          <LiveTracker
            onSave={handleSave}
            onGoal={handleGoal}
            onUndo={handleUndo}
            canUndo={events.length > 0}
            disabled={actionLoading}
          />

          <div className="mt-6">
            <EventList events={events} />
          </div>

          <div className="mt-auto pt-6">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowEndModal(true)}
            >
              End Game
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <Card className="mb-4">
            <div className="text-center py-4">
              <div className="text-lg font-medium mb-2">
                {game.status === 'completed' ? 'Game Completed' : 'Game Not Started'}
              </div>
              {game.status === 'upcoming' && (
                <Button
                  onClick={async () => {
                    await updateGameStatus('live')
                  }}
                >
                  Start Game
                </Button>
              )}
              {game.status === 'completed' && (
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/game/${gameId}/summary`)}
                >
                  View Summary
                </Button>
              )}
            </div>
          </Card>

          <EventList events={events} maxItems={20} />
        </div>
      )}

      {/* End Game Modal */}
      <Modal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="End Game?"
      >
        <p className="text-[var(--foreground)]/80 mb-6">
          Are you sure you want to end this game? You can still view the stats afterward.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowEndModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleEndGame}
            loading={actionLoading}
          >
            End Game
          </Button>
        </div>
      </Modal>
    </div>
  )
}
