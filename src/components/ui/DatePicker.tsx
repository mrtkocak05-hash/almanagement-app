import { useRef } from 'react'
import { Calendar, X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface DatePickerProps {
  value?: string | null
  onChange: (date: string | null) => void
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  disabled?: boolean
  min?: string
  max?: string
  required?: boolean
}

type QuickPreset = 'today' | 'yesterday' | 'last_week' | 'last_month'

const QUICK_LABELS: Record<QuickPreset, string> = {
  today: 'Bugün',
  yesterday: 'Dün',
  last_week: 'Geçen Hafta',
  last_month: 'Geçen Ay',
}

function isoFromPreset(preset: QuickPreset): string {
  const d = new Date()
  switch (preset) {
    case 'today': break
    case 'yesterday': d.setDate(d.getDate() - 1); break
    case 'last_week': d.setDate(d.getDate() - 7); break
    case 'last_month': d.setMonth(d.getMonth() - 1); break
  }
  return d.toISOString().split('T')[0]
}

export function DatePicker({
  value,
  onChange,
  label,
  error,
  hint,
  placeholder = 'Tarih seçin',
  disabled,
  min,
  max,
  required,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="date"
          value={value ?? ''}
          onChange={e => onChange(e.target.value || null)}
          min={min}
          max={max}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-8 py-2',
            'text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !value && 'text-muted-foreground',
            error && 'border-destructive focus-visible:ring-destructive',
          )}
          placeholder={placeholder}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex gap-1 flex-wrap">
        {(Object.keys(QUICK_LABELS) as QuickPreset[]).map(p => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => onChange(isoFromPreset(p))}
            className={cn(
              'px-2.5 py-1 text-xs rounded-md border border-border text-muted-foreground',
              'hover:bg-accent hover:text-foreground transition-colors',
              'disabled:opacity-50 disabled:pointer-events-none',
            )}
          >
            {QUICK_LABELS[p]}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
