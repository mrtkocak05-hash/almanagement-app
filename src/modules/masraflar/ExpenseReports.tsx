import { useExpenseReports } from '@/hooks/useExpenses'
import { CATEGORY_BADGE_COLOR, PAYMENT_SOURCE_LABELS, EXPENSE_OWNER_LABELS } from '@/types/expenses'
import { cn } from '@/utils/cn'

const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)
const MONTHS_TR = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

export function ExpenseReports() {
  const { data, loading } = useExpenseReports()

  if (loading) return <div className="text-sm text-muted-foreground text-center py-12">Yükleniyor...</div>
  if (!data) return null

  const maxCat = Math.max(...data.by_category.map(c => c.total), 1)
  const maxMonth = Math.max(...data.monthly.map(m => m.total), 1)
  const yearTotal = data.year_total

  return (
    <div className="space-y-6">
      {/* Year Total */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{data.year} Toplam Gider</p>
            <p className="text-3xl font-semibold text-red-400 mt-1">{fmt(yearTotal)}</p>
          </div>
          <div className="flex gap-6">
            {data.by_owner.map(o => (
              <div key={o.expense_owner} className="text-right">
                <p className="text-xs text-muted-foreground">{EXPENSE_OWNER_LABELS[o.expense_owner as keyof typeof EXPENSE_OWNER_LABELS] ?? o.expense_owner}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{fmt(o.total)}</p>
                <p className="text-xs text-muted-foreground">{o.cnt} kayıt</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Kategori Analizi</h3>
          <div className="space-y-3">
            {data.by_category.slice(0, 10).map(c => {
              const pct = Math.round((c.total / maxCat) * 100)
              const badgeClass = CATEGORY_BADGE_COLOR[c.category] ?? 'bg-zinc-400/15 text-zinc-400'
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', badgeClass)}>{c.category}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground">{fmt(c.total)}</span>
                      <span className="text-xs text-muted-foreground ml-2">{c.cnt} adet</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-red-500/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {data.by_category.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Veri yok</p>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Aylık Trend</h3>
          <div className="flex items-end gap-1.5 h-36">
            {data.monthly.map(m => {
              const monthNum = parseInt(m.month.split('-')[1])
              const pct = Math.round((m.total / maxMonth) * 100)
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex flex-col justify-end" style={{ height: '100px' }}>
                    <div
                      className="w-full bg-red-500/40 rounded-t group-hover:bg-red-500/60 transition-colors"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                      title={`${m.month}: ${fmt(m.total)}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{MONTHS_TR[monthNum]}</span>
                </div>
              )
            })}
            {data.monthly.length === 0 && (
              <p className="text-xs text-muted-foreground text-center w-full py-4">Veri yok</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* By Payment Source */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Ödeme Kaynağına Göre</h3>
          <div className="space-y-2">
            {data.by_payment_source.map(p => (
              <div key={p.payment_source} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <span className="text-sm text-foreground">
                  {PAYMENT_SOURCE_LABELS[p.payment_source as keyof typeof PAYMENT_SOURCE_LABELS] ?? p.payment_source}
                </span>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{fmt(p.total)}</p>
                  <p className="text-xs text-muted-foreground">{p.cnt} adet · %{yearTotal > 0 ? Math.round((p.total / yearTotal) * 100) : 0}</p>
                </div>
              </div>
            ))}
            {data.by_payment_source.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Veri yok</p>}
          </div>
        </div>

        {/* By Asset */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Varlığa Göre</h3>
          <div className="space-y-2">
            {data.by_asset.map(a => (
              <div key={a.related_asset_id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <span className="text-sm text-foreground truncate max-w-40">{a.asset_name}</span>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-400">{fmt(a.total)}</p>
                  <p className="text-xs text-muted-foreground">{a.cnt} gider</p>
                </div>
              </div>
            ))}
            {data.by_asset.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Varlığa bağlı gider yok</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
