import { FileText, Trash2, Download } from 'lucide-react'
import { salesApi } from '@/services/salesApi'
import type { SaleDetail } from '@/types/sales'

interface Props {
  sale: SaleDetail
  onRefresh: () => void
}

export function SaleDetailDocuments({ sale, onRefresh }: Props) {
  const active = sale.documents.filter(d => !d.deleted_at)

  const handleDelete = async (docId: number) => {
    if (!confirm('Bu belge silinsin mi?')) return
    await salesApi.deleteDocument(sale.id, docId)
    onRefresh()
  }

  if (active.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Belge bulunmuyor.</p>
  }

  return (
    <div className="space-y-2">
      {active.map(doc => (
        <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors">
          <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
            <p className="text-xs text-muted-foreground">{doc.type} · {new Date(doc.created_at).toLocaleDateString('tr-TR')}</p>
          </div>
          <a
            href={doc.path}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={() => handleDelete(doc.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
