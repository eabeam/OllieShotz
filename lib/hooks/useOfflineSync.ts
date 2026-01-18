'use client'

import { useEffect, useState, useCallback } from 'react'
import { syncOfflineEvents, isOnline, setupOnlineListener } from '@/lib/offline/sync'
import { addToQueue, getUnsynced, QueuedEvent } from '@/lib/offline/queue'

export function useOfflineSync() {
  const [online, setOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  // Check online status
  useEffect(() => {
    setOnline(isOnline())

    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Update pending count
  useEffect(() => {
    async function updateCount() {
      const unsynced = await getUnsynced()
      setPendingCount(unsynced.length)
    }
    updateCount()
  }, [])

  // Auto-sync when coming online
  useEffect(() => {
    return setupOnlineListener(async () => {
      if (pendingCount > 0) {
        await sync()
      }
    })
  }, [pendingCount])

  const sync = useCallback(async () => {
    if (syncing || !online) return

    setSyncing(true)
    try {
      const result = await syncOfflineEvents()
      const unsynced = await getUnsynced()
      setPendingCount(unsynced.length)
      return result
    } finally {
      setSyncing(false)
    }
  }, [syncing, online])

  const queueEvent = useCallback(async (
    action: 'create_event' | 'delete_event',
    payload: QueuedEvent['payload']
  ) => {
    const event = await addToQueue({ action, payload })
    setPendingCount(prev => prev + 1)

    // Try to sync immediately if online
    if (online) {
      sync()
    }

    return event
  }, [online, sync])

  return {
    online,
    pendingCount,
    syncing,
    sync,
    queueEvent,
  }
}
