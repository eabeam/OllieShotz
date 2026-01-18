import { createClient } from '@/lib/supabase/client'
import { getUnsynced, markSynced, removeFromQueue, QueuedEvent } from './queue'

export async function syncOfflineEvents(): Promise<{ synced: number; failed: number }> {
  const unsynced = await getUnsynced()
  let synced = 0
  let failed = 0

  const supabase = createClient()

  for (const event of unsynced) {
    try {
      if (event.action === 'create_event') {
        const { error } = await supabase
          .from('events')
          .insert({
            game_id: event.payload.game_id,
            event_type: event.payload.event_type!,
            period: event.payload.period!,
            synced: true,
          })

        if (error) {
          console.error('Failed to sync event:', error)
          failed++
        } else {
          await markSynced(event.id)
          synced++
        }
      } else if (event.action === 'delete_event') {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', event.payload.event_id!)

        if (error && error.code !== 'PGRST116') {
          console.error('Failed to sync delete:', error)
          failed++
        } else {
          await markSynced(event.id)
          synced++
        }
      }
    } catch (err) {
      console.error('Sync error:', err)
      failed++
    }
  }

  return { synced, failed }
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

export function setupOnlineListener(onOnline: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handler = () => {
    if (navigator.onLine) {
      onOnline()
    }
  }

  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)
}
