import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { X, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SmartSearchOption {
  value: string | number
  label: string
  sub?: string
}

interface SmartSearchProps {
  value?: string | number | null
  onChange: (value: string | number | null, option?: SmartSearchOption) => void
  options: SmartSearchOption[]
  placeholder?: string
  label?: string
  error?: string
  hint?: string
  disabled?: boolean
  loading?: boolean
  clearable?: boolean
  required?: boolean
  emptyMessage?: string
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-primary">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}

export function SmartSearch({
  value,
  onChange,
  options,
  placeholder = 'Arayın veya seçin...',
  label,
  error,
  hint,
  disabled,
  loading,
  clearable = true,
  required,
  emptyMessage,
}: SmartSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(-1)
  const [mode, setMode] = useState<'all' | 'filter'>('all')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedOption = useMemo(
    () => options.find(o => String(o.value) === String(value ?? '')),
    [options, value]
  )

  const filtered = useMemo(() => {
    if (mode === 'all' && !query) return options.slice(0, 300)
    if (!query) return options.slice(0, 200)
    const q = query.toLowerCase()
    return options.filter(o =>
      o.label.toLowerCase().includes(q) ||
      o.sub?.toLowerCase().includes(q)
    ).slice(0, 200)
  }, [options, query, mode])

  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.children[highlighted] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlighted])

  useEffect(() => {
    if (!open || !listRef.current) return
    const idx = filtered.findIndex(o => String(o.value) === String(value ?? ''))
    if (idx >= 0) {
      setHighlighted(idx)
      setTimeout(() => {
        const item = listRef.current?.children[idx] as HTMLElement
        item?.scrollIntoView({ block: 'nearest' })
      }, 0)
    }
  }, [open]) // eslint-disable-line

  const closeDropdown = useCallback(() => {
    setOpen(false)
    setQuery('')
    setMode('all')
    setHighlighted(-1)
  }, [])

  const handleClickOut = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      closeDropdown()
    }
  }, [closeDropdown])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOut)
    return () => document.removeEventListener('mousedown', handleClickOut)
  }, [handleClickOut])

  function handleArrowMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    if (disabled) return
    if (open) {
      closeDropdown()
    } else {
      setMode('all')
      setQuery('')
      setHighlighted(-1)
      setOpen(true)
      inputRef.current?.focus()
    }
  }

  function handleFocus() {
    if (disabled || open) return
    setMode('filter')
    setQuery('')
    setHighlighted(-1)
    setOpen(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setMode('filter')
    setHighlighted(-1)
    if (!open) setOpen(true)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        setMode('all')
        setOpen(true)
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlighted(h => Math.min(h + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlighted(h => Math.max(h - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlighted >= 0 && filtered[highlighted]) {
          select(filtered[highlighted])
        }
        break
      case 'Escape':
        e.preventDefault()
        closeDropdown()
        inputRef.current?.blur()
        break
      case 'Tab':
        closeDropdown()
        break
    }
  }

  function select(option: SmartSearchOption) {
    onChange(option.value, option)
    closeDropdown()
    inputRef.current?.blur()
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null)
    setQuery('')
    inputRef.current?.focus()
  }

  const displayValue = open ? query : (selectedOption?.label ?? '')
  const hasValue = value != null && value !== ''
  const showQuery = mode === 'filter' && !!query

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={open && mode === 'all' ? 'Yazmaya başlayın...' : placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            'flex h-10 w-full rounded-lg border px-3 py-2 pr-16 text-sm',
            'bg-background text-foreground placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors',
            error
              ? 'border-destructive focus-visible:ring-destructive'
              : open
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-input',
          )}
        />

        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
          {clearable && hasValue && !disabled && (
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={clear}
              tabIndex={-1}
              className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onMouseDown={handleArrowMouseDown}
            tabIndex={-1}
            disabled={disabled}
            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform duration-150', open && 'rotate-180')} />
          </button>
        </div>

        {open && (
          <div
            className="absolute z-[9999] left-0 right-0 mt-1 rounded-lg border border-border shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-background)' }}
          >
            {loading && (
              <div className="px-3 py-3 text-sm text-muted-foreground">Veri yükleniyor...</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="px-3 py-3 text-sm text-muted-foreground">
                {query
                  ? `"${query}" için sonuç bulunamadı`
                  : emptyMessage ?? 'Kayıt bulunamadı.'}
              </div>
            )}
            {!loading && filtered.length > 0 && (
              <ul ref={listRef} className="max-h-60 overflow-y-auto overscroll-contain py-1">
                {filtered.map((opt, i) => {
                  const isSelected = String(opt.value) === String(value ?? '')
                  const isHighlighted = highlighted === i
                  return (
                    <li
                      key={opt.value}
                      onMouseDown={e => { e.preventDefault(); select(opt) }}
                      onMouseEnter={() => setHighlighted(i)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 cursor-pointer select-none transition-colors',
                        isHighlighted && !isSelected && 'bg-accent',
                        isSelected && 'bg-primary/10',
                      )}
                    >
                      <span className={cn(
                        'flex-1 text-sm truncate',
                        isSelected ? 'font-semibold text-foreground' : 'text-foreground',
                      )}>
                        <Highlight text={opt.label} query={showQuery ? query : ''} />
                      </span>
                      {opt.sub && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">{opt.sub}</span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            {filtered.length >= 200 && query && (
              <div className="px-3 py-1.5 text-xs text-muted-foreground border-t border-border">
                Daraltmak için yazmaya devam edin
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
