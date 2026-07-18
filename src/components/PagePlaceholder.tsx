import { type LucideIcon } from 'lucide-react'

interface PagePlaceholderProps {
  icon: LucideIcon
  title: string
  description: string
  module?: string
}

export function PagePlaceholder({ icon: Icon, title, description, module }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>

      <div className="max-w-sm">
        <h1 className="text-xl font-semibold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {module && (
        <div className="px-3 py-1.5 rounded-full bg-accent border border-border">
          <span className="text-xs text-muted-foreground font-medium">{module}</span>
        </div>
      )}
    </div>
  )
}
