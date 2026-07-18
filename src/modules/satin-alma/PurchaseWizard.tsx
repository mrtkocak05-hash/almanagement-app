import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui'
import { purchasesApi } from '@/services/purchasesApi'
import type { PurchaseWizardData } from '@/types/purchases'
import { Step1Type } from './wizard/Step1Type'
import { Step2Info } from './wizard/Step2Info'
import { Step3Purchase } from './wizard/Step3Purchase'
import { Step4Partners } from './wizard/Step4Partners'
import { Step5Expenses } from './wizard/Step5Expenses'
import { StepInspection } from './wizard/StepInspection'
import { Step6Documents } from './wizard/Step6Documents'
import { cn } from '@/utils/cn'

const STEPS = ['Tür Seçimi', 'Varlık Bilgileri', 'Satın Alma', 'Hissedarlar', 'Giderler', 'Hasar / Eksper', 'Belgeler & Özet']

const INITIAL: PurchaseWizardData = {
  type: 'vehicle',
  asset_name: '',
  purchase_date: new Date().toISOString().split('T')[0],
  purchase_price: 0,
  currency: 'TRY',
  exchange_rate: 1,
  purchase_price_try: 0,
  share_percent: 100,
  partners: [],
  expenses: [],
  files: [],
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  exchangeRates: { usd_try: number; gold_gram_try: number }
}

export function PurchaseWizard({ open, onClose, onSuccess, exchangeRates }: Props) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<PurchaseWizardData>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // track explicit type selection (default 'vehicle' doesn't count as selected)
  const [typeSelected, setTypeSelected] = useState(false)

  useEffect(() => {
    if (open) { setStep(0); setData(INITIAL); setError(null); setTypeSelected(false) }
  }, [open])

  // Escape only closes — step-level Enter is handled in Step1Type
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

  const set = <K extends keyof PurchaseWizardData>(key: K, value: PurchaseWizardData[K]) =>
    setData(prev => ({ ...prev, [key]: value }))

  const canNext = () => {
    if (step === 0) return typeSelected
    if (step === 1) return !!data.asset_name.trim()
    if (step === 2) return data.purchase_price > 0 && !!data.purchase_date
    return true
  }

  function handleNext() {
    if (step === 0 && !typeSelected) {
      setError('Lütfen bir varlık türü seçiniz.')
      return
    }
    if (canNext()) { setError(null); setStep(prev => prev + 1) }
  }

  const handleFinish = async () => {
    if (!data.asset_name.trim()) { setError('Varlık adı zorunludur'); return }
    if (!data.purchase_price || data.purchase_price <= 0) { setError('Satın alma fiyatı zorunludur'); return }
    try {
      setSaving(true); setError(null)
      const { files: wizardFiles, ...rest } = data
      const purchase = await purchasesApi.create({ ...rest, complete: true })
      if (wizardFiles.length > 0) {
        await Promise.all(wizardFiles.map(wf => purchasesApi.uploadDocument(purchase.id, wf.file, wf.doc_type, wf.title)))
      }
      onSuccess(); onClose()
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

      <div className="relative w-full max-w-3xl m-auto rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh]"
        style={{ backgroundColor: 'var(--color-background)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-foreground">Yeni Satın Alma</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Adım {step + 1} / {STEPS.length} — {STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center">
            {STEPS.map((_s, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                {/* Step node */}
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
                {/* Connector line */}
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
          {step === 0 && (
            <Step1Type
              selected={typeSelected ? data.type : null}
              onChange={t => { set('type', t); set('asset_name', ''); setTypeSelected(true); setError(null) }}
              onConfirm={() => { if (typeSelected) { setError(null); setStep(1) } }}
            />
          )}
          {step === 1 && <Step2Info data={data} set={set} />}
          {step === 2 && <Step3Purchase data={data} set={set} exchangeRates={exchangeRates} />}
          {step === 3 && <Step4Partners data={data} set={set} />}
          {step === 4 && <Step5Expenses data={data} set={set} exchangeRates={exchangeRates} />}
          {step === 5 && <StepInspection data={data} set={set} />}
          {step === 6 && <Step6Documents data={data} set={set} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0">
          <div className="flex-1">
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(prev => prev - 1)} disabled={saving}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Geri
              </Button>
            ) : (
              <Button variant="ghost" onClick={onClose}>İptal</Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext}>
                İleri <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving}>
                {saving ? 'Kaydediliyor...' : '✓ Satın Almayı Tamamla'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
