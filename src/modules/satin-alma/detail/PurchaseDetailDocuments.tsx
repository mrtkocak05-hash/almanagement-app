import { useRef, useState } from 'react'
import { Upload, FileText, Trash2, Download } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { purchasesApi } from '@/services/purchasesApi'
import { formatDate } from '@/utils/format'
import type { PurchaseDetail } from '@/types/purchases'

const DOC_TYPES = ['Fatura', 'Satış Sözleşmesi', 'Ruhsat', 'Sigorta', 'Ekspertiz', 'Fotoğraf', 'Diğer']

interface Props { purchase: PurchaseDetail; onRefresh: () => void }

export function PurchaseDetailDocuments({ purchase, onRefresh }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [docType, setDocType] = useState('Fatura')
  const [docTitle, setDocTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const docs = purchase.documents.filter(d => !d.deleted_at)

  const handleFileSelect = (files: FileList | null) => {
    if (!files?.[0]) return
    setSelectedFile(files[0])
    if (!docTitle) setDocTitle(files[0].name.replace(/\.[^/.]+$/, ''))
    setShowForm(true)
  }

  const handleUpload = async () => {
    if (!selectedFile || !docTitle.trim()) return
    try {
      setUploading(true)
      await purchasesApi.uploadDocument(purchase.id, selectedFile, docType, docTitle.trim())
      setShowForm(false); setSelectedFile(null); setDocTitle('')
      onRefresh()
    } finally { setUploading(false) }
  }

  const handleDelete = async (docId: number) => {
    if (!confirm('Bu belge silinsin mi?')) return
    await purchasesApi.deleteDocument(purchase.id, docId)
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{docs.length} belge</p>
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="w-3.5 h-3.5 mr-1" /> Belge Ekle
        </Button>
        <input ref={inputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={e => handleFileSelect(e.target.files)} />
      </div>

      {showForm && selectedFile && (
        <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
          <p className="text-xs text-muted-foreground">{selectedFile.name}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Belge Türü</label>
              <select value={docType} onChange={e => setDocType(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none">
                {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Başlık</label>
              <Input value={docTitle} onChange={e => setDocTitle(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setSelectedFile(null) }}>İptal</Button>
            <Button size="sm" onClick={handleUpload} disabled={uploading || !docTitle.trim()}>
              {uploading ? 'Yükleniyor...' : 'Yükle'}
            </Button>
          </div>
        </div>
      )}

      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Belge yok.</p>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card group">
              <FileText className="w-8 h-8 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground">{doc.type} · {formatDate(doc.created_at)}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={`/storage/${doc.path}`} target="_blank" rel="noreferrer"
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => handleDelete(doc.id)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
