'use client'

import { GameEvent } from '@/lib/types/database'

interface EventListProps {
  events: GameEvent[]
  maxItems?: number
}

export function EventList({ events, maxItems = 10 }: EventListProps) {
  // Deduplicate events by ID to prevent React key warnings from rapid button presses
  const uniqueEvents = events.filter((event, index, self) =>
    index === self.findIndex(e => e.id === event.id)
  )
  const recentEvents = [...uniqueEvents].reverse().slice(0, maxItems)

  if (recentEvents.length === 0) {
    return (
      <div className="text-center text-[var(--foreground)]/40 py-4">
        No events yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-[var(--foreground)]/60 uppercase tracking-wide">
        Recent Events
      </h3>
      <div className="flex flex-wrap gap-2">
        {recentEvents.map((event) => (
          <div
            key={event.id}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium
              ${event.event_type === 'save'
                ? 'bg-[var(--save-green)]/20 text-[var(--save-green)]'
                : 'bg-[var(--goal-red)]/20 text-[var(--goal-red)]'
              }
              ${!event.synced ? 'opacity-60' : ''}
            `}
          >
            {event.event_type === 'save' ? 'Save' : 'Goal'} ({event.period})
          </div>
        ))}
      </div>
    </div>
  )
}
