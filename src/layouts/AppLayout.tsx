import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { AIPanel } from './AIPanel'

export function AppLayout() {
  return (
    <div className="flex h-full bg-zinc-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      <AIPanel />
    </div>
  )
}
