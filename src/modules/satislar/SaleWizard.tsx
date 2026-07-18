import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui'
import { salesApi } from '@/services/salesApi'
import type { SaleWizardData } from '@/types/sales'
import { Step1Asset } from './wizard/Step1Asset'
import { Step2SaleInfo } from './wizard/Step2SaleInfo'
import { Step3Expenses } from './wizard/Step3Expenses'
import { Step4Documents } from './wizard/Step4Documents'
import { Step5Summary } from './wizard/Step5Summary'
import { cn } from '@/utils/cn'

const STEPS = ['Varlık Seçimi', 'Satış Bilgileri', 'Satış Giderleri', 'Belgeler', 'Yatırım Özeti']

const INITIAL: SaleWizardData = {
  asset_id: null,
  asset_name: '',
  asset_type: null,
  purchase_id: null,
  purchase_price_try: 0,
  total_purchase_expenses_try: 0,
  total_cost_try: 0,
  share_percent: 100,
  purchase_date: null,
  sale_date: new Date().toISOString().split('T')[0],
  sale_price: 0,
  currency: 'TRY',
  exchange_rate: 1,
  sale_price_try: 0,
  expenses: [],
  files: [],
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  exchangeRates: { usd_try: number; gold_gram_try: number }
}

export function SaleWizard({ open, onClose, onSuccess, exchangeRates }: Props) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<SaleWizardData>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setStep(0); setData(INITIAL); setError(null) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const set = <K extends keyof SaleWizardData>(key: K, value: SaleWizardData[K]) =>
    setData(prev => ({ ...prev, [key]: value }))

  const setMany = (partial: Partial<SaleWizardData>) =>
    setData(prev => ({ ...prev, ...partial }))

  const canNext = () => {
    if (step === 0) return !!data.asset_id
    if (step === 1) return data.sale_price > 0 && !!data.sale_date
    return true
  }

  const handleFinish = async () => {
    if (!data.asset_id) { setError('Varlık seçimi zorunludur'); return }
    if (!data.sale_price || data.sale_price <= 0) { setError('Satış fiyatı zorunludur'); return }

    try {
      setSaving(true)
      setError(null)

      const { files: wizardFiles, ...rest } = data
      const sale = await salesApi.create({ ...rest, complete: true })

      if (wizardFiles.length > 0) {
        await Promise.all(
          wizardFiles.map(wf => salesApi.uploadDocument(sale.id, wf.file, wf.doc_type, wf.title))
        )
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.70)' }} onClick={onClose} />

      <div className="relative w-full max-w-2xl m-auto rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh]" style={{ backgroundColor: 'var(--color-background)', opacity: 1 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-foreground">Yeni Satış</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Adım {step + 1} / {STEPS.length} — {STEPS[step]}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center">
            {STEPS.map((_s, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => i < step && setStep(i)}
                    title={STEPS[i]}
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                      i < step
                        ? 'border-2 border-amber-600 bg-white text-amber-600 cursor-pointer hover:bg-amber-50'
                        : i === step
                          ? 'text-white shadow-md cursor-default'
                          : 'bg-muted text-muted-foreground cursor-default',
                    )}
                    style={i === step ? { backgroundColor: '#D97706' } : undefined}
                  >
                    {i < step ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
                  </button>
                  <span className={cn(
                    'text-[10px] font-medium whitespace-nowrap leading-none',
                    i === step ? 'text-amber-600' : i < step ? 'text-amber-600' : 'text-muted-foreground/40',
                  )}>
                    {STEPS[i]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'h-0.5 flex-1 mx-1.5 mb-4 rounded-full transition-colors',
                    i < step ? 'bg-amber-600' : 'bg-border',
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && <Step1Asset data={data} set={set} setMany={setMany} onConfirm={() => { if (data.asset_id) setStep(1) }} />}
          {step === 1 && <Step2SaleInfo data={data} set={set} exchangeRates={exchangeRates} />}
          {step === 2 && <Step3Expenses data={data} set={set} exchangeRates={exchangeRates} />}
          {step === 3 && <Step4Documents data={data} set={set} />}
          {step === 4 && <Step5Summary data={data} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0">
          <div className="flex-1">
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(p => p - 1)} disabled={saving}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Geri
              </Button>
            ) : (
              <Button variant="ghost" onClick={onClose}>İptal</Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={() => { if (canNext()) setStep(p => p + 1) }} disabled={!canNext()}>
                İleri <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving}>
                {saving ? 'Kaydediliyor...' : '✓ Satışı Tamamla'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
