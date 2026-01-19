'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Game, GameEvent } from '@/lib/types/database'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function useGame(gameId: string) {
  const [game, setGame] = useState<Game | null>(null)
  const [events, setEvents] = useState<GameEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track recently added event IDs to prevent duplicates from realtime
  const recentlyAddedIds = useRef<Set<string>>(new Set())

  const supabase = createClient()

  // Fetch game and events
  useEffect(() => {
    async function fetchGame() {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single()

      if (gameError) {
        setError(gameError.message)
        setLoading(false)
        return
      }

      setGame(gameData)

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('game_id', gameId)
        .order('recorded_at', { ascending: true })

      if (eventsError) {
        setError(eventsError.message)
      } else {
        setEvents(eventsData || [])
      }

      setLoading(false)
    }

    fetchGame()
  }, [gameId, supabase])

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `game_id=eq.${gameId}`,
        },
        (payload: RealtimePostgresChangesPayload<GameEvent>) => {
          if (payload.eventType === 'INSERT') {
            const newEvent = payload.new as GameEvent
            // Skip if we recently added this event ourselves (prevents duplicates)
            if (recentlyAddedIds.current.has(newEvent.id)) {
              recentlyAddedIds.current.delete(newEvent.id)
              return
            }
            setEvents(prev => {
              // Avoid duplicates
              if (prev.some(e => e.id === newEvent.id)) {
                return prev
              }
              const newEvents = [...prev, newEvent]
              // Sort by recorded_at to maintain order
              return newEvents.sort((a, b) =>
                new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
              )
            })
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== (payload.old as GameEvent).id))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload: RealtimePostgresChangesPayload<Game>) => {
          setGame(payload.new as Game)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, supabase])

  const addEvent = useCallback(async (eventType: 'save' | 'goal', period: string) => {
    const { data: { user } } = await supabase.auth.getUser()

    const tempId = crypto.randomUUID()
    const optimisticEvent: GameEvent = {
      id: tempId,
      game_id: gameId,
      event_type: eventType,
      period,
      recorded_at: new Date().toISOString(),
      synced: false,
      created_by: user?.id || null,
    }

    // Optimistic update
    setEvents(prev => [...prev, optimisticEvent])

    const { data, error } = await supabase
      .from('events')
      .insert({
        game_id: gameId,
        event_type: eventType,
        period,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) {
      // Rollback optimistic update
      setEvents(prev => prev.filter(e => e.id !== tempId))
      return { error }
    }

    // Track this ID so realtime doesn't duplicate it
    recentlyAddedIds.current.add(data.id)

    // Replace temp event with real one
    setEvents(prev => prev.map(e => e.id === tempId ? data : e))
    return { data }
  }, [gameId, supabase])

  const undoLastEvent = useCallback(async () => {
    if (events.length === 0) return { error: 'No events to undo' }

    const lastEvent = events[events.length - 1]

    // Optimistic update
    setEvents(prev => prev.slice(0, -1))

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', lastEvent.id)

    if (error) {
      // Rollback
      setEvents(prev => [...prev, lastEvent])
      return { error }
    }

    return { success: true }
  }, [events, supabase])

  const updateGameStatus = useCallback(async (status: 'upcoming' | 'live' | 'completed') => {
    const { error } = await supabase
      .from('games')
      .update({ status })
      .eq('id', gameId)

    if (!error && game) {
      setGame({ ...game, status })
    }

    return { error }
  }, [game, gameId, supabase])

  const updateNotes = useCallback(async (notes: string) => {
    const { error } = await supabase
      .from('games')
      .update({ notes })
      .eq('id', gameId)

    if (!error && game) {
      setGame({ ...game, notes })
    }

    return { error }
  }, [game, gameId, supabase])

  return {
    game,
    events,
    loading,
    error,
    addEvent,
    undoLastEvent,
    updateGameStatus,
    updateNotes,
  }
}
