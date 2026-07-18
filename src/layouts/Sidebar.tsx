import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, ShoppingCart, TrendingUp,
  Users, Wallet, Receipt, FileText, BarChart3, Settings,
  ChevronRight, PanelLeftClose, PanelLeft, SearchCheck, Car,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/contexts/AuthContext'

interface NavChild { label: string; path: string }
interface NavSection {
  label: string
  path?: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavChild[]
}

const navigation: NavSection[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Varlıklar', path: '/varliklar', icon: Briefcase },
  {
    label: 'Operasyon',
    icon: TrendingUp,
    children: [
      { label: 'Satınalma', path: '/operasyon/satinalma' },
      { label: 'Satışlar', path: '/operasyon/satislar' },
      { label: 'Müşteriler', path: '/operasyon/musteriler' },
      { label: 'Finans', path: '/operasyon/finans' },
      { label: 'Masraflar', path: '/operasyon/masraflar' },
      { label: 'Dokümanlar', path: '/operasyon/dokumanlar' },
      { label: 'Piyasa Araştırma', path: '/operasyon/piyasa-arastirma' },
    ],
  },
  { label: 'Raporlar', path: '/raporlar', icon: BarChart3 },
  { label: 'Ayarlar', path: '/ayarlar', icon: Settings },
]

const operasyonIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Satınalma: ShoppingCart, Satışlar: TrendingUp, Müşteriler: Users,
  Finans: Wallet, Masraflar: Receipt, Dokümanlar: FileText,
  'Piyasa Araştırma': SearchCheck,
}

const sections: { label: string; keys: string[] }[] = [
  { label: 'GENEL BAKIŞ', keys: ['Dashboard'] },
  { label: 'VARLIKLAR', keys: ['Varlıklar', 'Operasyon'] },
  { label: 'ANALİZ', keys: ['Raporlar', 'Ayarlar'] },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user } = useAuth()
  const [expandedSections, setExpandedSections] = useState<string[]>(['Operasyon'])
  const location = useLocation()

  const toggleSection = (label: string) =>
    setExpandedSections(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    )

  const initials = user?.full_name
    ? user.full_name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'MK'

  function renderItem(item: NavSection) {
    const Icon = item.icon
    const isExpanded = expandedSections.includes(item.label)
    const sectionActive = item.children?.some(c =>
      location.pathname === c.path || location.pathname.startsWith(c.path + '/')
    )

    if (item.children) {
      return (
        <div key={item.label}>
          <button
            onClick={() => !sidebarCollapsed && toggleSection(item.label)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
              sidebarCollapsed && 'justify-center',
              sectionActive
                ? 'text-zinc-900 font-medium'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {isExpanded
                  ? <ChevronRight className="w-3 h-3 opacity-40 rotate-90 transition-transform" />
                  : <ChevronRight className="w-3 h-3 opacity-40 transition-transform" />}
              </>
            )}
          </button>

          {!sidebarCollapsed && isExpanded && (
            <div className="mt-0.5 ml-4 pl-3 space-y-0.5 border-l border-zinc-100">
              {item.children.map(child => {
                const ChildIcon = operasyonIcons[child.label]
                const isActive =
                  location.pathname === child.path ||
                  location.pathname.startsWith(child.path + '/')
                return (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                      isActive
                        ? 'bg-zinc-900 text-white font-medium'
                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                    )}
                  >
                    {ChildIcon && <ChildIcon className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span>{child.label}</span>
                    {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return (
      <NavLink
        key={item.path}
        to={item.path!}
        end={item.path === '/'}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
            sidebarCollapsed && 'justify-center',
            isActive
              ? 'bg-zinc-900 text-white font-medium'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
          )
        }
      >
        {({ isActive }) => (
          <>
            <span className="flex-shrink-0"><Icon className="w-4 h-4" /></span>
            {!sidebarCollapsed && <span className="flex-1">{item.label}</span>}
            {isActive && !sidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
          </>
        )}
      </NavLink>
    )
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-full transition-all duration-200 ease-in-out flex-shrink-0',
        'bg-white border-r border-zinc-200',
        sidebarCollapsed ? 'w-16' : 'w-[256px]'
      )}
    >
      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-zinc-200 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0">
            <Car className="w-4 h-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <span className="text-sm font-bold tracking-widest text-zinc-900">ALMANAGEMENT</span>
              <p className="text-[10px] text-zinc-400 tracking-wider -mt-0.5">AI Business Platform</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {!sidebarCollapsed ? (
          sections.map(section => {
            const items = navigation.filter(n => section.keys.includes(n.label))
            return (
              <div key={section.label} className="mb-5">
                <p className="text-[10px] font-semibold tracking-widest text-zinc-400 px-3 mb-1.5">
                  {section.label}
                </p>
                <ul className="space-y-0.5">
                  {items.map(item => <li key={item.label}>{renderItem(item)}</li>)}
                </ul>
              </div>
            )
          })
        ) : (
          <div className="space-y-0.5">
            {navigation.map(item => renderItem(item))}
          </div>
        )}
      </nav>

      {/* ── User Card ── */}
      {!sidebarCollapsed && (
        <div className="px-3 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)' }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-900 truncate">{user?.full_name ?? 'Mikail Kaygan'}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user?.role_label ?? 'CEO'}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Çevrimiçi" />
          </div>
        </div>
      )}

      {/* ── Collapse toggle ── */}
      <div className="p-2 flex-shrink-0 border-t border-zinc-200">
        <button
          onClick={toggleSidebar}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-all duration-150',
            sidebarCollapsed && 'justify-center'
          )}
        >
          {sidebarCollapsed
            ? <PanelLeft className="w-4 h-4" />
            : <><PanelLeftClose className="w-4 h-4" /><span>Daralt</span></>
          }
        </button>
      </div>
    </aside>
  )
}
