import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLoading } from '@/components/ui'
import { useSales } from '@/hooks/useSales'
import { useDashboard } from '@/hooks/useDashboard'
import { SaleListHeader } from '@/modules/satislar/SaleListHeader'
import { SaleTable } from '@/modules/satislar/SaleTable'
import { SaleWizard } from '@/modules/satislar/SaleWizard'
import { salesApi } from '@/services/salesApi'
import type { Sale, SaleFilters } from '@/types/sales'

export function Satislar() {
  const navigate = useNavigate()
  const { data, loading, error, refetch, filters, setFilters } = useSales({ page: 1, limit: 50 })
  const { data: dashData } = useDashboard()
  const [wizardOpen, setWizardOpen] = useState(false)

  const handleDelete = async (s: Sale) => {
    if (!confirm(`"${s.asset_name}" satış kaydı silinsin mi?`)) return
    try {
      await salesApi.delete(s.id)
      refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Silme hatası')
    }
  }

  const exchangeRates = dashData?.exchange_rates ?? { usd_try: 0, gold_gram_try: 0 }

  if (loading && !data) return <PageLoading />

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6 space-y-5">
        <h1 className="text-xl font-semibold text-foreground">Satışlar</h1>

        <SaleListHeader
          summary={data?.summary}
          filters={filters}
          onFilterChange={(f: SaleFilters) => setFilters(f)}
          onNew={() => setWizardOpen(true)}
        />

        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <SaleTable
            sales={data?.items ?? []}
            total={data?.total ?? 0}
            page={data?.page ?? 1}
            totalPages={data?.total_pages ?? 1}
            onPageChange={p => setFilters({ page: p })}
            onView={s => navigate(`/operasyon/satislar/${s.id}`)}
            onDelete={handleDelete}
          />
        )}
      </div>

      <SaleWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => { refetch(); setWizardOpen(false) }}
        exchangeRates={exchangeRates}
      />
    </div>
  )
}
