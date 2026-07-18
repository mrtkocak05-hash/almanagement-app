import { useState } from 'react'
import { Upload } from 'lucide-react'
import { PageHeader, Tabs, Button } from '@/components/ui'
import { useArchive } from '@/hooks/useArchive'
import { archiveApi } from '@/services/archiveApi'
import type { ArchiveDocument } from '@/types/archive'
import { ArchiveSummaryCards } from '@/modules/dokumanlar/ArchiveSummaryCards'
import { DocFilters } from '@/modules/dokumanlar/DocFilters'
import { DocTable } from '@/modules/dokumanlar/DocTable'
import { UploadDrawer } from '@/modules/dokumanlar/UploadDrawer'
import { ArchiveReports } from '@/modules/dokumanlar/ArchiveReports'

const TABS = [
  { id: 'archive', label: 'Arşiv' },
  { id: 'reports', label: 'Raporlar' },
]

export function Dokumanlar() {
  const [activeTab, setActiveTab] = useState('archive')
  const [uploadOpen, setUploadOpen] = useState(false)
  const { data, loading, filters, setFilters, clearFilters, refetch } = useArchive()

  async function handleDelete(doc: ArchiveDocument) {
    if (!confirm(`"${doc.title}" dokümanını silmek istiyor musunuz?`)) return
    try {
      await archiveApi.delete(doc.id)
      refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Silme hatası')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Dijital Arşiv"
        description="Tüm şirket dokümanlarının merkezi yönetimi, sürüm takibi ve son geçerlilik kontrolü"
        actions={
          <Button onClick={() => setUploadOpen(true)} size="sm">
            <Upload className="w-4 h-4" />Doküman Yükle
          </Button>
        }
      />

      <div className="px-6">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {activeTab === 'archive' && (
          <>
            <ArchiveSummaryCards onFilterClick={f => { setFilters(f); setActiveTab('archive') }} />

            <DocFilters
              filters={filters}
              onChange={setFilters}
              onClear={clearFilters}
            />

            <DocTable
              items={data?.items ?? []}
              total={data?.total ?? 0}
              loading={loading}
              onDelete={handleDelete}
            />
          </>
        )}

        {activeTab === 'reports' && <ArchiveReports />}
      </div>

      <UploadDrawer
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => { refetch() }}
      />
    </div>
  )
}
