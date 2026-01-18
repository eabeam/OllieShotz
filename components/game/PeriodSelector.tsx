'use client'

interface PeriodSelectorProps {
  periods: string[]
  currentPeriod: string
  onPeriodChange: (period: string) => void
}

export function PeriodSelector({ periods, currentPeriod, onPeriodChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {periods.map((period) => (
        <button
          key={period}
          onClick={() => onPeriodChange(period)}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${currentPeriod === period
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--muted)] text-[var(--foreground)]/60 hover:text-[var(--foreground)]'
            }
          `}
        >
          {period}
        </button>
      ))}
    </div>
  )
}
