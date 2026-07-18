import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, CheckCircle } from 'lucide-react'
import { Tabs, Button, PageLoading, Badge } from '@/components/ui'
import { useSaleDetail } from '@/hooks/useSales'
import { salesApi } from '@/services/salesApi'
import { formatCurrency } from '@/utils/format'
import { getScoreLabel, getScoreColor } from '@/types/sales'
import { SaleDetailGeneral } from '@/modules/satislar/detail/SaleDetailGeneral'
import { SaleDetailAnalysis } from '@/modules/satislar/detail/SaleDetailAnalysis'
import { SaleDetailExpenses } from '@/modules/satislar/detail/SaleDetailExpenses'
import { SaleDetailDocuments } from '@/modules/satislar/detail/SaleDetailDocuments'
import { SaleDetailActivity } from '@/modules/satislar/detail/SaleDetailActivity'
import { SaleDetailPartners } from '@/modules/satislar/detail/SaleDetailPartners'

const TABS = [
  { id: 'general', label: 'Genel' },
  { id: 'analysis', label: 'Yatırım Analizi' },
  { id: 'expenses', label: 'Giderler' },
  { id: 'documents', label: 'Belgeler' },
  { id: 'activity', label: 'Aktivite' },
  { id: 'partners', label: 'Hissedarlar' },
]

export default function SatislarDetay() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useSaleDetail(id ? Number(id) : null)
  const [activeTab, setActiveTab] = useState('general')
  const [completing, setCompleting] = useState(false)

  const handleComplete = async () => {
    if (!data || !confirm('Satış tamamlansın mı? Varlık durumu "Satıldı" olarak güncellenecek.')) return
    try {
      setCompleting(true)
      await salesApi.complete(data.id)
      refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setCompleting(false)
    }
  }

  const handleDelete = async () => {
    if (!data || !confirm(`"${data.asset_name}" satış kaydı silinsin mi?`)) return
    await salesApi.delete(data.id)
    navigate('/operasyon/satislar')
  }

  if (loading) return <PageLoading />
  if (error || !data) return (
    <div className="p-6">
      <p className="text-sm text-red-500">{error ?? 'Satış bulunamadı'}</p>
      <button onClick={() => navigate(-1)} className="mt-2 text-sm text-muted-foreground hover:text-foreground">Geri dön</button>
    </div>
  )

  const tabsWithCounts = TABS.map(t => {
    if (t.id === 'expenses') return { ...t, count: data.expenses.filter(e => !e.deleted_at).length }
    if (t.id === 'documents') return { ...t, count: data.documents.filter(d => !d.deleted_at).length }
    if (t.id === 'partners') return { ...t, count: data.partners?.length ?? 0 }
    return t
  })

  const netProfit = data.net_profit_try ?? 0

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border flex-shrink-0">
        <button onClick={() => navigate('/operasyon/satislar')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-semibold text-foreground truncate">{data.asset_name}</h1>
            <span className="text-xs text-muted-foreground font-mono">{data.sale_no}</span>
            <Badge variant={data.status === 'completed' ? 'success' : 'warning'}>
              {data.status === 'completed' ? 'Tamamlandı' : 'Taslak'}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-0.5">
            <p className="text-xs text-muted-foreground">
              Satış: <span className="text-foreground font-medium">{formatCurrency(data.sale_price_try ?? data.sale_price)}</span>
            </p>
            {data.net_profit_try !== null && (
              <p className="text-xs text-muted-foreground">
                Kâr: <span className={`font-semibold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(Math.abs(netProfit))}
                  {netProfit < 0 && ' (zarar)'}
                </span>
              </p>
            )}
            {data.investment_score != null && (
              <p className={`text-xs font-semibold ${getScoreColor(data.investment_score)}`}>
                {data.investment_score} / 100 — {getScoreLabel(data.investment_score)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data.status === 'draft' && (
            <Button size="sm" onClick={handleComplete} disabled={completing}>
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              {completing ? '...' : 'Tamamla'}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-500 hover:bg-red-500/10">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <Tabs tabs={tabsWithCounts} active={activeTab} onChange={setActiveTab} className="px-6 flex-shrink-0" />

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'general' && <SaleDetailGeneral sale={data} />}
        {activeTab === 'analysis' && <SaleDetailAnalysis sale={data} />}
        {activeTab === 'expenses' && <SaleDetailExpenses sale={data} />}
        {activeTab === 'documents' && <SaleDetailDocuments sale={data} onRefresh={refetch} />}
        {activeTab === 'activity' && <SaleDetailActivity sale={data} />}
        {activeTab === 'partners' && <SaleDetailPartners sale={data} />}
      </div>
    </div>
  )
}
