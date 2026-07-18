import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'
import { ASSET_TYPE_LABELS, ASSET_STATUS_LABELS } from '@/types/assets'
import type { Asset } from '@/types/assets'
import { cn } from '@/utils/cn'

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  active: 'success',
  sold: 'warning',
  passive: 'default',
}

interface AssetTableProps {
  assets: Asset[]
  total: number
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  onEdit: (asset: Asset) => void
  onDelete: (asset: Asset) => void
}

export function AssetTable({ assets, total, page, totalPages, onPageChange, onEdit, onDelete }: AssetTableProps) {
  const navigate = useNavigate()

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <p className="text-muted-foreground text-sm">Henüz varlık eklenmemiş.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Varlık</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Tür</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Alış Tarihi</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Alış Bedeli</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Güncel Değer</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Hisse %</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assets.map(asset => (
              <tr
                key={asset.id}
                className="hover:bg-accent/20 transition-colors group cursor-pointer"
                onClick={() => navigate(`/varliklar/${asset.id}`)}
              >
                {/* Name + photo */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden border border-border">
                      {asset.main_photo ? (
                        <img
                          src={`/storage/${asset.main_photo}`}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: 'linear-gradient(135deg, #D97706 0%, #92400e 100%)' }}
                        >
                          {asset.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate max-w-[200px]">{asset.name}</p>
                      {(asset.brand || asset.model) && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {[asset.brand, asset.model, asset.year].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {asset.plate && (
                        <p className="text-xs text-muted-foreground font-mono">{asset.plate}</p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs text-muted-foreground">{ASSET_TYPE_LABELS[asset.type]}</span>
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {asset.purchase_date ? formatDate(asset.purchase_date) : '—'}
                </td>

                <td className="px-4 py-3 text-right whitespace-nowrap text-foreground/80">
                  {asset.purchase_price != null ? formatCurrency(asset.purchase_price) : '—'}
                </td>

                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {asset.current_value != null ? (
                    <span className={cn(
                      'font-medium',
                      asset.current_value > (asset.purchase_price ?? 0) ? 'text-green-500' : 'text-foreground',
                    )}>
                      {formatCurrency(asset.current_value)}
                    </span>
                  ) : '—'}
                </td>

                <td className="px-4 py-3 text-right whitespace-nowrap text-muted-foreground">
                  {asset.share_percent < 100 ? `%${asset.share_percent}` : '—'}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={STATUS_VARIANT[asset.status] ?? 'default'}>
                    {ASSET_STATUS_LABELS[asset.status]}
                  </Badge>
                </td>

                {/* Actions */}
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/varliklar/${asset.id}`)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Detay"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit(asset)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Düzenle"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(asset)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Sil"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">{total} sonuç</p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-foreground/70">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
