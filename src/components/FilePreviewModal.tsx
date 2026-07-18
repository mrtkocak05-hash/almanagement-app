import { useEffect } from 'react'
import { X, Download, ExternalLink, FileText } from 'lucide-react'
import { archiveApi } from '@/services/archiveApi'
import { getFileIconType } from '@/types/archive'
import type { ArchiveDocument } from '@/types/archive'

interface Props {
  doc: ArchiveDocument | null
  onClose: () => void
}

export function FilePreviewModal({ doc, onClose }: Props) {
  useEffect(() => {
    if (!doc) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [doc, onClose])

  if (!doc) return null

  const iconType = getFileIconType(doc.mime_type)
  const isImage = iconType === 'image'
  const isPdf = iconType === 'pdf'
  const hasFile = doc.status !== 'missing' && doc.path

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Panel */}
      <div
        className="relative z-10 flex flex-col rounded-xl border border-border shadow-2xl overflow-hidden"
        style={{ width: '90vw', maxWidth: 1100, height: '88vh', backgroundColor: 'var(--color-background)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground text-sm truncate">{doc.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{doc.category} · {doc.original_name}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {hasFile && (
              <>
                <a
                  href={archiveApi.previewUrl(doc.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Yeni Sekmede Aç
                </a>
                <a
                  href={archiveApi.downloadUrl(doc.id)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> İndir
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-muted/20 flex items-center justify-center">
          {!hasFile ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <FileText className="w-12 h-12 opacity-30" />
              <p className="text-sm">Dosya henüz yüklenmemiş</p>
            </div>
          ) : isPdf ? (
            <iframe
              src={archiveApi.previewUrl(doc.id)}
              className="w-full h-full border-0"
              title={doc.title}
            />
          ) : isImage ? (
            <img
              src={archiveApi.previewUrl(doc.id)}
              alt={doc.title}
              className="max-w-full max-h-full object-contain"
              style={{ padding: 16 }}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <FileText className="w-16 h-16 opacity-20" />
              <p className="text-sm">Bu dosya türü önizlenemiyor</p>
              <a
                href={archiveApi.downloadUrl(doc.id)}
                className="text-xs text-amber-500 hover:text-amber-400 underline"
              >
                Dosyayı indir
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
