import { lazy, Suspense } from 'react'
import { AlertCircle } from 'lucide-react'
import { useDashboard } from '@/hooks/useDashboard'

// Lazy load all dashboard widgets
const CEOMorningBrief   = lazy(() => import('@/modules/dashboard/CEOMorningBrief').then(m => ({ default: m.CEOMorningBrief })))
const ExecutiveScore    = lazy(() => import('@/modules/dashboard/ExecutiveScore').then(m => ({ default: m.ExecutiveScore })))
const ChartPanel        = lazy(() => import('@/modules/dashboard/ChartPanel').then(m => ({ default: m.ChartPanel })))
const PortfoyAnalizi    = lazy(() => import('@/modules/dashboard/PortfoyAnalizi').then(m => ({ default: m.PortfoyAnalizi })))
const TopInvestments    = lazy(() => import('@/modules/dashboard/TopInvestments').then(m => ({ default: m.TopInvestments })))
const TopExpenseAssets  = lazy(() => import('@/modules/dashboard/TopExpenseAssets').then(m => ({ default: m.TopExpenseAssets })))
const ActivityTimeline  = lazy(() => import('@/modules/dashboard/ActivityTimeline').then(m => ({ default: m.ActivityTimeline })))
const AIExecutiveSummary = lazy(() => import('@/modules/dashboard/AIExecutiveSummary').then(m => ({ default: m.AIExecutiveSummary })))
const AkillıUyarılar   = lazy(() => import('@/modules/dashboard/AkillıUyarılar').then(m => ({ default: m.AkillıUyarılar })))
const BugunFirsatlari  = lazy(() => import('@/modules/dashboard/BugunFirsatlari').then(m => ({ default: m.BugunFirsatlari })))
const KrediHesaplama   = lazy(() => import('@/modules/dashboard/KrediHesaplama').then(m => ({ default: m.KrediHesaplama })))
const DocumentSagligi  = lazy(() => import('@/modules/dashboard/DocumentSagligi').then(m => ({ default: m.DocumentSagligi })))
const AracSagligi      = lazy(() => import('@/modules/dashboard/AracSagligi').then(m => ({ default: m.AracSagligi })))
const YatirimFirsatlari = lazy(() => import('@/modules/dashboard/YatirimFirsatlari').then(m => ({ default: m.YatirimFirsatlari })))
const BakiyeWidget      = lazy(() => import('@/modules/dashboard/BakiyeWidget').then(m => ({ default: m.BakiyeWidget })))

function Placeholder({ h = 'h-32' }: { h?: string }) {
  return <div className={`${h} rounded-2xl bg-card border border-border animate-pulse`} />
}

export function Dashboard() {
  const { data, error, refetch } = useDashboard()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Veri alınamadı</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button onClick={refetch}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Tekrar dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">

      {/* Row 0 — CEO Morning Brief */}
      <Suspense fallback={<Placeholder h="h-[100px]" />}>
        <CEOMorningBrief />
      </Suspense>

      {/* Row 1 — Balance Summary Widget */}
      <Suspense fallback={<Placeholder h="h-[116px]" />}>
        <BakiyeWidget />
      </Suspense>

      {/* Row 2 — Executive Score (1/4) + Chart Panel (3/4) */}
      <div className="grid grid-cols-4 gap-2" style={{ minHeight: 240 }}>
        <div className="col-span-1">
          <Suspense fallback={<Placeholder h="h-full" />}>
            <ExecutiveScore />
          </Suspense>
        </div>
        <div className="col-span-3">
          <Suspense fallback={<Placeholder h="h-full" />}>
            <ChartPanel />
          </Suspense>
        </div>
      </div>

      {/* Row 3 — Portföy(1) + TopInvestments(1) + TopExpenses(1) + Activity(1) */}
      <div className="grid grid-cols-4 gap-2" style={{ minHeight: 220 }}>
        <div className="col-span-1">
          <Suspense fallback={<Placeholder h="h-full" />}>
            <PortfoyAnalizi />
          </Suspense>
        </div>
        <div className="col-span-1">
          <Suspense fallback={<Placeholder h="h-full" />}>
            <TopInvestments />
          </Suspense>
        </div>
        <div className="col-span-1">
          <Suspense fallback={<Placeholder h="h-full" />}>
            <TopExpenseAssets />
          </Suspense>
        </div>
        <div className="col-span-1">
          <Suspense fallback={<Placeholder h="h-full" />}>
            <ActivityTimeline activities={data?.recent_activities ?? []} />
          </Suspense>
        </div>
      </div>

      {/* Row 4 — AIExecutive(2) + AkıllıUyarılar(1) + Fırsatlar(1) + Kredi(1) [5-col] */}
      <div className="grid grid-cols-5 gap-2" style={{ minHeight: 200 }}>
        <div className="col-span-2">
          <Suspense fallback={<Placeholder h="h-full" />}>
            <AIExecutiveSummary />
          </Suspense>
        </div>
        <div className="col-span-1">
          <Suspense fallback={<Placeholder h="h-full" />}>
            <AkillıUyarılar />
          </Suspense>
        </div>
        <div className="col-span-1">
          <Suspense fallback={<Placeholder h="h-full" />}>
            <BugunFirsatlari />
          </Suspense>
        </div>
        <div className="col-span-1">
          <Suspense fallback={<Placeholder h="h-full" />}>
            <KrediHesaplama />
          </Suspense>
        </div>
      </div>

      {/* Row 5 — Document + Araç Sağlığı + Yatırım Fırsatları */}
      <div className="grid grid-cols-3 gap-2">
        <Suspense fallback={<Placeholder h="h-24" />}>
          <DocumentSagligi />
        </Suspense>
        <Suspense fallback={<Placeholder h="h-24" />}>
          <AracSagligi />
        </Suspense>
        <Suspense fallback={<Placeholder h="h-24" />}>
          <YatirimFirsatlari />
        </Suspense>
      </div>

    </div>
  )
}
