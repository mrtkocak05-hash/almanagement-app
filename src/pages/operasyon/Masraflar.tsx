import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader, Tabs, Button } from '@/components/ui'
import { useExpenses } from '@/hooks/useExpenses'
import { expensesApi } from '@/services/expensesApi'
import type { Expense } from '@/types/expenses'
import { ExpenseSummaryCards } from '@/modules/masraflar/ExpenseSummaryCards'
import { ExpenseFilters } from '@/modules/masraflar/ExpenseFilters'
import { ExpenseTable } from '@/modules/masraflar/ExpenseTable'
import { NewExpenseDrawer } from '@/modules/masraflar/NewExpenseDrawer'
import { ExpenseReports } from '@/modules/masraflar/ExpenseReports'

const TABS = [
  { id: 'list', label: 'Giderler' },
  { id: 'reports', label: 'Raporlar' },
]

export function Masraflar() {
  const [activeTab, setActiveTab] = useState('list')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { data, loading, filters, setFilters, clearFilters, refetch } = useExpenses()

  async function handleDelete(e: Expense) {
    if (!confirm(`"${e.description}" giderini silmek istiyor musunuz?\nBu işlem finansal hesapları tersine çevirecektir.`)) return
    try {
      await expensesApi.delete(e.id)
      refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Silme hatası')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Gider Merkezi"
        description="Tüm giderlerin takibi, analizi ve finansal entegrasyonu"
        actions={
          <Button onClick={() => setDrawerOpen(true)} size="sm">
            <Plus className="w-4 h-4" />Yeni Gider
          </Button>
        }
      />

      <div className="px-6">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {activeTab === 'list' && (
          <>
            <ExpenseSummaryCards />
            <ExpenseFilters
              filters={filters}
              onChange={setFilters}
              onClear={clearFilters}
            />
            <ExpenseTable
              items={data?.items ?? []}
              total={data?.total ?? 0}
              totalTry={data?.summary.total_try ?? 0}
              loading={loading}
              onDelete={handleDelete}
            />
          </>
        )}

        {activeTab === 'reports' && <ExpenseReports />}
      </div>

      <NewExpenseDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={refetch}
      />
    </div>
  )
}
