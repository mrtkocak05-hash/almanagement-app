import { useRef } from 'react'
import { Upload, FileText, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import type { PurchaseWizardData, WizardFile } from '@/types/purchases'

const DOC_TYPES = ['Fatura', 'Ruhsat', 'Eksper', 'Sigorta', 'Kasko', 'Noter', 'Tapu', 'Diğer']

interface Props {
  data: PurchaseWizardData
  set: <K extends keyof PurchaseWizardData>(key: K, value: PurchaseWizardData[K]) => void
}

export function Step6Documents({ data, set }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const files = data.files

  const totalExpTry = data.expenses.reduce((s, e) => s + (e.amount_try || 0), 0)
  const totalCost = (data.purchase_price_try || 0) + totalExpTry
  const myShareCost = totalCost * (data.share_percent || 100) / 100

  const handleSelect = (selected: FileList | null) => {
    if (!selected) return
    const newFiles: WizardFile[] = Array.from(selected).map(file => ({
      file,
      doc_type: 'Diğer',
      title: file.name.replace(/\.[^/.]+$/, ''),
    }))
    set('files', [...files, ...newFiles])
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleSelect(e.dataTransfer.files)
  }

  const removeFile = (i: number) => set('files', files.filter((_, idx) => idx !== i))

  const updateFile = (i: number, key: 'doc_type' | 'title', value: string) => {
    const next = files.map((f, idx) => idx === i ? { ...f, [key]: value } : f)
    set('files', next)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Belgeler ve Özet</h2>
        <p className="text-sm text-muted-foreground mt-1">Belgeleri ekleyin ve satın almayı tamamlayın</p>
      </div>

      {/* Final summary */}
      <div className="p-5 rounded-xl border border-border bg-muted/20 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Özet</p>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Varlık" value={data.asset_name || '—'} />
          <Row label="Tür" value={data.type} />
          <Row label="Satın Alma Fiyatı" value={formatCurrency(data.purchase_price_try || 0)} />
          <Row label="Toplam Gider" value={formatCurrency(totalExpTry)} />
          <Row label="Toplam Maliyet" value={formatCurrency(totalCost)} bold />
          <Row label="Hisseme Düşen" value={formatCurrency(myShareCost)} bold />
          {data.partners.length > 0 && <Row label="Ortak Sayısı" value={String(data.partners.length)} />}
          {data.expenses.length > 0 && <Row label="Gider Sayısı" value={String(data.expenses.length)} />}
        </div>
      </div>

      {/* Document upload */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Belgeler <span className="text-muted-foreground font-normal">(isteğe bağlı)</span></p>
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5 mr-1" /> Dosya Ekle
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,image/*"
            className="hidden"
            onChange={e => handleSelect(e.target.files)}
          />
        </div>

        {files.length === 0 ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/20 dark:hover:bg-amber-900/10 transition-all"
          >
            <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Dosyaları buraya sürükleyin veya tıklayın</p>
            <p className="text-xs text-muted-foreground/60 mt-1">PDF, JPG, PNG</p>
          </div>
        ) : (
          <div
            className="space-y-2"
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          >
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <FileText className="w-7 h-7 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    value={f.title}
                    onChange={e => updateFile(i, 'title', e.target.value)}
                    placeholder="Belge adı"
                    className="h-8 px-2 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <select
                    value={f.doc_type}
                    onChange={e => updateFile(i, 'doc_type', e.target.value)}
                    className="h-8 px-2 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
        <p className="text-xs text-green-600 dark:text-green-400">
          Tamamla'ya bastığınızda varlık otomatik oluşturulacak ve Dashboard güncellenecektir.
        </p>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-foreground' : 'text-foreground/80'}`}>{value}</span>
    </div>
  )
}
