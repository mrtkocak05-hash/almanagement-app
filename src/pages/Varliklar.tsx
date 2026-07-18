import { useNavigate } from 'react-router-dom'
import { PageLoading } from '@/components/ui'
import { useAssets } from '@/hooks/useAssets'
import { AssetListHeader } from '@/modules/varliklar/AssetListHeader'
import { AssetTable } from '@/modules/varliklar/AssetTable'
import type { Asset, AssetFilters } from '@/types/assets'

export default function Varliklar() {
  const navigate = useNavigate()
  const { data, loading, error, filters, setFilters } = useAssets({ page: 1, limit: 20 })

  if (loading && !data) return <PageLoading />

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6 space-y-5">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold text-foreground">Varlıklar</h1>
          <p className="text-xs text-muted-foreground">
            Yeni varlık eklemek için{' '}
            <button onClick={() => navigate('/operasyon/satinalma')} className="text-foreground underline underline-offset-2 hover:no-underline">
              Satın Alma
            </button>{' '}
            modülünü kullanın
          </p>
        </div>

        <AssetListHeader
          summary={data?.summary}
          filters={filters}
          onFilterChange={(f: AssetFilters) => setFilters(f)}
          onNew={() => navigate('/operasyon/satinalma')}
        />

        {error ? (
          <div className="text-sm text-red-500 py-4">{error}</div>
        ) : (
          <AssetTable
            assets={data?.items ?? []}
            total={data?.total ?? 0}
            page={data?.page ?? 1}
            totalPages={data?.total_pages ?? 1}
            onPageChange={p => setFilters({ page: p })}
            onEdit={(_a: Asset) => navigate('/operasyon/satinalma')}
            onDelete={(_a: Asset) => {}}
          />
        )}
      </div>
    </div>
  )
}
