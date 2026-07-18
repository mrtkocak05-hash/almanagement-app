import { useState, useRef } from 'react'
import { cn } from '@/utils/cn'

interface NumberInputProps {
  value?: number | null
  onChange: (value: number | null) => void
  decimals?: number
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  prefix?: string
  suffix?: string
  step?: number
  min?: number
  max?: number
  disabled?: boolean
  className?: string
  required?: boolean
}

function fmt(value: number, decimals: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function parse(str: string): number | null {
  // tr-TR: thousands = '.', decimal = ','
  const cleaned = str.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

export function NumberInput({
  value,
  onChange,
  decimals = 0,
  label,
  error,
  hint,
  placeholder,
  prefix,
  suffix,
  step = 1,
  min,
  max,
  disabled,
  className,
  required,
}: NumberInputProps) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const displayPlaceholder = placeholder ?? (decimals > 0 ? '0,00' : '0')

  function handleFocus() {
    setFocused(true)
    // Show raw editable value: replace dot with comma for Turkish input
    setRaw(value != null ? String(value).replace('.', ',') : '')
  }

  function handleBlur() {
    setFocused(false)
    const parsed = parse(raw)
    let clamped = parsed
    if (clamped != null && min != null) clamped = Math.max(min, clamped)
    if (clamped != null && max != null) clamped = Math.min(max, clamped)
    onChange(clamped)
    setRaw('')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRaw(e.target.value)
  }

  function handleWheel(e: React.WheelEvent) {
    if (!focused) return
    e.preventDefault()
    const current = parse(raw) ?? value ?? 0
    const next = current + (e.deltaY < 0 ? step : -step)
    const clamped = max != null ? Math.min(max, min != null ? Math.max(min, next) : next) : (min != null ? Math.max(min, next) : next)
    onChange(clamped)
    setRaw(String(clamped).replace('.', ','))
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const current = parse(raw) ?? value ?? 0
      const next = current + step
      const clamped = max != null ? Math.min(max, next) : next
      onChange(clamped)
      setRaw(String(clamped).replace('.', ','))
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const current = parse(raw) ?? value ?? 0
      const next = current - step
      const clamped = min != null ? Math.max(min, next) : next
      onChange(clamped)
      setRaw(String(clamped).replace('.', ','))
    }
  }

  const displayValue = focused ? raw : (value != null ? fmt(value, decimals) : '')

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-sm text-muted-foreground pointer-events-none select-none z-10">
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onWheel={handleWheel}
          onKeyDown={handleKey}
          placeholder={displayPlaceholder}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-lg border border-input bg-background py-2 text-sm text-foreground text-right',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            prefix ? 'pl-8 pr-3' : suffix ? 'pl-3 pr-8' : 'px-3',
            error && 'border-destructive focus-visible:ring-destructive',
          )}
        />
        {suffix && (
          <span className="absolute right-3 text-sm text-muted-foreground pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
