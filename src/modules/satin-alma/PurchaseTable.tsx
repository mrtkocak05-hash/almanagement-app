import { useNavigate } from 'react-router-dom'
import { Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'
import { ASSET_TYPE_LABELS } from '@/types/assets'
import type { Purchase } from '@/types/purchases'

interface Props {
  purchases: Purchase[]
  total: number
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  onDelete: (p: Purchase) => void
}

export function PurchaseTable({ purchases, total, page, totalPages, onPageChange, onDelete }: Props) {
  const navigate = useNavigate()

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <p className="text-muted-foreground text-sm">Henüz satın alma kaydı yok.</p>
        <p className="text-xs text-muted-foreground/60">Satın Alma Başlat butonuna tıklayın.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Satın Alma No</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Tarih</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Tür</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Varlık</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Satıcı</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Alım Fiyatı</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Ek Giderler</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Toplam Maliyet</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Hisse %</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Hisseme Düşen</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {purchases.map(p => (
              <tr
                key={p.id}
                className="hover:bg-accent/20 transition-colors group cursor-pointer"
                onClick={() => navigate(`/operasyon/satinalma/${p.id}`)}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-mono text-xs text-foreground font-medium">{p.purchase_no}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {p.purchase_date ? formatDate(p.purchase_date) : '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs text-muted-foreground">{ASSET_TYPE_LABELS[p.type]}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate max-w-[180px]">{p.asset_name}</p>
                    {(p.brand || p.model) && (
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {[p.brand, p.model, p.year].filter(Boolean).join(' ')}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                  {p.seller_name || '—'}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-foreground/80">
                  {p.purchase_price_try != null ? formatCurrency(p.purchase_price_try) : '—'}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-orange-500/80">
                  {p.total_expenses_try > 0 ? formatCurrency(p.total_expenses_try) : '—'}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-foreground">
                  {p.total_cost_try != null ? formatCurrency(p.total_cost_try) : '—'}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-muted-foreground">
                  {p.share_percent < 100 ? `%${p.share_percent}` : '—'}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-foreground/80">
                  {p.my_share_cost != null ? formatCurrency(p.my_share_cost) : '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={p.status === 'completed' ? 'success' : 'warning'}>
                    {p.status === 'completed' ? 'Tamamlandı' : 'Taslak'}
                  </Badge>
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/operasyon/satinalma/${p.id}`)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
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
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">{total} kayıt</p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent text-muted-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-foreground/70">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent text-muted-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
