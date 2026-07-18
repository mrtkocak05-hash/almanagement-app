import { Trash2, Link } from 'lucide-react'
import type { Expense } from '@/types/expenses'
import {
  CATEGORY_COLOR, CATEGORY_BADGE_COLOR,
  PAYMENT_SOURCE_LABELS, EXPENSE_OWNER_LABELS, OWNER_COLOR,
} from '@/types/expenses'
import { EmptyState } from '@/components/ui'
import { cn } from '@/utils/cn'

const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)
const fmtRaw = (v: number, cur: string) => {
  if (cur === 'TRY') return null
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

interface Props {
  items: Expense[]
  total: number
  totalTry: number
  loading: boolean
  onDelete: (e: Expense) => void
}

export function ExpenseTable({ items, total, totalTry, loading, onDelete }: Props) {
  if (loading) return (
    <div className="text-sm text-muted-foreground text-center py-12">Yükleniyor...</div>
  )
  if (!items.length) return (
    <EmptyState icon={Link} title="Gider bulunamadı" description="Filtrelerinizi değiştirin veya yeni gider ekleyin" />
  )

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Totals row */}
      <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{total} kayıt</span>
        <span className="text-sm font-semibold text-red-400">{fmt(totalTry)}</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">No</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tarih</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Kategori</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Açıklama</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">İlgili</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Kaynak</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Sahip</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Tutar</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {items.map(e => {
            const borderClass = CATEGORY_COLOR[e.category] ?? 'border-l-zinc-400'
            const badgeClass = CATEGORY_BADGE_COLOR[e.category] ?? 'bg-zinc-400/15 text-zinc-400'
            const rawAmount = fmtRaw(e.amount, e.currency)
            const related = e.asset_name_ref ?? e.purchase_no ?? e.sale_no

            return (
              <tr
                key={e.id}
                className={cn(
                  'hover:bg-accent/30 transition-colors border-l-2',
                  borderClass,
                  e.expense_owner === 'personal' && 'opacity-70',
                )}
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.expense_no}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{e.expense_date}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', badgeClass)}>
                    {e.sub_category ? `${e.category} · ${e.sub_category}` : e.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground max-w-52 truncate">{e.description}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {related ? <span className="text-blue-400">{related}</span> : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {e.payment_source_name
                    ? `${PAYMENT_SOURCE_LABELS[e.payment_source]}: ${e.payment_source_name}`
                    : PAYMENT_SOURCE_LABELS[e.payment_source]}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium', OWNER_COLOR[e.expense_owner])}>
                    {EXPENSE_OWNER_LABELS[e.expense_owner]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="text-sm font-medium text-red-400 tabular-nums">{fmt(e.amount_try)}</p>
                  {rawAmount && (
                    <p className="text-xs text-muted-foreground">{rawAmount} {e.currency}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onDelete(e)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
