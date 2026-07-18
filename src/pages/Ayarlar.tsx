import { useState, memo, useEffect, useCallback } from 'react'
import {
  Building2, User, Palette, Bell, HardDrive, Bot, Key, Shield,
  Save, CheckCircle2, Eye, EyeOff, CheckCircle, XCircle, RefreshCw,
  Terminal, BarChart3, Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeStore } from '@/store/themeStore'
import { api } from '@/services/api'
import { authApi } from '@/services/authApi'
import type { Company } from '@/types/company'
import { getSettings, updateSettings, getProviderStatus, getCosts } from '@/services/ai/aiService'
import type { AISettings, AIProviderStatusMap, CostSummary } from '@/services/ai/types'
import { PERSONAS } from '@/services/ai/personaEngine'
import { formatCostUSD, PROVIDER_LABELS, PROVIDER_COLORS } from '@/services/ai/costTracker'
import { devApi, type DevStatistics } from '@/services/devApi'

type Tab = 'sirket' | 'profil' | 'tema' | 'bildirim' | 'yedekleme' | 'ai' | 'api' | 'guvenlik' | 'developer'

const BASE_TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'sirket',    label: 'Şirket',    icon: Building2  },
  { id: 'profil',    label: 'Profil',    icon: User       },
  { id: 'tema',      label: 'Tema',      icon: Palette    },
  { id: 'bildirim',  label: 'Bildirim',  icon: Bell       },
  { id: 'yedekleme', label: 'Yedekleme', icon: HardDrive  },
  { id: 'ai',        label: 'AI',        icon: Bot        },
  { id: 'api',       label: 'API',       icon: Key        },
  { id: 'guvenlik',  label: 'Güvenlik',  icon: Shield     },
  { id: 'developer', label: 'Developer', icon: Terminal   },
]

// ─── Company Tab ──────────────────────────────────────────────────────────────
const SirketTab = memo(function SirketTab() {
  const [company, setCompany] = useState<Partial<Company>>({})
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    try {
      const existing = await api.get<Company[]>('/companies').catch(() => null)
      if (existing && existing.length > 0) {
        await api.put(`/companies/${existing[0].id}`, company)
      } else {
        await api.post('/companies', company)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (_) {}
  }

  const F = ({ label, value, onChange, type = 'text', placeholder = '' }: {
    label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
  }) => (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/60" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <F label="Şirket Adı" value={company.company_name ?? ''} onChange={v => setCompany(p => ({ ...p, company_name: v }))} placeholder="AlManagement Ltd." />
        <F label="Vergi Numarası" value={company.tax_number ?? ''} onChange={v => setCompany(p => ({ ...p, tax_number: v }))} placeholder="1234567890" />
        <F label="Vergi Dairesi" value={company.tax_office ?? ''} onChange={v => setCompany(p => ({ ...p, tax_office: v }))} placeholder="Beşiktaş" />
        <F label="Telefon" value={company.phone ?? ''} onChange={v => setCompany(p => ({ ...p, phone: v }))} placeholder="+90 212 000 00 00" />
        <F label="E-posta" value={company.mail ?? ''} onChange={v => setCompany(p => ({ ...p, mail: v }))} type="email" placeholder="info@firma.com" />
        <F label="Para Birimi" value={company.currency ?? 'TRY'} onChange={v => setCompany(p => ({ ...p, currency: v }))} placeholder="TRY" />
      </div>
      <F label="Adres" value={company.address ?? ''} onChange={v => setCompany(p => ({ ...p, address: v }))} placeholder="İstanbul, Türkiye" />
      <button onClick={handleSave}
        className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all', saved ? 'bg-green-500' : 'hover:opacity-90')}
        style={!saved ? { backgroundColor: '#D97706' } : undefined}>
        {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Kaydedildi!' : 'Kaydet'}
      </button>
    </div>
  )
})

// ─── Profile Tab ─────────────────────────────────────────────────────────────
const ProfilTab = memo(function ProfilTab() {
  const { user } = useAuth()
  const [form, setForm] = useState({ full_name: user?.full_name ?? '', phone: user?.phone ?? '' })
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    try {
      await api.put('/users/profile', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (_) {}
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
          style={{ backgroundColor: '#D97706' }}>
          {user?.full_name?.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() ?? 'U'}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{user?.full_name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-amber-600 mt-0.5">{user?.role_label}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Ad Soyad</label>
          <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/60" />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Telefon</label>
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/60" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-foreground mb-1.5">E-posta</label>
          <input value={user?.email ?? ''} disabled
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/40 text-muted-foreground cursor-not-allowed" />
        </div>
      </div>
      <button onClick={handleSave}
        className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all', saved ? 'bg-green-500' : 'hover:opacity-90')}
        style={!saved ? { backgroundColor: '#D97706' } : undefined}>
        {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Kaydedildi!' : 'Kaydet'}
      </button>
    </div>
  )
})

// ─── Theme Tab ────────────────────────────────────────────────────────────────
const TemaTab = memo(function TemaTab() {
  const { theme, setTheme, resolvedTheme } = useThemeStore()
  const options = [
    { id: 'light' as const, label: 'Açık', desc: 'Her zaman açık tema' },
    { id: 'dark' as const, label: 'Koyu', desc: 'Her zaman koyu tema' },
    { id: 'system' as const, label: 'Sistem', desc: 'İşletim sistemi tercihi' },
  ]
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Aktif tema: <span className="font-medium text-foreground">{resolvedTheme === 'dark' ? 'Koyu' : 'Açık'}</span></p>
      <div className="grid grid-cols-3 gap-3">
        {options.map(o => (
          <button key={o.id} onClick={() => setTheme(o.id)}
            className={cn('rounded-xl border p-4 text-left transition-all',
              theme === o.id ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:border-border/80 hover:bg-accent/30')}>
            <p className={cn('text-sm font-semibold', theme === o.id ? 'text-amber-600' : 'text-foreground')}>{o.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{o.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
})

// ─── Notification Tab ─────────────────────────────────────────────────────────
const BildirimTab = memo(function BildirimTab() {
  const LS_KEY = 'alm_notif_prefs'
  const defaults = { info: true, success: true, warning: true, critical: true, ai: true }
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') } } catch { return defaults }
  })
  const labels: Record<string, string> = { info: 'Bilgi', success: 'Başarı', warning: 'Uyarı', critical: 'Kritik', ai: 'AI Bildirimleri' }
  function toggle(key: string) {
    setPrefs(p => {
      const next = { ...p, [key]: !p[key] }
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      return next
    })
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Hangi bildirim türlerini almak istediğinizi seçin.</p>
      {Object.entries(labels).map(([k, label]) => (
        <div key={k} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
          <p className="text-sm text-foreground">{label}</p>
          <button onClick={() => toggle(k)}
            className={cn('relative w-10 h-5.5 rounded-full transition-colors', prefs[k] ? 'bg-amber-500' : 'bg-muted')}
            style={{ height: '22px', width: '40px' }}>
            <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all', prefs[k] ? 'right-0.5' : 'left-0.5')} />
          </button>
        </div>
      ))}
    </div>
  )
})

// ─── Backup Tab ───────────────────────────────────────────────────────────────
const YedeklemeTab = memo(function YedeklemeTab() {
  const [loading, setLoading] = useState(false)
  async function handleExport() {
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    alert('Yedekleme özelliği backend entegrasyonu ile aktif edilecek.')
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-foreground mb-1">Veritabanı Yedeği</p>
        <p className="text-xs text-muted-foreground mb-3">Tüm verilerinizi SQLite formatında dışa aktarın.</p>
        <button onClick={handleExport} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#D97706' }}>
          <HardDrive className="w-4 h-4" />
          {loading ? 'Hazırlanıyor...' : 'Yedeği İndir'}
        </button>
      </div>
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs text-amber-600 font-medium">Otomatik Yedekleme</p>
        <p className="text-xs text-muted-foreground mt-1">Günlük otomatik yedekleme — gelecek sprintte aktif edilecek.</p>
      </div>
    </div>
  )
})

// ─── AI Tab ───────────────────────────────────────────────────────────────────
const AITab = memo(function AITab() {
  const [settings, setSettings] = useState<Partial<AISettings>>({
    provider: 'rule_engine', claude_model: 'claude-sonnet-4-6', openai_model: 'gpt-4o',
    gemini_model: 'gemini-2.0-flash', temperature: 0.7, max_tokens: 2000,
    system_prompt: null, persona: 'ceo', memory_enabled: 1,
    fallback_provider: 'rule_engine', cost_limit_daily: 0, auto_summary: 0,
  })
  const [status, setStatus] = useState<AIProviderStatusMap | null>(null)
  const [costs, setCosts] = useState<CostSummary | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getSettings().then(s => setSettings(s)).catch(() => {}),
      getProviderStatus().then(s => setStatus(s)).catch(() => {}),
      getCosts().then(c => setCosts(c)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    try {
      await updateSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (_) {}
  }

  const PROVIDER_OPTIONS = [
    { id: 'rule_engine' as const, label: 'Yerel Motor (Ücretsiz)', desc: 'API anahtarı gerekmez' },
    { id: 'claude' as const, label: 'Claude (Anthropic)', desc: 'En gelişmiş analiz' },
    { id: 'openai' as const, label: 'GPT-4o (OpenAI)', desc: 'Güçlü dil modeli' },
    { id: 'gemini' as const, label: 'Gemini (Google)', desc: 'Google AI platformu' },
  ]

  const CLAUDE_MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5', 'claude-opus-4-8']
  const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini']
  const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-pro']

  if (loading) {
    return <div className="flex items-center justify-center py-12"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  }

  const totalCostAll = (costs?.total ?? []).reduce((s, e) => s + e.cost, 0)

  return (
    <div className="space-y-5">
      {/* Provider status */}
      {status && (
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-semibold text-foreground mb-3">Sağlayıcı Durumu</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(status).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                {val.configured
                  ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                <span className={val.configured ? 'text-foreground' : 'text-muted-foreground'}>
                  {PROVIDER_LABELS[key] ?? key}
                </span>
                {val.configured && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white ml-auto"
                    style={{ backgroundColor: PROVIDER_COLORS[key] ?? '#6B7280' }}>aktif</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            API anahtarları sadece <code className="bg-muted/40 px-1 rounded">.env</code> dosyasında saklanır. Frontend'e gönderilmez.
          </p>
        </div>
      )}

      {/* Provider selector */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Aktif Sağlayıcı</p>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDER_OPTIONS.map(p => {
            const configured = p.id === 'rule_engine' || (status?.[p.id as keyof AIProviderStatusMap]?.configured ?? false)
            return (
              <button key={p.id} onClick={() => setSettings(s => ({ ...s, provider: p.id }))}
                disabled={!configured}
                className={cn('rounded-xl border p-3 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                  settings.provider === p.id ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:bg-accent/30')}>
                <p className={cn('text-xs font-semibold', settings.provider === p.id ? 'text-amber-600' : 'text-foreground')}>{p.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{configured ? p.desc : 'API anahtarı yapılandırılmamış'}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Model selector */}
      {settings.provider !== 'rule_engine' && (
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Model</label>
          <select
            value={settings.provider === 'claude' ? settings.claude_model : settings.provider === 'openai' ? settings.openai_model : settings.gemini_model}
            onChange={e => {
              const key = settings.provider === 'claude' ? 'claude_model' : settings.provider === 'openai' ? 'openai_model' : 'gemini_model'
              setSettings(s => ({ ...s, [key]: e.target.value }))
            }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/60">
            {(settings.provider === 'claude' ? CLAUDE_MODELS : settings.provider === 'openai' ? OPENAI_MODELS : GEMINI_MODELS).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {/* Persona */}
      <div>
        <label className="block text-xs font-medium text-foreground mb-1.5">Varsayılan Persona</label>
        <div className="grid grid-cols-4 gap-1.5">
          {PERSONAS.map(p => (
            <button key={p.key} onClick={() => setSettings(s => ({ ...s, persona: p.key }))}
              className={cn('rounded-lg border py-2 text-center text-[10px] transition-all',
                settings.persona === p.key ? 'border-amber-500 bg-amber-500/10 text-amber-600 font-semibold' : 'border-border hover:bg-accent/30 text-foreground')}>
              <div>{p.icon}</div>
              <div className="mt-0.5">{p.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Temperature */}
      <div>
        <div className="flex justify-between mb-1.5">
          <label className="text-xs font-medium text-foreground">Yaratıcılık (Temperature)</label>
          <span className="text-xs text-amber-600 font-mono">{(settings.temperature ?? 0.7).toFixed(1)}</span>
        </div>
        <input type="range" min="0" max="1" step="0.1"
          value={settings.temperature ?? 0.7}
          onChange={e => setSettings(s => ({ ...s, temperature: parseFloat(e.target.value) }))}
          className="w-full accent-amber-500" />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
          <span>Kesin</span><span>Dengeli</span><span>Yaratıcı</span>
        </div>
      </div>

      {/* Max tokens */}
      <div>
        <div className="flex justify-between mb-1.5">
          <label className="text-xs font-medium text-foreground">Maksimum Token</label>
          <span className="text-xs text-amber-600 font-mono">{settings.max_tokens ?? 2000}</span>
        </div>
        <input type="range" min="500" max="8000" step="500"
          value={settings.max_tokens ?? 2000}
          onChange={e => setSettings(s => ({ ...s, max_tokens: parseInt(e.target.value) }))}
          className="w-full accent-amber-500" />
      </div>

      {/* Memory toggle */}
      <div className="flex items-center justify-between py-2 border-t border-border">
        <div>
          <p className="text-sm text-foreground">AI Hafızası</p>
          <p className="text-[10px] text-muted-foreground">Önemli analizleri kaydet ve gelecek sorularda kullan</p>
        </div>
        <button onClick={() => setSettings(s => ({ ...s, memory_enabled: s.memory_enabled ? 0 : 1 }))}
          className={cn('relative rounded-full transition-colors flex-shrink-0')}
          style={{ width: 40, height: 22, backgroundColor: settings.memory_enabled ? '#D97706' : undefined }}
          data-active={!!settings.memory_enabled}>
          <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
            settings.memory_enabled ? 'right-0.5' : 'left-0.5')} />
        </button>
      </div>

      {/* Auto Summary toggle */}
      <div className="flex items-center justify-between py-2 border-b border-border">
        <div>
          <p className="text-sm text-foreground">Otomatik Özet</p>
          <p className="text-[10px] text-muted-foreground">Her sohbet sonunda AI özetini hafızaya kaydet</p>
        </div>
        <button onClick={() => setSettings(s => ({ ...s, auto_summary: s.auto_summary ? 0 : 1 }))}
          className={cn('relative rounded-full transition-colors flex-shrink-0')}
          style={{ width: 40, height: 22, backgroundColor: settings.auto_summary ? '#D97706' : undefined }}>
          <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
            settings.auto_summary ? 'right-0.5' : 'left-0.5')} />
        </button>
      </div>

      {/* Fallback Provider */}
      <div>
        <label className="block text-xs font-medium text-foreground mb-1.5">Yedek Sağlayıcı</label>
        <select
          value={settings.fallback_provider ?? 'rule_engine'}
          onChange={e => setSettings(s => ({ ...s, fallback_provider: e.target.value as AISettings['fallback_provider'] }))}
          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/60">
          <option value="rule_engine">Yerel Motor (Ücretsiz)</option>
          <option value="claude">Claude (Anthropic)</option>
          <option value="openai">GPT-4o (OpenAI)</option>
          <option value="gemini">Gemini (Google)</option>
        </select>
        <p className="text-[10px] text-muted-foreground mt-1">Birincil sağlayıcı başarısız olursa kullanılır.</p>
      </div>

      {/* Daily Cost Limit */}
      <div>
        <div className="flex justify-between mb-1.5">
          <label className="text-xs font-medium text-foreground">Günlük Maliyet Limiti (USD)</label>
          <span className="text-xs text-amber-600 font-mono">${(settings.cost_limit_daily ?? 0).toFixed(2)}</span>
        </div>
        <input type="range" min="0" max="50" step="0.5"
          value={settings.cost_limit_daily ?? 0}
          onChange={e => setSettings(s => ({ ...s, cost_limit_daily: parseFloat(e.target.value) }))}
          className="w-full accent-amber-500" />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
          <span>$0 (Limitsiz)</span><span>$25</span><span>$50</span>
        </div>
      </div>

      {/* Cost summary */}
      {costs && costs.total.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-semibold text-foreground mb-2">Toplam AI Maliyeti</p>
          <div className="space-y-1.5">
            {costs.total.map(e => (
              <div key={e.provider} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[e.provider] ?? '#6B7280' }} />
                  <span className="text-foreground">{PROVIDER_LABELS[e.provider] ?? e.provider}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{e.requests} istek</span>
                  <span className="font-mono text-foreground">{formatCostUSD(e.cost)}</span>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-1.5 flex justify-between text-xs font-semibold">
              <span className="text-foreground">Toplam</span>
              <span className="text-amber-600 font-mono">{formatCostUSD(totalCostAll)}</span>
            </div>
          </div>
        </div>
      )}

      <button onClick={handleSave}
        className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all', saved ? 'bg-green-500' : 'hover:opacity-90')}
        style={!saved ? { backgroundColor: '#D97706' } : undefined}>
        {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Kaydedildi!' : 'Ayarları Kaydet'}
      </button>
    </div>
  )
})

// ─── API Tab ──────────────────────────────────────────────────────────────────
const APITab = memo(function APITab() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-foreground mb-1">API Adresi</p>
        <code className="text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded">http://localhost:3001/api</code>
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-foreground mb-1">Sağlık Kontrolü</p>
        <code className="text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded">GET /api/health</code>
      </div>
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs text-amber-600 font-medium">Webhook Yapılandırması</p>
        <p className="text-xs text-muted-foreground mt-1">Harici sistemlere bildirim gönderme — gelecek sprintte aktif edilecek.</p>
      </div>
    </div>
  )
})

// ─── Security Tab ─────────────────────────────────────────────────────────────
const GuvenlikTab = memo(function GuvenlikTab() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [showPass, setShowPass] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleChange() {
    if (form.new_password !== form.confirm_password) {
      setStatus('error'); setMsg('Yeni şifreler eşleşmiyor.')
      return
    }
    if (form.new_password.length < 8) {
      setStatus('error'); setMsg('Şifre en az 8 karakter olmalıdır.')
      return
    }
    setStatus('loading')
    try {
      const result = await authApi.changePassword(form.current_password, form.new_password)
      setStatus('success'); setMsg(result.message)
      setForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (e) {
      setStatus('error'); setMsg(e instanceof Error ? e.message : 'Hata oluştu.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">Şifre Değiştir</p>
        {['current_password', 'new_password', 'confirm_password'].map(field => {
          const labels: Record<string, string> = { current_password: 'Mevcut Şifre', new_password: 'Yeni Şifre', confirm_password: 'Şifreyi Onayla' }
          return (
            <div key={field}>
              <label className="block text-xs font-medium text-foreground mb-1.5">{labels[field]}</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'}
                  value={form[field as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full pr-9 pl-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/60" />
                {field === 'current_password' && (
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {msg && (
          <p className={cn('text-xs', status === 'success' ? 'text-green-500' : 'text-red-400')}>{msg}</p>
        )}
        <button onClick={handleChange} disabled={status === 'loading'}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#D97706' }}>
          <Shield className="w-4 h-4" />
          {status === 'loading' ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
        </button>
      </div>
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs text-amber-600 font-medium">İki Faktörlü Doğrulama</p>
        <p className="text-xs text-muted-foreground mt-1">2FA desteği — gelecek sprintte aktif edilecek.</p>
      </div>
    </div>
  )
})

// ─── Developer Tab ────────────────────────────────────────────────────────────
type ActionState = 'idle' | 'loading' | 'success' | 'error'

const DeveloperTab = memo(function DeveloperTab() {
  const [stats, setStats] = useState<DevStatistics | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({})
  const [messages, setMessages] = useState<Record<string, string>>({})

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const s = await devApi.getStatistics()
      setStats(s)
    } catch (e) {
      setStats(null)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => { void loadStats() }, [loadStats])

  async function runAction(key: string, fn: () => Promise<{ message: string } | Record<string, unknown>>, confirm?: string) {
    if (confirm && !window.confirm(confirm)) return
    setActionStates(p => ({ ...p, [key]: 'loading' }))
    setMessages(p => ({ ...p, [key]: '' }))
    try {
      const r = await fn() as { message?: string }
      setActionStates(p => ({ ...p, [key]: 'success' }))
      setMessages(p => ({ ...p, [key]: r?.message ?? 'Başarılı!' }))
      setTimeout(() => setActionStates(p => ({ ...p, [key]: 'idle' })), 3000)
      void loadStats()
    } catch (e) {
      setActionStates(p => ({ ...p, [key]: 'error' }))
      setMessages(p => ({ ...p, [key]: e instanceof Error ? e.message : 'Hata oluştu.' }))
      setTimeout(() => setActionStates(p => ({ ...p, [key]: 'idle' })), 4000)
    }
  }

  function ActionCard({
    id, emoji, title, desc, label, fn, confirmMsg, variant = 'default',
  }: {
    id: string; emoji: string; title: string; desc: string; label: string
    fn: () => Promise<{ message: string } | Record<string, unknown>>
    confirmMsg?: string; variant?: 'default' | 'danger'
  }) {
    const state = actionStates[id] ?? 'idle'
    const msg = messages[id]
    const isLoading = state === 'loading'
    const btnColor = variant === 'danger' ? '#DC2626' : '#D97706'

    return (
      <div className={cn('rounded-xl border p-4 space-y-3', variant === 'danger' ? 'border-red-200 dark:border-red-900/40' : 'border-border')}>
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          </div>
        </div>
        <button
          onClick={() => runAction(id, fn, confirmMsg)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-all"
          style={{ backgroundColor: state === 'success' ? '#22C55E' : state === 'error' ? '#EF4444' : btnColor }}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
           state === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
           state === 'error' ? <XCircle className="w-4 h-4" /> : null}
          {isLoading ? 'İşlem yapılıyor...' : state === 'success' ? 'Tamamlandı!' : state === 'error' ? 'Hata!' : label}
        </button>
        {msg && (
          <p className={cn('text-xs px-3 py-2 rounded-lg', state === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500')}>
            {msg}
          </p>
        )}
      </div>
    )
  }

  function StatRow({ label, value, sub }: { label: string; value: number; sub?: string }) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
        <span className="text-sm text-foreground">{label}</span>
        <div className="text-right">
          <span className="text-sm font-bold text-amber-600">{value.toLocaleString('tr-TR')}</span>
          {sub && <span className="text-xs text-muted-foreground ml-1.5">{sub}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Warning banner */}
      <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-500/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="w-4 h-4 text-red-500" />
          <p className="text-sm font-semibold text-red-600">Geliştirici Paneli</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Bu panel yalnızca geliştirme amaçlıdır. Üretim ortamında dikkatli kullanın.
          Sil işlemleri geri alınamaz.
        </p>
      </div>

      {/* Action cards grid */}
      <div className="grid grid-cols-1 gap-3">
        <ActionCard
          id="reset"
          emoji="🗑"
          title="Veritabanını Temizle"
          desc="Tüm işlem verilerini siler (assets, purchases, sales, expenses vb.). Seed tablolar korunur."
          label="Veritabanını Temizle"
          fn={() => devApi.resetDatabase()}
          confirmMsg="Veritabanını temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          variant="danger"
        />
        <ActionCard
          id="company"
          emoji="🏢"
          title="Demo Şirket Oluştur"
          desc="Şirket adını 'MK Premium Yatırım A.Ş.' olarak günceller."
          label="Demo Şirket Oluştur"
          fn={() => devApi.createDemoCompany()}
        />
        <ActionCard
          id="demo"
          emoji="📊"
          title="Demo Verileri Yükle"
          desc="MK Premium portföyü: 6 araç, 3 gayrimenkul, 3 iş makinesi + banka hesapları + giderler + AI analizleri."
          label="Demo Verileri Yükle"
          fn={() => devApi.loadDemoData()}
          confirmMsg="Mevcut verilerin üzerine demo veri yüklenecek. Devam edilsin mi?"
        />
        <ActionCard
          id="rebuild"
          emoji="🔄"
          title="Dashboard Yeniden Oluştur"
          desc="Döviz kurlarını günceller, günlük aktiviteler ekler, AI hafıza özeti oluşturur."
          label="Dashboard Yeniden Oluştur"
          fn={() => devApi.rebuildDashboard()}
        />
        <ActionCard
          id="clear"
          emoji="🧹"
          title="Demo Temizle"
          desc="Reset ile aynı işlevi görür — tüm demo verilerini temizler."
          label="Demo Temizle"
          fn={() => devApi.clearDemo()}
          confirmMsg="Demo verilerini silmek istediğinizden emin misiniz?"
          variant="danger"
        />
      </div>

      {/* Statistics */}
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-semibold text-foreground">Veritabanı İstatistikleri</p>
          </div>
          <button onClick={() => void loadStats()} disabled={statsLoading}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <RefreshCw className={cn('w-3 h-3', statsLoading && 'animate-spin')} />
            Yenile
          </button>
        </div>
        {statsLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <div>
            <StatRow label="Toplam Varlık"       value={stats.total_assets}           sub={`(${stats.total_vehicles} araç)`} />
            <StatRow label="Toplam Satınalma"    value={stats.total_purchases}        sub={`${(stats.total_purchases_amount/1000000).toFixed(1)}M TL`} />
            <StatRow label="Toplam Satış"        value={stats.total_sales}            sub={stats.total_sales_amount > 0 ? `${(stats.total_sales_amount/1000000).toFixed(1)}M TL` : undefined} />
            <StatRow label="Toplam Gider"        value={stats.total_expenses}         sub={stats.total_expenses_amount > 0 ? `${(stats.total_expenses_amount/1000).toFixed(0)}K TL` : undefined} />
            <StatRow label="Toplam Belge"        value={stats.total_documents} />
            <StatRow label="Toplam Aktivite"     value={stats.total_activities} />
            <StatRow label="Toplam AI Hafızası"  value={stats.total_ai_memories} />
            <StatRow label="Banka Hesabı"        value={stats.total_bank_accounts} />
            <StatRow label="Okunmamış Bildirim"  value={stats.unread_notifications} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">İstatistikler yüklenemedi.</p>
        )}
      </div>
    </div>
  )
})

// ─── Main Ayarlar Page ───────────────────────────────────────────────────────
export function Ayarlar() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('sirket')

  const isCeo = user?.role === 'ceo'
  const TABS = isCeo ? BASE_TABS : BASE_TABS.filter(t => t.id !== 'developer')

  const tabContent: Record<Tab, React.ReactNode> = {
    sirket:    <SirketTab />,
    profil:    <ProfilTab />,
    tema:      <TemaTab />,
    bildirim:  <BildirimTab />,
    yedekleme: <YedeklemeTab />,
    ai:        <AITab />,
    api:       <APITab />,
    guvenlik:  <GuvenlikTab />,
    developer: <DeveloperTab />,
  }

  return (
    <div className="flex gap-6 min-h-[calc(100vh-120px)]">
      {/* Sidebar nav */}
      <div className="w-48 flex-shrink-0">
        <Card className="p-2">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isDev = tab.id === 'developer'
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left mb-0.5',
                  activeTab === tab.id
                    ? 'text-white font-semibold'
                    : isDev
                      ? 'text-red-500 hover:bg-red-500/10'
                      : 'text-foreground hover:bg-accent/60')}
                style={activeTab === tab.id ? { backgroundColor: isDev ? '#DC2626' : '#D97706' } : undefined}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </Card>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Card className="p-6">
          <h2 className="text-base font-semibold text-foreground mb-5">
            {TABS.find(t => t.id === activeTab)?.label}
          </h2>
          {tabContent[activeTab]}
        </Card>
      </div>
    </div>
  )
}
