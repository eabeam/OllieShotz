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
import { Input } from '@/components/ui/Input'

export default function GamePage() {
  const router = useRouter()
  const params = useParams()
  const gameId = params.id as string

  const { game, events, loading, error, addEvent, undoLastEvent, updateGameStatus, updateNotes } = useGame(gameId)
  const { profile } = useChildProfile()

  const [currentPeriod, setCurrentPeriod] = useState<string>('')
  const [showEndModal, setShowEndModal] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Set initial period when game loads
  useEffect(() => {
    if (game?.periods && !currentPeriod) {
      const periods = game.periods as string[]
      setCurrentPeriod(periods[0] || 'P1')
    }
    if (game?.notes) {
      setNotes(game.notes)
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
    await updateNotes(notes)
    await updateGameStatus('completed')
    setActionLoading(false)
    setShowEndModal(false)
    router.push(`/game/${gameId}/summary`)
  }

  const handleSaveNotes = async () => {
    setActionLoading(true)
    await updateNotes(notes)
    setActionLoading(false)
    setShowNotesModal(false)
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
      {/* Team Color Accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: profile?.primary_color || 'var(--primary)' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 mt-2">
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
            {game.location && ` • ${game.location}`}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLive && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[var(--goal-red)] rounded-full animate-pulse" />
              <span className="text-sm font-medium text-[var(--goal-red)]">LIVE</span>
            </div>
          )}
          <button
            onClick={() => setShowNotesModal(true)}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            title="Game Notes"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
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
        <p className="text-[var(--foreground)]/80 mb-4">
          Add any final notes before ending the game.
        </p>
        <textarea
          className="w-full p-3 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] mb-4 min-h-[100px]"
          placeholder="Game notes (optional)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-3 mb-4">
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

      {/* Notes Modal */}
      <Modal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        title="Game Notes"
      >
        <textarea
          className="w-full p-3 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] mb-4 min-h-[150px]"
          placeholder="Add notes about the game..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-3 mb-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowNotesModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSaveNotes}
            loading={actionLoading}
          >
            Save Notes
          </Button>
        </div>
      </Modal>
    </div>
  )
}
