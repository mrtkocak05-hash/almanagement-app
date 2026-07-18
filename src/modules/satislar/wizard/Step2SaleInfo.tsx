import { useEffect } from 'react'
import { Input } from '@/components/ui'
import { BUYER_TYPE_LABELS, type BuyerType } from '@/types/sales'
import { CURRENCY_LABELS, type PurchaseCurrency } from '@/types/purchases'
import type { SaleWizardData } from '@/types/sales'

interface Props {
  data: SaleWizardData
  set: <K extends keyof SaleWizardData>(key: K, value: SaleWizardData[K]) => void
  exchangeRates: { usd_try: number; gold_gram_try: number }
}

function Sel({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {children}
    </select>
  )
}

const DEFAULT_RATES: Record<PurchaseCurrency, (r: { usd_try: number; gold_gram_try: number }) => number> = {
  TRY: () => 1,
  USD: r => r.usd_try,
  EUR: r => r.usd_try * 1.08,
  Gold: r => r.gold_gram_try,
}

export function Step2SaleInfo({ data, set, exchangeRates }: Props) {
  // Auto-set exchange rate when currency changes
  useEffect(() => {
    const rate = DEFAULT_RATES[data.currency](exchangeRates)
    if (rate > 0) set('exchange_rate', rate)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.currency])

  // Auto-calc sale_price_try
  useEffect(() => {
    const priceTry = Math.round((data.sale_price || 0) * (data.exchange_rate || 1) * 100) / 100
    set('sale_price_try', priceTry)
    // Store current exchange rates for valuation
    if (exchangeRates.usd_try > 0) set('sale_usd_rate', exchangeRates.usd_try)
    if (exchangeRates.gold_gram_try > 0) set('sale_gold_rate', exchangeRates.gold_gram_try)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.sale_price, data.exchange_rate])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Satış Bilgileri</h2>
        <p className="text-sm text-muted-foreground mt-1">Satış fiyatı ve alıcı bilgilerini girin</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Satış Tarihi *</label>
          <Input type="date" value={data.sale_date} onChange={e => set('sale_date', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Ödeme Yöntemi</label>
          <Sel value={data.payment_method || ''} onChange={v => set('payment_method', v as SaleWizardData['payment_method'])}>
            <option value="">Seçin</option>
            <option value="cash">Nakit</option>
            <option value="bank">Banka</option>
            <option value="transfer">Havale/EFT</option>
            <option value="cheque">Çek</option>
            <option value="credit_card">Kredi Kartı</option>
          </Sel>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-5">
          <label className="text-xs text-muted-foreground mb-1 block">Satış Fiyatı *</label>
          <Input
            type="number"
            value={data.sale_price || ''}
            onChange={e => set('sale_price', Number(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        <div className="col-span-3">
          <label className="text-xs text-muted-foreground mb-1 block">Para Birimi</label>
          <Sel value={data.currency} onChange={v => set('currency', v as PurchaseCurrency)}>
            {(Object.keys(CURRENCY_LABELS) as PurchaseCurrency[]).map(c => (
              <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
            ))}
          </Sel>
        </div>
        <div className="col-span-4">
          <label className="text-xs text-muted-foreground mb-1 block">
            Kur {data.currency !== 'TRY' && <span className="text-foreground">({data.currency}/TRY)</span>}
          </label>
          <Input
            type="number"
            value={data.exchange_rate || ''}
            onChange={e => set('exchange_rate', Number(e.target.value) || 1)}
            disabled={data.currency === 'TRY'}
          />
        </div>
      </div>

      {data.currency !== 'TRY' && data.sale_price_try > 0 && (
        <p className="text-xs text-muted-foreground -mt-2">
          TRY karşılığı: <span className="font-semibold text-foreground">
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(data.sale_price_try)}
          </span>
        </p>
      )}

      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alıcı Bilgileri</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Alıcı Adı</label>
            <Input value={data.buyer_name || ''} onChange={e => set('buyer_name', e.target.value)} placeholder="Ad Soyad / Firma" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Alıcı Türü</label>
            <Sel value={data.buyer_type || ''} onChange={v => set('buyer_type', v as BuyerType)}>
              <option value="">Seçin</option>
              {(Object.entries(BUYER_TYPE_LABELS) as [BuyerType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Sel>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Telefon</label>
          <Input value={data.buyer_phone || ''} onChange={e => set('buyer_phone', e.target.value)} placeholder="05XX XXX XX XX" />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Notlar</label>
        <textarea
          value={data.notes || ''}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          placeholder="Satışa dair notlar..."
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </div>
    </div>
  )
}
