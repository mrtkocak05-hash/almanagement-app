import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive/15 text-destructive',
        outline: 'border border-border text-foreground',
        success: 'bg-green-500/15 text-green-600 dark:text-green-400',
        warning: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
        sales: 'bg-green-500/15 text-green-600 dark:text-green-400',
        purchase: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
        expense: 'bg-red-500/15 text-red-600 dark:text-red-400',
        income: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
        capital: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
