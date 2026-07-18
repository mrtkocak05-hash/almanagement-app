import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        /* Gold gradient — primary action (matching AlCIO) */
        default:     'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white hover:from-yellow-700 hover:to-yellow-600 shadow-sm',
        /* Black — secondary action */
        secondary:   'bg-zinc-900 text-white hover:bg-zinc-800',
        /* Danger */
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        /* Stroke */
        outline:     'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300',
        /* Transparent */
        ghost:       'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
        /* Text link */
        link:        'text-yellow-600 underline-offset-4 hover:underline',
        /* Explicit gold alias */
        gold:        'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white hover:from-yellow-700 hover:to-yellow-600 shadow-sm',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-8 rounded-md px-3 text-xs',
        lg:      'h-11 rounded-lg px-6',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

export { buttonVariants }
