import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, FileImage, File, Cpu, ChevronDown, ChevronUp } from 'lucide-react'
import { Drawer, Button, Input } from '@/components/ui'
import { useArchiveContext } from '@/hooks/useArchive'
import { archiveApi } from '@/services/archiveApi'
import { DOC_CATEGORIES, MODULE_LABELS, getFileIconType } from '@/types/archive'
import type { DocModule, OcrExtractResult, ArchiveDocument } from '@/types/archive'
import { cn } from '@/utils/cn'

interface Props {
  open: boolean
  onClose: () => void
  onUploaded: () => void
}

interface FileEntry {
  file: File
  title: string
}

export function UploadDrawer({ open, onClose, onUploaded }: Props) {
  const { data: ctx } = useArchiveContext()
  const [files, setFiles] = useState<FileEntry[]>([])
  const [dragging, setDragging] = useState(false)
  const [category, setCategory] = useState('Diğer')
  const [module, setModule] = useState<DocModule>('archive')
  const [moduleId, setModuleId] = useState('')
  const [expireDate, setExpireDate] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<ArchiveDocument[]>([])
  const [ocrResults, setOcrResults] = useState<Record<number, OcrExtractResult>>({})
  const [ocrLoading, setOcrLoading] = useState<Record<number, boolean>>({})
  const [ocrExpanded, setOcrExpanded] = useState<Record<number, boolean>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setFiles([]); setCategory('Diğer'); setModule('archive')
    setModuleId(''); setExpireDate(''); setDescription(''); setError(null)
    setUploadedDocs([]); setOcrResults({}); setOcrLoading({}); setOcrExpanded({})
  }

  function handleClose() { reset(); onClose() }

  function addFiles(newFiles: File[]) {
    setFiles(prev => [
      ...prev,
      ...newFiles.map(f => ({ file: f, title: f.name.replace(/\.[^/.]+$/, '') })),
    ])
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    if (dropped.length) addFiles(dropped)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  function removeFile(idx: number) { setFiles(p => p.filter((_, i) => i !== idx)) }
  function updateTitle(idx: number, title: string) { setFiles(p => p.map((f, i) => i === idx ? { ...f, title } : f)) }

  // Module options for related record
  const moduleOptions = () => {
    if (module === 'asset') return (ctx?.assets ?? []).map(a => ({ id: a.id, label: a.name }))
    if (module === 'purchase') return (ctx?.purchases ?? []).map(p => ({ id: p.id, label: p.purchase_no }))
    if (module === 'sale') return (ctx?.sales ?? []).map(s => ({ id: s.id, label: s.sale_no }))
    if (module === 'expense') return (ctx?.expenses ?? []).map(e => ({ id: e.id, label: `${e.expense_no} — ${e.description}` }))
    return []
  }

  async function handleUpload() {
    if (!files.length) { setError('Dosya seçin'); return }
    setSaving(true); setError(null)
    try {
      const selectedId = moduleId ? Number(moduleId) : undefined
      const docs = await archiveApi.upload(
        files.map(f => f.file),
        {
          category,
          module,
          asset_id: module === 'asset' ? selectedId : undefined,
          purchase_id: module === 'purchase' ? selectedId : undefined,
          sale_id: module === 'sale' ? selectedId : undefined,
          expire_date: expireDate || undefined,
          description: description || undefined,
        }
      )
      setUploadedDocs(docs)
      setFiles([])
      onUploaded()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yükleme hatası')
    } finally { setSaving(false) }
  }

  async function handleOcrExtract(docId: number) {
    setOcrLoading(p => ({ ...p, [docId]: true }))
    try {
      const result = await archiveApi.ocrExtract(docId)
      setOcrResults(p => ({ ...p, [docId]: result }))
      setOcrExpanded(p => ({ ...p, [docId]: true }))
    } catch {
      // silently fail
    } finally {
      setOcrLoading(p => ({ ...p, [docId]: false }))
    }
  }

  const showModuleSelect = ['asset', 'purchase', 'sale', 'expense'].includes(module)
  const opts = moduleOptions()

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Doküman Yükle"
      subtitle="Sürükle-bırak veya dosya seç"
      width="lg"
      footer={
        <div className="flex items-center justify-between">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-3 ml-auto">
            <Button variant="outline" onClick={handleClose}>İptal</Button>
            <Button loading={saving} onClick={handleUpload} disabled={!files.length}>
              <Upload className="w-4 h-4" />{files.length ? `${files.length} Dosya Yükle` : 'Dosya Seç'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Drop Zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/40 hover:bg-accent/30',
          )}
        >
          <Upload className={cn('w-8 h-8 mx-auto mb-2', dragging ? 'text-primary' : 'text-muted-foreground')} />
          <p className="text-sm font-medium text-foreground">Dosyaları sürükleyin veya tıklayın</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, resim, Excel, Word, Video, ZIP • Maks 100 MB/dosya</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)) }}
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f, i) => {
              const iconType = getFileIconType(f.file.type)
              const IconComp = iconType === 'image' ? FileImage : iconType === 'pdf' ? FileText : File
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                  <IconComp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    value={f.title}
                    onChange={e => updateTitle(i, e.target.value)}
                    className="flex-1 h-8 text-sm"
                    placeholder="Doküman başlığı"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {(f.file.size / 1024).toFixed(0)} KB
                  </span>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Kategori</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
              {DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Son Geçerlilik Tarihi</label>
            <Input type="date" value={expireDate} onChange={e => setExpireDate(e.target.value)} />
          </div>
        </div>

        {/* Module Linking */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">İlgili Modül</label>
            <select value={module} onChange={e => { setModule(e.target.value as DocModule); setModuleId('') }}
              className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
              {(Object.keys(MODULE_LABELS) as DocModule[]).map(k => (
                <option key={k} value={k}>{MODULE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          {showModuleSelect && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Kayıt Seç</label>
              <select value={moduleId} onChange={e => setModuleId(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
                <option value="">—</option>
                {opts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Açıklama</label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Opsiyonel" />
        </div>

        {/* Uploaded docs — OCR panel */}
        {uploadedDocs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">Yüklendi — {uploadedDocs.length} dosya</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {uploadedDocs.map(doc => (
              <div key={doc.id} className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground flex-1 truncate">{doc.title}</span>
                  <button
                    onClick={() => handleOcrExtract(doc.id)}
                    disabled={ocrLoading[doc.id]}
                    className={cn(
                      'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all',
                      ocrResults[doc.id]
                        ? 'border-green-500/30 text-green-400 bg-green-500/10'
                        : 'border-amber-500/40 text-amber-500 hover:bg-amber-500/10',
                    )}
                  >
                    <Cpu className="w-3 h-3" />
                    {ocrLoading[doc.id] ? 'İşleniyor...' : ocrResults[doc.id] ? 'Tekrar Çıkar' : 'Otomatik Bilgi Çıkar'}
                  </button>
                  {ocrResults[doc.id] && (
                    <button
                      onClick={() => setOcrExpanded(p => ({ ...p, [doc.id]: !p[doc.id] }))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {ocrExpanded[doc.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {ocrResults[doc.id] && ocrExpanded[doc.id] && (
                  <div className="border-t border-border px-3 py-3 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Çıkarılan Veriler</span>
                      <span className="text-[10px] text-amber-500">%{Math.round((ocrResults[doc.id].confidence ?? 0) * 100)} güven</span>
                    </div>
                    {Object.entries(ocrResults[doc.id].extracted).map(([k, v]) => (
                      <div key={k} className="flex items-start gap-2">
                        <span className="text-xs text-muted-foreground w-28 flex-shrink-0 capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-foreground flex-1">{v}</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground/60 pt-1 italic">{ocrResults[doc.id].note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  )
}
