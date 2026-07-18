import { formatCurrency } from '@/utils/format'
import { ASSET_TYPE_LABELS } from '@/types/assets'
import { BUYER_TYPE_LABELS } from '@/types/sales'
import type { SaleDetail } from '@/types/sales'

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <div className="grid grid-cols-3 gap-4">{children}</div>
    </div>
  )
}

export function SaleDetailGeneral({ sale }: { sale: SaleDetail }) {
  return (
    <div className="space-y-4">
      <Section title="Satış Özeti">
        <Field label="Satış No" value={sale.sale_no} />
        <Field label="Varlık" value={sale.asset_name} />
        <Field label="Varlık Türü" value={ASSET_TYPE_LABELS[sale.asset_type]} />
        <Field label="Satış Tarihi" value={sale.sale_date} />
        <Field label="Durum" value={sale.status === 'completed' ? 'Tamamlandı' : 'Taslak'} />
        <Field label="Ödeme Yöntemi" value={
          sale.payment_method === 'cash' ? 'Nakit' :
          sale.payment_method === 'bank' ? 'Banka' :
          sale.payment_method === 'transfer' ? 'Havale/EFT' :
          sale.payment_method === 'cheque' ? 'Çek' :
          sale.payment_method === 'credit_card' ? 'Kredi Kartı' :
          sale.payment_method ?? undefined
        } />
      </Section>

      <Section title="Alıcı Bilgileri">
        <Field label="Alıcı Adı" value={sale.buyer_name} />
        <Field label="Alıcı Türü" value={sale.buyer_type ? BUYER_TYPE_LABELS[sale.buyer_type] : undefined} />
        <Field label="Telefon" value={sale.buyer_phone} />
      </Section>

      <Section title="Finansal Detay">
        <Field label="Toplam Alım Maliyeti" value={formatCurrency(sale.total_cost_try ?? 0)} />
        <Field label="Alım Giderleri" value={formatCurrency(sale.total_purchase_expenses_try)} />
        <Field label="Hisse Oranı" value={`%${sale.share_percent}`} />
        <Field label="Satış Fiyatı (TRY)" value={formatCurrency(sale.sale_price_try ?? sale.sale_price)} />
        <Field label="Satış Giderleri" value={formatCurrency(sale.total_sale_expenses_try)} />
        <Field label="Net Satış" value={formatCurrency(sale.net_sale_try ?? 0)} />
        <div className="col-span-3 pt-2 border-t border-border">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Net Kâr / Zarar" value={sale.net_profit_try !== null ? formatCurrency(sale.net_profit_try) : undefined} />
            <Field label="Hisseme Düşen Kâr" value={sale.share_profit_try !== null ? formatCurrency(sale.share_profit_try) : undefined} />
            <Field label="Elde Tutma Süresi" value={sale.holding_days != null ? `${sale.holding_days} gün` : undefined} />
          </div>
        </div>
      </Section>

      {sale.notes && (
        <div className="border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notlar</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{sale.notes}</p>
        </div>
      )}
    </div>
  )
}
