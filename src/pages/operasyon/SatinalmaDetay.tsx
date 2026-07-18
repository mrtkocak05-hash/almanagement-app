import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, CheckCircle2 } from 'lucide-react'
import { Tabs, Button, PageLoading, Badge } from '@/components/ui'
import { usePurchaseDetail } from '@/hooks/usePurchaseDetail'
import { purchasesApi } from '@/services/purchasesApi'
import { ASSET_TYPE_LABELS } from '@/types/assets'
import { formatCurrency, formatDate } from '@/utils/format'
import { PurchaseDetailSummary } from '@/modules/satin-alma/detail/PurchaseDetailSummary'
import { PurchaseDetailExpenses } from '@/modules/satin-alma/detail/PurchaseDetailExpenses'
import { PurchaseDetailPartners } from '@/modules/satin-alma/detail/PurchaseDetailPartners'
import { PurchaseDetailDocuments } from '@/modules/satin-alma/detail/PurchaseDetailDocuments'
import { PurchaseDetailActivity } from '@/modules/satin-alma/detail/PurchaseDetailActivity'
import { VehicleIntelligencePanel } from '@/modules/satin-alma/components/VehicleIntelligence/VehicleIntelligencePanel'
import { AIValuationPanel } from '@/modules/satin-alma/components/VehicleIntelligence/AIValuationPanel'
import { usePurchaseValuation } from '@/hooks/useVehicleValuation'

const VEHICLE_ASSET_TYPES = ['vehicle', 'motorcycle', 'caravan', 'construction_equipment'] as const

const TABS = [
  { id: 'summary', label: 'Özet' },
  { id: 'expenses', label: 'Giderler' },
  { id: 'partners', label: 'Hissedarlar' },
  { id: 'documents', label: 'Belgeler' },
  { id: 'activity', label: 'Aktivite' },
]

export default function SatinalmaDetay() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = usePurchaseDetail(id ? Number(id) : null)
  const [activeTab, setActiveTab] = useState('summary')
  const [completing, setCompleting] = useState(false)

  const handleDelete = async () => {
    if (!data) return
    if (!confirm(`"${data.asset_name}" silinsin mi?`)) return
    await purchasesApi.delete(data.id)
    navigate('/operasyon/satinalma')
  }

  const handleComplete = async () => {
    if (!data) return
    if (!confirm('Satın alma tamamlanarak varlık oluşturulsun mu?')) return
    try {
      setCompleting(true)
      await purchasesApi.complete(data.id)
      refetch()
    } finally { setCompleting(false) }
  }

  if (loading) return <PageLoading />
  if (error || !data) return (
    <div className="p-6">
      <p className="text-sm text-red-500">{error ?? 'Kayıt bulunamadı'}</p>
      <button onClick={() => navigate(-1)} className="mt-2 text-sm text-muted-foreground hover:text-foreground">Geri dön</button>
    </div>
  )

  const isVehicle = (VEHICLE_ASSET_TYPES as readonly string[]).includes(data.type)
  const hasAsset  = data.status === 'completed' && data.asset_id != null

  const valuation = usePurchaseValuation(data.id)

  const baseTabs = [
    ...TABS,
    ...(isVehicle ? [{ id: 'valuation', label: 'AI Değerleme' }] : []),
    ...(isVehicle && hasAsset ? [{ id: 'vehicle', label: 'Araç Sağlığı' }] : []),
  ]

  const tabsWithCounts = baseTabs.map(t => {
    if (t.id === 'expenses') return { ...t, count: data.expenses.filter(e => !e.deleted_at).length }
    if (t.id === 'partners') return { ...t, count: data.partners.filter(p => !p.deleted_at).length }
    if (t.id === 'documents') return { ...t, count: data.documents.filter(d => !d.deleted_at).length }
    return t
  })

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border flex-shrink-0">
        <button onClick={() => navigate('/operasyon/satinalma')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{data.purchase_no}</span>
            <h1 className="text-base font-semibold text-foreground truncate">{data.asset_name}</h1>
            <Badge variant={data.status === 'completed' ? 'success' : 'warning'}>
              {data.status === 'completed' ? 'Tamamlandı' : 'Taslak'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ASSET_TYPE_LABELS[data.type]}
            {data.purchase_date && <> · {formatDate(data.purchase_date)}</>}
            {data.total_cost_try != null && (
              <> · <span className="font-medium text-foreground">{formatCurrency(data.total_cost_try)}</span></>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {data.status === 'draft' && (
            <Button size="sm" onClick={handleComplete} disabled={completing}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {completing ? 'İşleniyor...' : 'Tamamla & Varlık Oluştur'}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-500 hover:bg-red-500/10">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <Tabs tabs={tabsWithCounts} active={activeTab} onChange={setActiveTab} className="px-6 flex-shrink-0" />

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'summary' && <PurchaseDetailSummary purchase={data} />}
        {activeTab === 'expenses' && <PurchaseDetailExpenses purchase={data} onRefresh={refetch} />}
        {activeTab === 'partners' && <PurchaseDetailPartners purchase={data} onRefresh={refetch} />}
        {activeTab === 'documents' && <PurchaseDetailDocuments purchase={data} onRefresh={refetch} />}
        {activeTab === 'activity' && <PurchaseDetailActivity purchase={data} />}
        {activeTab === 'valuation' && (
          <AIValuationPanel
            data={valuation.data}
            loading={valuation.loading}
            computing={valuation.computing}
            error={valuation.error}
            onCompute={valuation.compute}
          />
        )}
        {activeTab === 'vehicle' && hasAsset && (
          <VehicleIntelligencePanel assetId={data.asset_id!} />
        )}
      </div>
    </div>
  )
}
