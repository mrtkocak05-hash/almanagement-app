import { cn } from '@/utils/cn'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-[3px]',
}

export function Loading({ size = 'md', className, text }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <span
        className={cn(
          'rounded-full border-muted-foreground/30 border-t-foreground animate-spin',
          sizes[size]
        )}
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <Loading size="lg" text="Yükleniyor..." />
    </div>
  )
}
