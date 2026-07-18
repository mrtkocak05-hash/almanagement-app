import { Minus, Plus } from 'lucide-react'
import { cn } from '@/utils/cn'

interface YearStepperProps {
  value?: number | null
  onChange: (year: number) => void
  min?: number
  max?: number
  label?: string
  error?: string
  hint?: string
  disabled?: boolean
}

export function YearStepper({
  value,
  onChange,
  min = 1950,
  max = 2100,
  label,
  error,
  hint,
  disabled,
}: YearStepperProps) {
  const year = value ?? new Date().getFullYear() + 1

  function clamp(n: number) { return Math.max(min, Math.min(max, n)) }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const n = parseInt(e.target.value, 10)
    if (!isNaN(n) && n >= 1000) onChange(clamp(n))
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    onChange(clamp(year + (e.deltaY < 0 ? 1 : -1)))
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowUp') { e.preventDefault(); onChange(clamp(year + 1)) }
    if (e.key === 'ArrowDown') { e.preventDefault(); onChange(clamp(year - 1)) }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div className={cn(
        'flex items-center rounded-lg border border-input bg-background overflow-hidden',
        disabled && 'opacity-50 pointer-events-none',
        error && 'border-destructive',
      )}>
        <button
          type="button"
          onClick={() => onChange(clamp(year - 1))}
          disabled={disabled || year <= min}
          className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0 border-r border-input disabled:opacity-40"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <input
          type="number"
          value={year}
          onChange={handleInput}
          onWheel={handleWheel}
          onKeyDown={handleKey}
          min={min}
          max={max}
          disabled={disabled}
          className={cn(
            'flex-1 h-10 text-center text-sm font-semibold text-foreground bg-transparent outline-none',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          )}
        />

        <button
          type="button"
          onClick={() => onChange(clamp(year + 1))}
          disabled={disabled || year >= max}
          className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0 border-l border-input disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
