import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Login } from '@/pages/Login'
import { Satinalma } from '@/pages/operasyon/Satinalma'
import { Satislar } from '@/pages/operasyon/Satislar'
import { Musteriler } from '@/pages/operasyon/Musteriler'
import { Finans } from '@/pages/operasyon/Finans'
import { Masraflar } from '@/pages/operasyon/Masraflar'
import { Dokumanlar } from '@/pages/operasyon/Dokumanlar'
import { PiyasaArastirma } from '@/pages/PiyasaArastirma'
import { Raporlar } from '@/pages/Raporlar'
import { Ayarlar } from '@/pages/Ayarlar'
import { NotFound } from '@/pages/NotFound'
import { PageLoading } from '@/components/ui'
import { RequireAuth } from '@/components/guards/RequireAuth'
import { AuthProvider } from '@/contexts/AuthContext'

const Varliklar = lazy(() => import('@/pages/Varliklar'))
const VarlikDetay = lazy(() => import('@/pages/VarlikDetay'))
const SatinalmaDetay = lazy(() => import('@/pages/operasyon/SatinalmaDetay'))
const SatislarDetay = lazy(() => import('@/pages/operasyon/SatislarDetay'))

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <AuthProvider>
        <Login />
      </AuthProvider>
    ),
  },
  {
    path: '/',
    element: (
      <AuthProvider>
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      </AuthProvider>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: 'varliklar',
        element: <Suspense fallback={<PageLoading />}><Varliklar /></Suspense>,
      },
      {
        path: 'varliklar/:id',
        element: <Suspense fallback={<PageLoading />}><VarlikDetay /></Suspense>,
      },
      { path: 'operasyon/satinalma', element: <Satinalma /> },
      { path: 'operasyon/satinalma/:id', element: <Suspense fallback={<PageLoading />}><SatinalmaDetay /></Suspense> },
      { path: 'operasyon/satislar', element: <Satislar /> },
      { path: 'operasyon/satislar/:id', element: <Suspense fallback={<PageLoading />}><SatislarDetay /></Suspense> },
      { path: 'operasyon/musteriler', element: <Musteriler /> },
      { path: 'operasyon/finans', element: <Finans /> },
      { path: 'operasyon/masraflar', element: <Masraflar /> },
      { path: 'operasyon/dokumanlar', element: <Dokumanlar /> },
      { path: 'operasyon/piyasa-arastirma', element: <PiyasaArastirma /> },
      { path: 'raporlar', element: <Raporlar /> },
      { path: 'ayarlar', element: <Ayarlar /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
