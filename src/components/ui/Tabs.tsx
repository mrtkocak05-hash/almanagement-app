import { cn } from '@/utils/cn'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-0 border-b border-border', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
            active === tab.id
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground/70',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
              active === tab.id
                ? 'bg-foreground/10 text-foreground'
                : 'bg-muted text-muted-foreground',
            )}>
              {tab.count}
            </span>
          )}
          {active === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  )
}
