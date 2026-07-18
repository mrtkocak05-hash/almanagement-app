import { useState, useRef } from 'react'
import {
  Car, ShieldCheck, Camera, Disc, Battery, Wrench, Gauge,
  Plus, Trash2, RefreshCw, Save, ChevronRight
} from 'lucide-react'
import { useVehicleIntelligence, useVehicleScore } from '@/hooks/useVehicleIntelligence'
import { vehicleIntelApi } from '@/services/vehicleIntelligenceApi'
import { HazarHaritasi } from './HazarHaritasi'
import type {
  PartStatus, VehicleTire, VehicleBattery as VehicleBatteryType,
  MaintenanceType,
} from '@/types/vehicleIntelligence'
import {
  MAINTENANCE_LABELS, PART_LABELS,
} from '@/types/vehicleIntelligence'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

interface Props {
  assetId: number
}

const TABS = [
  { id: 'hasar',   label: 'Hasar Haritası', icon: Car },
  { id: 'eksper',  label: 'Eksper',          icon: ShieldCheck },
  { id: 'foto',    label: 'Fotoğraflar',     icon: Camera },
  { id: 'lastik',  label: 'Lastikler',       icon: Disc },
  { id: 'aku',     label: 'Akü',             icon: Battery },
  { id: 'bakim',   label: 'Bakım',           icon: Wrench },
  { id: 'skor',    label: 'AI Skor',         icon: Gauge },
]

const TIRE_POSITIONS: { key: VehicleTire['position']; label: string }[] = [
  { key: 'on_sol',   label: 'Ön Sol' },
  { key: 'on_sag',   label: 'Ön Sağ' },
  { key: 'arka_sol', label: 'Arka Sol' },
  { key: 'arka_sag', label: 'Arka Sağ' },
]

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const v = value ?? 0
  const color = v >= 80 ? '#10B981' : v >= 60 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${v}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{v}</span>
    </div>
  )
}

function GaugeCircle({ value }: { value: number | null }) {
  const v = value ?? 0
  const color = v >= 80 ? '#10B981' : v >= 60 ? '#F59E0B' : '#EF4444'
  const r = 40, cx = 50, cy = 50
  const circ = 2 * Math.PI * r
  const offset = circ - (v / 100) * circ
  return (
    <svg width={100} height={100} className="mx-auto">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={10} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset .6s ease' }}
      />
      <text x={cx} y={cy + 5} textAnchor="middle" fill={color} fontSize={18} fontWeight="bold">{v}</text>
    </svg>
  )
}

export function VehicleIntelligencePanel({ assetId }: Props) {
  const [activeTab, setActiveTab] = useState('hasar')
  const { data, loading, error, refetch, setData } = useVehicleIntelligence(assetId)
  const { score, loading: scoreLoading, generate } = useVehicleScore(assetId)
  const [saving, setSaving] = useState(false)
  const [expertForm, setExpertForm] = useState({
    expert_firm: '', expert_date: '', expert_no: '', expert_note: '', expert_score: '',
  })
  const [battForm, setBattForm] = useState<Partial<VehicleBatteryType>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadPart, setUploadPart] = useState('genel')
  const [uploading, setUploading] = useState(false)

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
      Yükleniyor...
    </div>
  )
  if (error) return (
    <div className="text-sm text-destructive py-8 text-center">{error}</div>
  )

  const parts = data?.parts ?? []
  const tires = data?.tires ?? []
  const battery = data?.battery ?? null
  const maintenance = data?.maintenance ?? []
  const photos = data?.photos ?? []

  // ── Part change ─────────────────────────────────────────────────────────────
  async function handlePartChange(partKey: string, status: PartStatus) {
    const updated = parts.filter(p => p.part_key !== partKey)
    updated.push({ id: 0, vehicle_intelligence_id: data?.id ?? 0, part_key: partKey, status, notes: null })
    try {
      const res = await vehicleIntelApi.saveParts(assetId, updated.map(p => ({
        part_key: p.part_key, status: p.status, notes: p.notes
      })))
      setData(res)
    } catch (_) {}
  }

  // ── Expert save ──────────────────────────────────────────────────────────────
  async function saveExpert() {
    setSaving(true)
    try {
      const res = await vehicleIntelApi.saveExpert(assetId, {
        ...expertForm,
        expert_score: expertForm.expert_score ? Number(expertForm.expert_score) : undefined,
      })
      setData(res)
    } catch (_) {}
    setSaving(false)
  }

  // ── Tire change ──────────────────────────────────────────────────────────────
  async function saveTire(pos: VehicleTire['position'], field: keyof VehicleTire, value: string | number) {
    const existing = tires.find(t => t.position === pos) ?? { position: pos }
    const updated  = { ...existing, [field]: value }
    const all      = tires.filter(t => t.position !== pos)
    all.push(updated as VehicleTire)
    try {
      const res = await vehicleIntelApi.saveTires(assetId, all)
      setData(res)
    } catch (_) {}
  }

  // ── Battery save ─────────────────────────────────────────────────────────────
  async function saveBattery() {
    setSaving(true)
    try {
      const res = await vehicleIntelApi.saveBattery(assetId, battForm)
      setData(res)
    } catch (_) {}
    setSaving(false)
  }

  // ── Photo upload ─────────────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await vehicleIntelApi.uploadPhoto(assetId, file, uploadPart)
      await refetch()
    } catch (_) {}
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function deletePhoto(photoId: number) {
    try {
      await vehicleIntelApi.deletePhoto(photoId)
      await refetch()
    } catch (_) {}
  }

  // ── Maintenance ──────────────────────────────────────────────────────────────
  async function addMaintenance(type: MaintenanceType) {
    try {
      await vehicleIntelApi.addMaintenance(assetId, { type })
      await refetch()
    } catch (_) {}
  }

  async function deleteMaint(id: number) {
    try {
      await vehicleIntelApi.deleteMaintenance(id)
      await refetch()
    } catch (_) {}
  }

  // ── AI Score ─────────────────────────────────────────────────────────────────
  async function handleGenerateScore() {
    await generate()
    await refetch()
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-border">
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium flex-shrink-0 border-b-2 transition-colors ${
                active
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="p-4">
        {/* ── Hasar Haritası ── */}
        {activeTab === 'hasar' && (
          <HazarHaritasi parts={parts} onPartChange={handlePartChange} />
        )}

        {/* ── Eksper ── */}
        {activeTab === 'eksper' && (
          <div className="max-w-md space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Eksper Bilgileri</h3>
            {([
              { label: 'Firma',   key: 'expert_firm',  type: 'text' },
              { label: 'Tarih',   key: 'expert_date',  type: 'date' },
              { label: 'No',      key: 'expert_no',    type: 'text' },
              { label: 'Puan',    key: 'expert_score', type: 'number' },
            ] as const).map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                <input
                  type={f.type}
                  value={(expertForm as Record<string, string>)[f.key] ?? data?.[f.key as keyof typeof data] ?? ''}
                  onChange={e => setExpertForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder={f.label}
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Not</label>
              <textarea
                rows={3}
                value={expertForm.expert_note ?? data?.expert_note ?? ''}
                onChange={e => setExpertForm(prev => ({ ...prev, expert_note: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-input text-foreground focus:outline-none resize-none"
              />
            </div>
            <button
              onClick={saveExpert}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        )}

        {/* ── Fotoğraflar ── */}
        {activeTab === 'foto' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <select
                value={uploadPart}
                onChange={e => setUploadPart(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-border bg-input text-foreground focus:outline-none"
              >
                <option value="genel">Genel</option>
                {Object.entries(PART_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <label className={`flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Plus className="w-4 h-4" />
                {uploading ? 'Yükleniyor...' : 'Fotoğraf Ekle'}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            {photos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Henüz fotoğraf eklenmedi.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map(ph => (
                  <div key={ph.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted">
                    <img
                      src={`${API_BASE}/storage/${ph.file_path}`}
                      alt={ph.original_name ?? 'photo'}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate">
                      {PART_LABELS[ph.part_key] ?? ph.part_key}
                    </div>
                    <button
                      onClick={() => deletePhoto(ph.id)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Lastikler ── */}
        {activeTab === 'lastik' && (
          <div className="grid grid-cols-2 gap-3">
            {TIRE_POSITIONS.map(({ key, label }) => {
              const t = tires.find(x => x.position === key)
              return (
                <div key={key} className="rounded-xl border border-border p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  {([
                    { label: 'Marka',  field: 'brand',       type: 'text' },
                    { label: 'Model',  field: 'model',       type: 'text' },
                    { label: 'Ebat',   field: 'size',        type: 'text' },
                    { label: 'DOT',    field: 'dot',         type: 'text' },
                    { label: 'Diş mm', field: 'tread_depth', type: 'number' },
                  ] as const).map(f => (
                    <div key={f.field}>
                      <label className="text-[10px] text-muted-foreground">{f.label}</label>
                      <input
                        type={f.type}
                        defaultValue={(t?.[f.field as keyof typeof t] as string | number | undefined) ?? ''}
                        onBlur={e => saveTire(key, f.field as keyof VehicleTire, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-border bg-input text-foreground focus:outline-none"
                        placeholder={f.label}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] text-muted-foreground">Durum</label>
                    <select
                      defaultValue={t?.status ?? 'iyi'}
                      onChange={e => saveTire(key, 'status', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-border bg-input text-foreground focus:outline-none"
                    >
                      <option value="iyi">İyi</option>
                      <option value="orta">Orta</option>
                      <option value="kotu">Kötü</option>
                      <option value="degistir">Değiştir</option>
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Akü ── */}
        {activeTab === 'aku' && (
          <div className="max-w-xs space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Akü Bilgileri</h3>
            {([
              { label: 'Marka',      key: 'brand',        type: 'text' },
              { label: 'Amper (Ah)', key: 'ampere',       type: 'number' },
              { label: 'Takılma',    key: 'install_date', type: 'date' },
            ] as const).map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                <input
                  type={f.type}
                  defaultValue={(battery?.[f.key as keyof typeof battery] as string | number | undefined) ?? ''}
                  onChange={e => setBattForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-input text-foreground focus:outline-none"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Test Sonucu</label>
              <select
                defaultValue={battery?.test_result ?? 'iyi'}
                onChange={e => setBattForm(prev => ({ ...prev, test_result: e.target.value as VehicleBatteryType['test_result'] }))}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-input text-foreground focus:outline-none"
              >
                <option value="iyi">İyi</option>
                <option value="zayif">Zayıf</option>
                <option value="degistir">Değiştir</option>
              </select>
            </div>
            <button
              onClick={saveBattery}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        )}

        {/* ── Bakım ── */}
        {activeTab === 'bakim' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Bakım Geçmişi</h3>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(MAINTENANCE_LABELS) as [MaintenanceType, string][]).map(([type, label]) => {
                const done = maintenance.some(m => m.type === type)
                return (
                  <button
                    key={type}
                    onClick={() => !done && addMaintenance(type)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      done
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 cursor-default'
                        : 'border-border text-muted-foreground hover:border-primary hover:text-primary cursor-pointer'
                    }`}
                  >
                    {done ? '✓ ' : '+ '}{label}
                  </button>
                )
              })}
            </div>

            {maintenance.length > 0 && (
              <div className="space-y-1 mt-2">
                {maintenance.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border">
                    <div>
                      <span className="text-xs font-medium text-foreground">
                        {MAINTENANCE_LABELS[m.type as MaintenanceType] ?? m.type}
                      </span>
                      {m.date && <span className="text-[10px] text-muted-foreground ml-2">{m.date}</span>}
                      {m.km && <span className="text-[10px] text-muted-foreground ml-2">{m.km.toLocaleString()} km</span>}
                    </div>
                    <button onClick={() => deleteMaint(m.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── AI Skor ── */}
        {activeTab === 'skor' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">AI Araç Skoru</h3>
              <button
                onClick={handleGenerateScore}
                disabled={scoreLoading}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <RefreshCw className={`w-3 h-3 ${scoreLoading ? 'animate-spin' : ''}`} />
                {scoreLoading ? 'Hesaplanıyor...' : 'Skoru Hesapla'}
              </button>
            </div>

            {(score ?? data?.ai_score) && (
              <>
                <div className="flex justify-center">
                  <div className="text-center">
                    <GaugeCircle value={score?.aiScore ?? data?.ai_score ?? null} />
                    <p className="text-xs text-muted-foreground mt-1">Genel Skor</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <ScoreBar label="Kaporta"  value={score?.kaporta  ?? data?.score_kaporta  ?? null} />
                  <ScoreBar label="Mekanik"  value={score?.mekanik  ?? data?.score_mekanik  ?? null} />
                  <ScoreBar label="Elektrik" value={score?.elektrik ?? data?.score_elektrik ?? null} />
                  <ScoreBar label="İç Mekan" value={score?.icMekan  ?? data?.score_ic_mekan ?? null} />
                  <ScoreBar label="Lastik"   value={score?.lastik   ?? data?.score_lastik   ?? null} />
                  <ScoreBar label="Bakım"    value={score?.bakim    ?? data?.score_bakim    ?? null} />
                  <ScoreBar label="Belge"    value={score?.belge    ?? data?.score_belge    ?? null} />
                </div>

                {(score?.analysis ?? data?.ai_analysis) && (
                  <div className="mt-3 p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" /> AI Analizi
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                      {score?.analysis ?? data?.ai_analysis}
                    </p>
                  </div>
                )}
              </>
            )}

            {!score && !data?.ai_score && !scoreLoading && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Araç skoru henüz hesaplanmadı. Yukarıdaki butona basın.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
