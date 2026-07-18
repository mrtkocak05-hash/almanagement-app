import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Tabs, Button, PageLoading, Badge } from '@/components/ui'
import { useAssetDetail } from '@/hooks/useAssetDetail'
import { assetsApi } from '@/services/assetsApi'
import { ASSET_TYPE_LABELS, ASSET_STATUS_LABELS } from '@/types/assets'
import { AssetDetailGeneral } from '@/modules/varliklar/detail/AssetDetailGeneral'
import { AssetDetailPartners } from '@/modules/varliklar/detail/AssetDetailPartners'
import { AssetDetailPhotos } from '@/modules/varliklar/detail/AssetDetailPhotos'
import { AssetDetailDocuments } from '@/modules/varliklar/detail/AssetDetailDocuments'
import { ActivityStory } from '@/components/ActivityStory'
import { formatCurrency } from '@/utils/format'
import { VehicleIntelligencePanel } from '@/modules/satin-alma/components/VehicleIntelligence/VehicleIntelligencePanel'
import { AIValuationPanel } from '@/modules/satin-alma/components/VehicleIntelligence/AIValuationPanel'
import { useAssetValuation } from '@/hooks/useVehicleValuation'

const VEHICLE_ASSET_TYPES = ['vehicle', 'motorcycle', 'caravan', 'construction_equipment'] as const

const TABS = [
  { id: 'general', label: 'Genel' },
  { id: 'partners', label: 'Hissedarlar' },
  { id: 'photos', label: 'Fotoğraflar' },
  { id: 'documents', label: 'Belgeler' },
  { id: 'activity', label: 'Aktivite' },
]

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  active: 'success', sold: 'warning', passive: 'default',
}

export default function VarlikDetay() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useAssetDetail(id ? Number(id) : null)
  const [activeTab, setActiveTab] = useState('general')

  const handleDelete = async () => {
    if (!data) return
    if (!confirm(`"${data.name}" silinsin mi?`)) return
    await assetsApi.delete(data.id)
    navigate('/varliklar')
  }

  if (loading) return <PageLoading />
  if (error || !data) return (
    <div className="p-6">
      <p className="text-sm text-red-500">{error ?? 'Varlık bulunamadı'}</p>
      <button onClick={() => navigate(-1)} className="mt-2 text-sm text-muted-foreground hover:text-foreground">Geri dön</button>
    </div>
  )

  const isVehicle = (VEHICLE_ASSET_TYPES as readonly string[]).includes(data.type)
  const assetValuation = useAssetValuation(isVehicle ? data.id : null)

  const baseTabs = [
    ...TABS,
    ...(isVehicle ? [{ id: 'valuation', label: 'AI Değerleme' }] : []),
    ...(isVehicle ? [{ id: 'vehicle', label: 'Araç Sağlığı' }] : []),
  ]

  const tabsWithCounts = baseTabs.map(t => {
    if (t.id === 'partners') return { ...t, count: data.partners.filter(p => !p.deleted_at).length }
    if (t.id === 'photos') return { ...t, count: data.photos.filter(p => !p.deleted_at).length }
    if (t.id === 'documents') return { ...t, count: data.documents.filter(d => !d.deleted_at).length }
    return t
  })

  const mainPhoto = data.photos.find(p => p.is_main === 1 && !p.deleted_at) ?? data.photos.find(p => !p.deleted_at)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border flex-shrink-0">
        <button onClick={() => navigate('/varliklar')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
          {mainPhoto ? (
            <img src={`/storage/${mainPhoto.path}`} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-bold">
              {data.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-foreground truncate">{data.name}</h1>
            <Badge variant={STATUS_VARIANT[data.status] ?? 'default'}>{ASSET_STATUS_LABELS[data.status]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {ASSET_TYPE_LABELS[data.type]}
            {data.current_value != null && (
              <> · <span className="text-foreground font-medium">{formatCurrency(data.current_value)}</span></>
            )}
          </p>
        </div>

        <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-500 hover:bg-red-500/10">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Tabs tabs={tabsWithCounts} active={activeTab} onChange={setActiveTab} className="px-6 flex-shrink-0" />

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'general' && <AssetDetailGeneral asset={data} />}
        {activeTab === 'partners' && <AssetDetailPartners asset={data} onRefresh={refetch} />}
        {activeTab === 'photos' && <AssetDetailPhotos asset={data} onRefresh={refetch} />}
        {activeTab === 'documents' && <AssetDetailDocuments asset={data} onRefresh={refetch} />}
        {activeTab === 'activity' && <ActivityStory assetId={data.id} />}
        {activeTab === 'valuation' && (
          <AIValuationPanel
            data={assetValuation.data}
            loading={assetValuation.loading}
            computing={assetValuation.computing}
            error={assetValuation.error}
            onCompute={assetValuation.compute}
          />
        )}
        {activeTab === 'vehicle' && <VehicleIntelligencePanel assetId={data.id} />}
      </div>
    </div>
  )
}
