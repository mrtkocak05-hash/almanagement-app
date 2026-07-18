import { useNavigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/format'
import { ASSET_TYPE_LABELS } from '@/types/assets'
import { SELLER_TYPE_LABELS, PAYMENT_METHOD_LABELS, CURRENCY_LABELS } from '@/types/purchases'
import type { PurchaseDetail, SellerType, PaymentMethod, PurchaseCurrency } from '@/types/purchases'

interface Props { purchase: PurchaseDetail }

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground w-40 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-foreground flex-1">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h4>
      <div className="bg-card rounded-lg border border-border px-4">{children}</div>
    </div>
  )
}

export function PurchaseDetailSummary({ purchase: p }: Props) {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Financial summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-muted/20 text-center">
          <p className="text-xs text-muted-foreground mb-1">Satın Alma Fiyatı</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(p.purchase_price_try ?? 0)}</p>
          {p.currency !== 'TRY' && (
            <p className="text-xs text-muted-foreground mt-0.5">{p.purchase_price} {p.currency} × {p.exchange_rate}</p>
          )}
        </div>
        <div className="p-4 rounded-xl border border-border bg-muted/20 text-center">
          <p className="text-xs text-muted-foreground mb-1">Ek Giderler</p>
          <p className="text-lg font-bold text-orange-500">{formatCurrency(p.total_expenses_try)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{p.expenses.filter(e => !e.deleted_at).length} kalem</p>
        </div>
        <div className="p-4 rounded-xl border border-foreground/20 bg-foreground/5 text-center">
          <p className="text-xs text-muted-foreground mb-1">Toplam Maliyet</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(p.total_cost_try ?? 0)}</p>
          {p.share_percent < 100 && (
            <p className="text-xs text-muted-foreground mt-0.5">Hissem: {formatCurrency(p.my_share_cost ?? 0)}</p>
          )}
        </div>
      </div>

      {/* Asset link */}
      {p.asset_id && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-green-500/20 bg-green-500/5">
          <div>
            <p className="text-xs text-muted-foreground">Oluşturulan Varlık</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{p.asset_name}</p>
          </div>
          <button
            onClick={() => navigate(`/varliklar/${p.asset_id}`)}
            className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Varlığa Git
          </button>
        </div>
      )}

      <Section title="Genel Bilgiler">
        <Row label="Satın Alma No" value={<span className="font-mono">{p.purchase_no}</span>} />
        <Row label="Tür" value={ASSET_TYPE_LABELS[p.type]} />
        <Row label="Satın Alma Tarihi" value={p.purchase_date ? formatDate(p.purchase_date) : null} />
        <Row label="Para Birimi" value={CURRENCY_LABELS[p.currency as PurchaseCurrency]} />
        <Row label="Ödeme Yöntemi" value={p.payment_method ? PAYMENT_METHOD_LABELS[p.payment_method as PaymentMethod] : null} />
        <Row label="Hisse Oranı" value={p.share_percent < 100 ? `%${p.share_percent}` : null} />
      </Section>

      <Section title="Satıcı Bilgileri">
        <Row label="Satıcı Türü" value={p.seller_type ? SELLER_TYPE_LABELS[p.seller_type as SellerType] : null} />
        <Row label="Satıcı" value={p.seller_name} />
        <Row label="İl / İlçe" value={[p.seller_province, p.seller_district].filter(Boolean).join(' / ')} />
      </Section>

      {p.notes && (
        <Section title="Notlar">
          <p className="py-3 text-sm text-foreground/80">{p.notes}</p>
        </Section>
      )}
    </div>
  )
}
