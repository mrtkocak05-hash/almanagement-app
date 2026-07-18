import { useState, useMemo } from 'react'
import { Car, Home, ShoppingBag } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/utils/cn'

type Tab = 'vehicle' | 'housing' | 'needs'

const TABS: { key: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'vehicle', label: 'Taşıt Kredisi', Icon: Car },
  { key: 'housing', label: 'Konut Kredisi', Icon: Home },
  { key: 'needs',   label: 'İhtiyaç Kredisi', Icon: ShoppingBag },
]

const DEFAULT_RATE: Record<Tab, number> = {
  vehicle: 3.49,
  housing: 2.89,
  needs:   4.99,
}
const DEFAULT_MONTHS: Record<Tab, number> = {
  vehicle: 48,
  housing: 120,
  needs:   24,
}

function fmt(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function calcLoan(principal: number, monthlyRate: number, months: number) {
  if (principal <= 0 || monthlyRate <= 0 || months <= 0) return null
  const r = monthlyRate / 100
  const factor = Math.pow(1 + r, months)
  const monthly = principal * (r * factor) / (factor - 1)
  const total = monthly * months
  const interest = total - principal
  return { monthly, total, interest }
}

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  suffix?: string
  placeholder?: string
}

function Field({ label, value, onChange, suffix, placeholder }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'flex h-9 w-full rounded-lg border border-input px-3 py-2 text-sm',
            'bg-background text-foreground placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            suffix && 'pr-10',
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      'flex items-center justify-between px-3 py-2 rounded-lg',
      highlight ? 'bg-primary/10' : 'bg-muted/40',
    )}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-semibold tabular-nums', highlight && 'text-primary')}>
        ₺ {value}
      </span>
    </div>
  )
}

export function LoanCalculator() {
  const [activeTab, setActiveTab] = useState<Tab>('vehicle')
  const [amount, setAmount] = useState('500000')
  const [rate, setRate] = useState(String(DEFAULT_RATE[activeTab]))
  const [months, setMonths] = useState(String(DEFAULT_MONTHS[activeTab]))

  function switchTab(tab: Tab) {
    setActiveTab(tab)
    setRate(String(DEFAULT_RATE[tab]))
    setMonths(String(DEFAULT_MONTHS[tab]))
  }

  const result = useMemo(() => calcLoan(
    Number(amount) || 0,
    Number(rate)   || 0,
    Number(months) || 0,
  ), [amount, rate, months])

  return (
    <Card className="p-6">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
        Kredi Hesaplayıcı
      </p>

      {/* Tabs */}
      <div className="flex rounded-lg border border-border overflow-hidden mb-5">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
              activeTab === key
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Field
          label="Tutar"
          value={amount}
          onChange={setAmount}
          suffix="₺"
          placeholder="0"
        />
        <Field
          label="Aylık Faiz"
          value={rate}
          onChange={setRate}
          suffix="%"
          placeholder="0.00"
        />
        <Field
          label="Vade"
          value={months}
          onChange={setMonths}
          suffix="ay"
          placeholder="0"
        />
      </div>

      {/* Results */}
      {result ? (
        <div className="flex flex-col gap-1.5">
          <ResultRow label="Aylık Taksit" value={fmt(result.monthly)} highlight />
          <ResultRow label="Toplam Ödeme" value={fmt(result.total)} />
          <ResultRow label="Toplam Faiz" value={fmt(result.interest)} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-20 rounded-lg bg-muted/40">
          <p className="text-xs text-muted-foreground">Tutar, faiz oranı ve vadeyi girin</p>
        </div>
      )}
    </Card>
  )
}
