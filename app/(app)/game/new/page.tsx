'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useChildProfile } from '@/lib/hooks/useChildProfile'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const defaultPeriods = ['P1', 'P2', 'P3']

export default function NewGamePage() {
  const router = useRouter()
  const { profile } = useChildProfile()
  const [opponent, setOpponent] = useState('')
  const [location, setLocation] = useState('')
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0])
  const [periods, setPeriods] = useState<string[]>(defaultPeriods)
  const [newPeriod, setNewPeriod] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addPeriod = () => {
    if (newPeriod.trim() && !periods.includes(newPeriod.trim())) {
      setPeriods([...periods, newPeriod.trim()])
      setNewPeriod('')
    }
  }

  const removePeriod = (period: string) => {
    if (periods.length > 1) {
      setPeriods(periods.filter(p => p !== period))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: insertError } = await supabase
      .from('games')
      .insert({
        child_id: profile.id,
        opponent,
        location: location || null,
        game_date: gameDate,
        periods,
        status: 'live',
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/game/${data.id}`)
  }

  return (
    <div className="p-4 safe-top">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-[var(--foreground)]/60 hover:text-[var(--foreground)] mb-2"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">New Game</h1>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Opponent"
            placeholder="e.g., Maple Leafs"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            required
          />

          <Input
            label="Location"
            placeholder="e.g., Home Arena, Away Rink"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <Input
            label="Game Date"
            type="date"
            value={gameDate}
            onChange={(e) => setGameDate(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]/80 mb-2">
              Periods
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {periods.map((period) => (
                <div
                  key={period}
                  className="flex items-center gap-1 bg-[var(--muted)] px-3 py-1.5 rounded-lg"
                >
                  <span>{period}</span>
                  {periods.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePeriod(period)}
                      className="text-[var(--foreground)]/40 hover:text-[var(--goal-red)] ml-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add period (OT, SO...)"
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addPeriod()
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addPeriod}>
                Add
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[var(--goal-red)]/20 text-[var(--goal-red)] text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
          >
            Start Game
          </Button>
        </form>
      </Card>
    </div>
  )
}
