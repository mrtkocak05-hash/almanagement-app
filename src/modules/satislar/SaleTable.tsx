import { Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { ASSET_TYPE_LABELS } from '@/types/assets'
import { getScoreLabel, getScoreColor } from '@/types/sales'
import type { Sale } from '@/types/sales'

interface Props {
  sales: Sale[]
  total: number
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  onView: (s: Sale) => void
  onDelete: (s: Sale) => void
}

const STATUS_BADGE: Record<string, 'default' | 'success' | 'warning'> = {
  draft: 'warning',
  completed: 'success',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Taslak',
  completed: 'Tamamlandı',
}

export function SaleTable({ sales, total, page, totalPages, onPageChange, onView, onDelete }: Props) {
  if (sales.length === 0) {
    return (
      <div className="border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
        Henüz satış kaydı bulunmuyor.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Satış No</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Varlık</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Alıcı</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Toplam Maliyet</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Satış Fiyatı</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Net Kâr</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">ROI</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Süre</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Skor</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sales.map(s => (
              <tr
                key={s.id}
                onClick={() => onView(s)}
                className="border-b border-border last:border-0 hover:bg-accent/30 cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3 font-mono text-xs text-foreground">{s.sale_no}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground truncate max-w-[140px]">{s.asset_name}</p>
                  <p className="text-xs text-muted-foreground">{ASSET_TYPE_LABELS[s.asset_type]}</p>
                </td>
                <td className="px-4 py-3 text-foreground">{s.buyer_name ?? '—'}</td>
                <td className="px-4 py-3 text-right text-foreground">{formatCurrency(s.total_cost_try ?? 0)}</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">{formatCurrency(s.sale_price_try ?? s.sale_price)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={s.net_profit_try !== null && s.net_profit_try >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {s.net_profit_try !== null ? formatCurrency(s.net_profit_try) : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={s.roi_percent !== null && s.roi_percent >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {s.roi_percent !== null ? `%${s.roi_percent}` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                  {s.holding_days != null ? `${s.holding_days}g` : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  {s.investment_score != null ? (
                    <span className={`text-xs font-semibold ${getScoreColor(s.investment_score)}`}>
                      {s.investment_score} — {getScoreLabel(s.investment_score)}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={STATUS_BADGE[s.status] ?? 'default'}>{STATUS_LABEL[s.status] ?? s.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); onView(s) }}
                      className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(s) }}
                      className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Toplam {total} kayıt</span>
          <div className="flex items-center gap-1">
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="p-1 rounded hover:bg-accent disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">{page} / {totalPages}</span>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="p-1 rounded hover:bg-accent disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
