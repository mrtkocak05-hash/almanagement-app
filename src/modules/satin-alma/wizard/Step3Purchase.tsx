import { useEffect } from 'react'
import { Input, NumberInput, DatePicker, SmartSearch } from '@/components/ui'
import { CURRENCY_LABELS, SELLER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/types/purchases'
import type { PurchaseWizardData, PurchaseCurrency, SellerType, PaymentMethod } from '@/types/purchases'
import { useCities, useDistricts } from '@/hooks/useMasterData'
import { ResearchComparison } from '@/modules/piyasa-arastirma/ResearchComparison'
import { AIValuationWidget } from '@/modules/satin-alma/components/VehicleIntelligence/AIValuationWidget'

type F = PurchaseWizardData
type SetFn = <K extends keyof F>(key: K, value: F[K]) => void
interface Props { data: F; set: SetFn; exchangeRates: { usd_try: number; gold_gram_try: number } }

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-foreground mb-1.5">{children}</label>
}

function Sel({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
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

export function Step3Purchase({ data, set, exchangeRates }: Props) {
  const { options: cityOpts } = useCities()
  const { options: districtOpts, loading: districtsLoading } = useDistricts(data.seller_province || null)

  useEffect(() => {
    const rate = DEFAULT_RATES[data.currency](exchangeRates)
    if (rate > 0) set('exchange_rate', rate)
  }, [data.currency]) // eslint-disable-line

  useEffect(() => {
    const tryAmount = Math.round((data.purchase_price || 0) * (data.exchange_rate || 1) * 100) / 100
    set('purchase_price_try', tryAmount)
  }, [data.purchase_price, data.exchange_rate]) // eslint-disable-line

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Satın Alma Bilgileri</h2>
        <p className="text-sm text-muted-foreground mt-1">Alım fiyatı, satıcı ve ödeme detayları</p>
      </div>

      {/* Fiyat */}
      <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fiyat</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Para Birimi</Label>
            <Sel value={data.currency} onChange={v => set('currency', v as PurchaseCurrency)}>
              {(Object.keys(CURRENCY_LABELS) as PurchaseCurrency[]).map(c => (
                <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
              ))}
            </Sel>
          </div>
          <NumberInput
            label="Satın Alma Fiyatı"
            value={data.purchase_price || null}
            onChange={v => set('purchase_price', v ?? 0)}
            decimals={0}
            placeholder="0"
          />
          {data.currency !== 'TRY' && (
            <NumberInput
              label={`Kur (1 ${data.currency} = ₺)`}
              value={data.exchange_rate || null}
              onChange={v => set('exchange_rate', v ?? 1)}
              decimals={4}
            />
          )}
          <div>
            <Label>TRY Karşılığı</Label>
            <div className="h-10 flex items-center px-3 rounded-lg bg-foreground/5 border border-border text-sm font-semibold text-foreground">
              ₺{(data.purchase_price_try || 0).toLocaleString('tr-TR')}
            </div>
          </div>
        </div>
      </div>

      {/* Piyasa Karşılaştırması */}
      {(data.purchase_price_try ?? 0) > 0 && (
        <ResearchComparison ourPrice={data.purchase_price_try ?? 0} />
      )}

      {/* AI Değerleme Widget */}
      {(data.purchase_price_try ?? 0) > 0 && (
        <AIValuationWidget
          price={data.purchase_price_try ?? 0}
          category={data.type as string}
          brand={data.brand}
          model={data.model}
          year={data.year}
        />
      )}

      {/* Tarih + Hisse */}
      <div className="grid grid-cols-2 gap-3">
        <DatePicker
          label="Satın Alma Tarihi"
          value={data.purchase_date || null}
          onChange={v => set('purchase_date', v ?? '')}
        />
        <NumberInput
          label="Hisse Oranım (%)"
          value={data.share_percent || null}
          onChange={v => set('share_percent' as keyof F, (v ?? 100) as F[keyof F])}
          decimals={0}
          min={1}
          max={100}
          suffix="%"
        />
      </div>

      {/* Ödeme */}
      <div>
        <Label>Ödeme Yöntemi</Label>
        <Sel value={data.payment_method ?? ''} onChange={v => set('payment_method', v as PaymentMethod)}>
          <option value="">Seçin</option>
          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(k => (
            <option key={k} value={k}>{PAYMENT_METHOD_LABELS[k]}</option>
          ))}
        </Sel>
      </div>

      {/* Satıcı */}
      <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Satıcı Bilgisi</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Satıcı Türü</Label>
            <Sel value={data.seller_type ?? ''} onChange={v => set('seller_type', v as SellerType)}>
              <option value="">Seçin</option>
              {(Object.keys(SELLER_TYPE_LABELS) as SellerType[]).map(k => (
                <option key={k} value={k}>{SELLER_TYPE_LABELS[k]}</option>
              ))}
            </Sel>
          </div>
          <Input label="Satıcı Adı / Firma" value={data.seller_name ?? ''} onChange={e => set('seller_name', e.target.value)} />
          <SmartSearch
            label="İl"
            value={data.seller_province ?? null}
            onChange={v => {
              set('seller_province', String(v ?? ''))
              set('seller_district', '')
            }}
            options={cityOpts}
            placeholder="İstanbul, Ankara..."
          />
          <SmartSearch
            label="İlçe"
            value={data.seller_district ?? null}
            onChange={v => set('seller_district', String(v ?? ''))}
            options={districtOpts}
            loading={districtsLoading}
            disabled={!data.seller_province}
            placeholder={data.seller_province ? 'İlçe seçin...' : 'Önce il seçin'}
            emptyMessage="İlçe bulunamadı."
          />
        </div>
      </div>

      {/* Notlar */}
      <div>
        <Label>Notlar</Label>
        <textarea
          value={data.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  )
}
