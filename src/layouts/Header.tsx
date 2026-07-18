import { useState, useEffect, useRef } from 'react'
import { Moon, Sun, BotMessageSquare, ChevronDown, Search, Car, ShoppingCart, TrendingUp, FileText, Package, X, Clock, LogOut, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import { useThemeStore } from '@/store/themeStore'
import { useUIStore } from '@/store/uiStore'
import { globalSearchApi } from '@/services/globalSearchApi'
import type { SearchResult, SearchResultType } from '@/services/globalSearchApi'
import { cn } from '@/utils/cn'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useAuth } from '@/contexts/AuthContext'

dayjs.locale('tr')

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/varliklar': 'Varlıklar',
  '/operasyon/satinalma': 'Satınalma',
  '/operasyon/satislar': 'Satışlar',
  '/operasyon/musteriler': 'Müşteriler',
  '/operasyon/finans': 'Finans',
  '/operasyon/masraflar': 'Masraflar',
  '/operasyon/dokumanlar': 'Dijital Arşiv',
  '/operasyon/piyasa-arastirma': 'Piyasa Araştırma',
  '/raporlar': 'Raporlar',
  '/ayarlar': 'Ayarlar',
}

function usePageTitle() {
  const { pathname } = useLocation()
  for (const [key, val] of Object.entries(PAGE_TITLES)) {
    if (pathname === key || (key !== '/' && pathname.startsWith(key))) return val
  }
  return 'AlManagement'
}

const LS_KEY = 'alm_recent_searches'
const MAX_RECENT = 5
function getRecent(): string[] { try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] } }
function saveRecent(q: string) { const prev = getRecent().filter(r => r !== q); localStorage.setItem(LS_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT))) }
function clearRecent() { localStorage.removeItem(LS_KEY) }

const TYPE_ICONS: Record<SearchResultType, React.ComponentType<{ className?: string }>> = {
  asset: Car, purchase: ShoppingCart, sale: TrendingUp, expense: Package, document: FileText,
}
const TYPE_LABELS: Record<SearchResultType, string> = {
  asset: 'Varlık', purchase: 'Alım', sale: 'Satış', expense: 'Gider', document: 'Belge',
}

function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  function openPanel() { setRecent(getRecent()); setOpen(true) }

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const res = await globalSearchApi.search(query)
      setResults(res)
      setLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  function handleSelect(r: SearchResult) {
    saveRecent(r.title); navigate(r.url); setQuery(''); setResults([]); setOpen(false)
  }
  function handleKeyDown(e: React.KeyboardEvent) { if (e.key === 'Escape') { setQuery(''); setOpen(false) } }
  const showDropdown = open && (query.length >= 2 || recent.length > 0)

  return (
    <div className="relative">
      <div className={cn(
        'hidden md:flex items-center gap-2.5 text-sm text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors',
        open ? 'w-72 bg-white border border-zinc-200 shadow-sm' : 'w-52'
      )}>
        <Search className="w-3.5 h-3.5 ml-3 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); if (!open) openPanel() }}
          onFocus={openPanel}
          onKeyDown={handleKeyDown}
          placeholder="Hızlı ara..."
          className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-500 outline-none py-1.5 min-w-0"
        />
        {query
          ? <button onClick={() => { setQuery(''); setResults([]) }} className="mr-3 text-zinc-400 hover:text-zinc-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
          : !open && <kbd className="mr-3 text-[10px] font-mono bg-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded">⌘K</kbd>
        }
      </div>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-10 left-0 z-50 w-96 rounded-xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
            {query.length >= 2 ? (
              loading ? (
                <p className="text-xs text-zinc-500 text-center py-5">Aranıyor...</p>
              ) : results.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-5">"{query}" için sonuç bulunamadı</p>
              ) : (
                <div className="py-1 max-h-96 overflow-y-auto">
                  {results.map((r, i) => {
                    const Icon = TYPE_ICONS[r.type] ?? Package
                    return (
                      <button key={i} onClick={() => handleSelect(r)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-zinc-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-900 truncate">{r.title}</p>
                          {r.subtitle && <p className="text-xs text-zinc-500 truncate">{r.subtitle}</p>}
                        </div>
                        <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded flex-shrink-0">{TYPE_LABELS[r.type]}</span>
                      </button>
                    )
                  })}
                </div>
              )
            ) : recent.length > 0 ? (
              <div className="py-2">
                <div className="flex items-center justify-between px-3 pb-1">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Son Aramalar</p>
                  <button onClick={() => { clearRecent(); setRecent([]) }} className="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors">Temizle</button>
                </div>
                {recent.map((r, i) => (
                  <button key={i} onClick={() => { setQuery(r); inputRef.current?.focus() }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 transition-colors text-left">
                    <Clock className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                    <span className="text-sm text-zinc-700">{r}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

function LiveClock() {
  const [now, setNow] = useState(() => dayjs())
  useEffect(() => { const t = setInterval(() => setNow(dayjs()), 1000); return () => clearInterval(t) }, [])
  return <span className="tabular-nums">{now.format('HH:mm:ss')}</span>
}

export function Header() {
  const { resolvedTheme, setTheme } = useThemeStore()
  const { toggleAIPanel, aiPanelOpen } = useUIStore()
  const pageTitle = usePageTitle()

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-zinc-200 bg-white flex-shrink-0 sticky top-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-semibold text-zinc-900 tracking-tight">{pageTitle}</h1>
          <p className="text-[11px] text-zinc-400 -mt-0.5">
            {dayjs().format('DD MMMM YYYY, dddd')} · <LiveClock />
          </p>
        </div>
        <div className="w-px h-8 bg-zinc-100 hidden md:block" />
        <GlobalSearch />
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-all duration-150"
          title={resolvedTheme === 'dark' ? 'Açık tema' : 'Koyu tema'}
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <NotificationCenter />

        <button
          onClick={toggleAIPanel}
          className={cn(
            'p-2 rounded-lg transition-all duration-150',
            aiPanelOpen ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
          )}
          title="AI Asistan"
        >
          <BotMessageSquare className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-zinc-100 mx-0.5" />
        <UserMenu />
      </div>
    </header>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const initials = user?.full_name
    ? user.full_name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : 'MK'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-lg hover:bg-zinc-100 transition-all duration-150 group"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)' }}>
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-semibold text-zinc-900 leading-none">{user?.full_name ?? 'Mikail Kaygan'}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">{user?.role_label ?? 'CEO'}</p>
        </div>
        <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-48 z-50 rounded-xl border border-zinc-200 bg-white shadow-xl py-1 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-xs font-semibold text-zinc-900">{user?.full_name ?? 'Mikail Kaygan'}</p>
            <p className="text-[10px] text-zinc-400">{user?.role_label ?? 'CEO'}</p>
          </div>
          <button onClick={() => { navigate('/ayarlar'); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors text-left">
            <User className="w-3.5 h-3.5 text-zinc-400" />
            Profil & Ayarlar
          </button>
          <div className="h-px bg-zinc-100 my-1" />
          <button onClick={() => { logout(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left">
            <LogOut className="w-3.5 h-3.5" />
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  )
}
