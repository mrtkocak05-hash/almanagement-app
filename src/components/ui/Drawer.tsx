import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  width?: 'md' | 'lg' | 'xl'
  children: React.ReactNode
  footer?: React.ReactNode
}

// Spec: 45vw, min 720px, max 980px
const CLAMP = {
  md: 'clamp(620px, 40vw, 820px)',
  lg: 'clamp(720px, 45vw, 980px)',
  xl: 'clamp(860px, 52vw, 1140px)',
}

export function Drawer({ open, onClose, title, subtitle, width = 'lg', children, footer }: DrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div className={cn('fixed inset-0 z-50', open ? 'pointer-events-auto' : 'pointer-events-none')}>
      {/* Backdrop — solid dark overlay */}
      <div
        ref={overlayRef}
        onClick={onClose}
        className={cn(
          'absolute inset-0 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
        style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
      />

      {/* Panel */}
      <div
        className={cn(
          'absolute right-0 top-0 h-full flex flex-col transition-transform duration-300 ease-out',
          'border-l border-border shadow-2xl',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{
          width: CLAMP[width],
          backgroundColor: 'var(--color-background)',
          opacity: 1,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-7 py-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — independent scroll */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-7 py-6">{children}</div>

        {/* Sticky Footer */}
        {footer && (
          <div className="flex-shrink-0 px-7 py-4 border-t border-border" style={{ backgroundColor: 'var(--color-background)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
