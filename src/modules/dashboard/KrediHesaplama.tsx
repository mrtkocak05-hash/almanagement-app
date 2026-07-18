import { useState, useMemo } from 'react'
import { Calculator, Car, Home, CreditCard } from 'lucide-react'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'

type LoanType = 'tasit' | 'konut' | 'ihtiyac'

interface LoanConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  defaultRate: number
  maxTerm: number
  color: string
}

const LOAN_TYPES: Record<LoanType, LoanConfig> = {
  tasit:   { label: 'Taşıt',   icon: Car,        defaultRate: 2.9, maxTerm: 48,  color: '#3B82F6' },
  konut:   { label: 'Konut',   icon: Home,       defaultRate: 1.9, maxTerm: 120, color: '#22c55e' },
  ihtiyac: { label: 'İhtiyaç', icon: CreditCard, defaultRate: 3.9, maxTerm: 36,  color: '#8B5CF6' },
}

function calcMonthly(principal: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return principal / months
  const r = monthlyRate / 100
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

function NumInput({ label, value, onChange, min, max, step = 1, prefix, suffix }: {
  label: string; value: number; onChange: (v: number) => void
  min: number; max: number; step?: number; prefix?: string; suffix?: string
}) {
  return (
    <div>
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-center gap-1 h-7 rounded-lg border border-border bg-muted/20 px-2">
        {prefix && <span className="text-[10px] text-muted-foreground flex-shrink-0">{prefix}</span>}
        <input
          type="number"
          className="flex-1 bg-transparent text-xs font-medium text-foreground outline-none tabular-nums min-w-0"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
        />
        {suffix && <span className="text-[10px] text-muted-foreground flex-shrink-0">{suffix}</span>}
      </div>
    </div>
  )
}

export function KrediHesaplama() {
  const [type, setType]     = useState<LoanType>('tasit')
  const [amount, setAmount] = useState(500000)
  const [term, setTerm]     = useState(24)
  const [rate, setRate]     = useState(LOAN_TYPES.tasit.defaultRate)

  function selectType(t: LoanType) {
    setType(t)
    setRate(LOAN_TYPES[t].defaultRate)
    setTerm(Math.min(term, LOAN_TYPES[t].maxTerm))
  }

  const { monthly, totalPay, totalInterest } = useMemo(() => {
    if (!amount || !term) return { monthly: 0, totalPay: 0, totalInterest: 0 }
    const m = calcMonthly(amount, rate, term)
    const total = m * term
    return { monthly: m, totalPay: total, totalInterest: total - amount }
  }, [amount, term, rate])

  const cfg = LOAN_TYPES[type]
  const Icon = cfg.icon

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#C9A84C' }}>
          <Calculator className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">Kredi Hesaplama</p>
          <p className="text-xs text-muted-foreground mt-0.5">Aylık taksit tahmini</p>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto min-h-0">
        {/* Type selector */}
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.entries(LOAN_TYPES) as [LoanType, LoanConfig][]).map(([key, c]) => {
            const BtnIcon = c.icon
            const active = type === key
            return (
              <button
                key={key}
                onClick={() => selectType(key)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 rounded-xl border text-[10px] font-semibold transition-all duration-150',
                  active
                    ? 'border-yellow-600 text-white'
                    : 'border-border text-muted-foreground hover:border-border/80',
                )}
                style={active ? { backgroundColor: '#C9A84C' } : undefined}
              >
                <BtnIcon className="w-3.5 h-3.5" />
                {c.label}
              </button>
            )
          })}
        </div>

        {/* Inputs */}
        <div className="space-y-2">
          <NumInput label="Kredi Tutarı"   value={amount} onChange={setAmount} min={10000} max={10000000} step={10000} prefix="₺" />
          <NumInput label="Vade (Ay)"      value={term}   onChange={setTerm}   min={3}    max={cfg.maxTerm} suffix="ay" />
          <NumInput label="Aylık Faiz (%)" value={rate}   onChange={setRate}   min={0.1}  max={20}          step={0.1}  suffix="%" />
        </div>

        {/* Result */}
        {monthly > 0 && (
          <div className="rounded-xl p-3 space-y-2"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Aylık Taksit</p>
              <span style={{ color: '#C9A84C' }}><Icon className="w-3 h-3" /></span>
            </div>
            <p className="text-xl font-black tabular-nums" style={{ color: '#C9A84C' }}>
              {formatCurrency(monthly, 'TRY')}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
              <div>
                <p className="text-[9px] text-muted-foreground">Toplam Ödenecek</p>
                <p className="text-[10px] font-bold text-foreground tabular-nums">{formatCurrency(totalPay, 'TRY')}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground">Toplam Faiz</p>
                <p className="text-[10px] font-bold text-red-400 tabular-nums">{formatCurrency(totalInterest, 'TRY')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
