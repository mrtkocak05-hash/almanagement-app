import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Building2, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  const [email, setEmail] = useState('admin@alm.com')
  const [password, setPassword] = useState('Admin123!')
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Already authenticated → redirect
  if (isAuthenticated) {
    navigate(from, { replace: true })
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password, remember)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#0F0F0F' }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-none">AlManagement</p>
            <p className="text-xs text-muted-foreground">Portföy Yönetim Sistemi</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-base font-semibold text-foreground mb-1">Giriş Yap</h1>
          <p className="text-xs text-muted-foreground mb-5">Hesabınıza erişmek için bilgilerinizi girin</p>

          {error && (
            <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@alm.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#D97706' } as React.CSSProperties}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#D97706' } as React.CSSProperties}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-amber-600" />
                <span className="text-xs text-muted-foreground">Beni hatırla</span>
              </label>
              <button type="button" onClick={() => {}} className="text-xs text-amber-600 hover:underline">
                Şifremi unuttum
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#D97706' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 p-3 rounded-xl border border-border bg-muted/30">
          <p className="text-[10px] text-muted-foreground text-center font-medium">Demo Hesabı</p>
          <p className="text-[10px] text-muted-foreground text-center">admin@alm.com / Admin123!</p>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/40 mt-5">
          AlManagement v3.0 · Sprint 10
        </p>
      </div>
    </div>
  )
}
