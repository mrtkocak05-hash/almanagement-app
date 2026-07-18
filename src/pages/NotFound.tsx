import { useNavigate } from 'react-router-dom'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
        <span className="text-3xl font-bold text-muted-foreground">404</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Sayfa Bulunamadı</h1>
        <p className="text-muted-foreground">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
      </div>
      <button
        onClick={() => navigate('/')}
        className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Ana Sayfaya Dön
      </button>
    </div>
  )
}
