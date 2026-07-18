import { useState } from 'react'
import { PageLoading } from '@/components/ui'
import { usePurchases } from '@/hooks/usePurchases'
import { useDashboard } from '@/hooks/useDashboard'
import { PurchaseListHeader } from '@/modules/satin-alma/PurchaseListHeader'
import { PurchaseTable } from '@/modules/satin-alma/PurchaseTable'
import { PurchaseWizard } from '@/modules/satin-alma/PurchaseWizard'
import { purchasesApi } from '@/services/purchasesApi'
import type { Purchase, PurchaseFilters } from '@/types/purchases'

export function Satinalma() {
  const { data, loading, error, refetch, filters, setFilters } = usePurchases({ page: 1, limit: 50 })
  const { data: dashData } = useDashboard()
  const [wizardOpen, setWizardOpen] = useState(false)

  const handleDelete = async (p: Purchase) => {
    if (!confirm(`"${p.asset_name}" satın alma kaydı silinsin mi?`)) return
    try {
      await purchasesApi.delete(p.id)
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
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-semibold text-foreground">Satın Almalar</h1>
        </div>

        <PurchaseListHeader
          summary={data?.summary}
          filters={filters}
          onFilterChange={(f: PurchaseFilters) => setFilters(f)}
          onNew={() => setWizardOpen(true)}
        />

        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <PurchaseTable
            purchases={data?.items ?? []}
            total={data?.total ?? 0}
            page={data?.page ?? 1}
            totalPages={data?.total_pages ?? 1}
            onPageChange={p => setFilters({ page: p })}
            onDelete={handleDelete}
          />
        )}
      </div>

      <PurchaseWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => { refetch(); setWizardOpen(false) }}
        exchangeRates={exchangeRates}
      />
    </div>
  )
}
