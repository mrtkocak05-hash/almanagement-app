import { useRef } from 'react'
import { Upload, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'
import type { SaleWizardData, WizardSaleFile } from '@/types/sales'

const DOC_TYPES = ['Satış Sözleşmesi', 'Tapu Devir', 'Ruhsat', 'Makbuz', 'Fatura', 'Diğer']

interface Props {
  data: SaleWizardData
  set: <K extends keyof SaleWizardData>(key: K, value: SaleWizardData[K]) => void
}

export function Step4Documents({ data, set }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const newFiles: WizardSaleFile[] = Array.from(fileList).map(f => ({
      file: f, doc_type: 'Diğer', title: f.name.replace(/\.[^.]+$/, ''),
    }))
    set('files', [...data.files, ...newFiles])
  }

  const update = (i: number, key: keyof WizardSaleFile, value: string) => {
    const next = data.files.map((f, idx) => idx === i ? { ...f, [key]: value } : f)
    set('files', next)
  }

  const remove = (i: number) => set('files', data.files.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Belgeler</h2>
        <p className="text-sm text-muted-foreground mt-1">Satışa ait belgeleri ekleyin (isteğe bağlı)</p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-foreground/40 hover:bg-accent/20 transition-all"
      >
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">Dosya yükle veya sürükle</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, Word, görsel — max 30 MB</p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => addFiles(e.target.files)} accept=".pdf,.doc,.docx,image/*" />
      </div>

      {data.files.length > 0 && (
        <div className="space-y-2">
          {data.files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
              <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  value={f.title}
                  onChange={e => update(i, 'title', e.target.value)}
                  placeholder="Belge adı"
                  className="h-8 px-2 rounded border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <select
                  value={f.doc_type}
                  onChange={e => update(i, 'doc_type', e.target.value)}
                  className="h-8 px-2 rounded border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <span className="text-xs text-muted-foreground">{(f.file.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => remove(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {data.files.length === 0 && (
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="w-3.5 h-3.5 mr-1" /> Dosya Seç
        </Button>
      )}
    </div>
  )
}
