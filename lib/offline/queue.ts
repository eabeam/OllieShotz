import { openDB, IDBPDatabase } from 'idb'

const DB_NAME = 'ollieshotz'
const DB_VERSION = 1
const STORE_NAME = 'offline_queue'

export interface QueuedEvent {
  id: string
  action: 'create_event' | 'delete_event'
  payload: {
    game_id: string
    event_type?: 'save' | 'goal'
    period?: string
    event_id?: string
  }
  created_at: string
  synced: boolean
}

let dbInstance: IDBPDatabase | null = null

async function getDB() {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    },
  })

  return dbInstance
}

export async function addToQueue(event: Omit<QueuedEvent, 'id' | 'created_at' | 'synced'>): Promise<QueuedEvent> {
  const db = await getDB()

  const queuedEvent: QueuedEvent = {
    ...event,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    synced: false,
  }

  await db.put(STORE_NAME, queuedEvent)
  return queuedEvent
}

export async function getUnsynced(): Promise<QueuedEvent[]> {
  const db = await getDB()
  const all = await db.getAll(STORE_NAME)
  return (all as QueuedEvent[]).filter(e => !e.synced)
}

export async function markSynced(id: string): Promise<void> {
  const db = await getDB()
  const event = await db.get(STORE_NAME, id) as QueuedEvent | undefined
  if (event) {
    event.synced = true
    await db.put(STORE_NAME, event)
  }
}

export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export async function clearSynced(): Promise<void> {
  const db = await getDB()
  const all = await db.getAll(STORE_NAME)
  const synced = (all as QueuedEvent[]).filter(e => e.synced)
  for (const event of synced) {
    await db.delete(STORE_NAME, event.id)
  }
}
