'use client'

import { Button } from '@/components/ui/Button'

interface LiveTrackerProps {
  onSave: () => void
  onGoal: () => void
  onUndo: () => void
  canUndo: boolean
  disabled?: boolean
}

export function LiveTracker({ onSave, onGoal, onUndo, canUndo, disabled }: LiveTrackerProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="save"
          size="xl"
          fullWidth
          onClick={onSave}
          disabled={disabled}
          className="active:scale-95 transition-transform"
        >
          SAVE
        </Button>
        <Button
          variant="goal"
          size="xl"
          fullWidth
          onClick={onGoal}
          disabled={disabled}
          className="active:scale-95 transition-transform"
        >
          GOAL
        </Button>
      </div>
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        onClick={onUndo}
        disabled={!canUndo || disabled}
      >
        Undo Last
      </Button>
    </div>
  )
}
