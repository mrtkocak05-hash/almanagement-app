import { useState } from 'react'
import { Download, Trash2, FileText, FileImage, FileSpreadsheet, Film, Archive, File, AlertTriangle, Clock, CheckCircle, Eye, Cpu } from 'lucide-react'
import type { ArchiveDocument } from '@/types/archive'
import { STATUS_LABELS, STATUS_COLORS, EXPIRE_COLORS, MODULE_LABELS, OCR_STATUS_LABELS, OCR_STATUS_COLORS, getFileIconType, getRelatedLabel } from '@/types/archive'
import { EmptyState } from '@/components/ui'
import { cn } from '@/utils/cn'
import { archiveApi } from '@/services/archiveApi'
import { FilePreviewModal } from '@/components/FilePreviewModal'

const FILE_ICONS = {
  pdf: FileText,
  image: FileImage,
  excel: FileSpreadsheet,
  word: FileText,
  video: Film,
  zip: Archive,
  file: File,
}

const FILE_COLORS = {
  pdf: 'text-red-400',
  image: 'text-blue-400',
  excel: 'text-green-400',
  word: 'text-blue-300',
  video: 'text-purple-400',
  zip: 'text-yellow-400',
  file: 'text-muted-foreground',
}

function ExpireBadge({ doc }: { doc: ArchiveDocument }) {
  if (!doc.expire_date) return null
  const es = doc.expire_status
  if (!es) return null
  const Icon = es === 'expired' ? AlertTriangle : es === 'expiring_soon' ? Clock : CheckCircle
  return (
    <div className={cn('flex items-center gap-1 text-xs', EXPIRE_COLORS[es])}>
      <Icon className="w-3 h-3" />
      <span>{doc.expire_date}</span>
    </div>
  )
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface Props {
  items: ArchiveDocument[]
  total: number
  loading: boolean
  onDelete: (d: ArchiveDocument) => void
}

export function DocTable({ items, total, loading, onDelete }: Props) {
  const [previewDoc, setPreviewDoc] = useState<ArchiveDocument | null>(null)

  if (loading) return <div className="text-sm text-muted-foreground text-center py-12">Yükleniyor...</div>
  if (!items.length) return <EmptyState icon={File} title="Doküman bulunamadı" description="Yeni doküman yükleyin veya filtrelerinizi değiştirin" />

  return (
    <>
    <FilePreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/20">
        <span className="text-xs text-muted-foreground">{total} doküman</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-10"></th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Başlık</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Kategori</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Modül</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">İlgili Kayıt</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Yükleme</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Son Tarih</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Durum</th>
            <th className="w-20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {items.map(doc => {
            const iconType = getFileIconType(doc.mime_type)
            const IconComp = FILE_ICONS[iconType]
            const iconColor = FILE_COLORS[iconType]
            const related = getRelatedLabel(doc)
            const isImage = iconType === 'image'

            return (
              <tr key={doc.id} className={cn(
                'hover:bg-accent/30 transition-colors',
                doc.status === 'missing' && 'opacity-60 bg-red-500/5',
              )}>
                <td className="px-4 py-3">
                  {isImage && doc.path
                    ? <div className="w-8 h-8 rounded border border-border overflow-hidden"><img src={`/api/archive/${doc.id}/download`} className="w-full h-full object-cover" alt="" /></div>
                    : <div className={cn('w-8 h-8 rounded border border-border flex items-center justify-center', iconColor + '/10')}><IconComp className={cn('w-4 h-4', iconColor)} /></div>
                  }
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground max-w-40 truncate">{doc.title}</p>
                  {doc.original_name && doc.original_name !== doc.title && (
                    <p className="text-xs text-muted-foreground truncate max-w-40">{doc.original_name}</p>
                  )}
                  {doc.file_size && <p className="text-xs text-muted-foreground">{formatSize(doc.file_size)}</p>}
                  {doc.current_version > 1 && <p className="text-xs text-blue-400">v{doc.current_version}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-border/50 text-xs text-muted-foreground">{doc.category}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {MODULE_LABELS[doc.module] ?? doc.module}
                </td>
                <td className="px-4 py-3 text-xs text-blue-400 max-w-36 truncate">{related ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{doc.created_at?.split(' ')[0]}</td>
                <td className="px-4 py-3"><ExpireBadge doc={doc} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium w-fit', STATUS_COLORS[doc.status])}>
                      {STATUS_LABELS[doc.status]}
                    </span>
                    {doc.ocr_status && (
                      <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium w-fit', OCR_STATUS_COLORS[doc.ocr_status])}>
                        <Cpu className="w-2.5 h-2.5" />
                        {OCR_STATUS_LABELS[doc.ocr_status]}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {doc.status !== 'missing' && doc.path && (
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                        title="Önizle"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {doc.status !== 'missing' && doc.path && (
                      <a
                        href={archiveApi.downloadUrl(doc.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                        title="İndir"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => onDelete(doc)}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </>
  )
}
