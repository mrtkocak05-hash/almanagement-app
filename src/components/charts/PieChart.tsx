import { memo } from 'react'
import { cn } from '@/utils/cn'

export interface PieSlice {
  label: string
  value: number
  color: string
}

interface PieChartProps {
  slices: PieSlice[]
  size?: number
  strokeWidth?: number
  className?: string
}

export const PieChart = memo(function PieChart({ slices, size = 120, strokeWidth = 28, className }: PieChartProps) {
  const total = slices.reduce((s, sl) => s + sl.value, 0)
  if (!total) return null

  const r = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r

  let offset = 0
  const segments = slices.map(sl => {
    const pct = sl.value / total
    const dash = pct * circumference
    const gap = circumference - dash
    const rotation = offset * 360 - 90
    offset += pct
    return { ...sl, dash, gap, rotation, pct }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${seg.dash} ${seg.gap}`}
          strokeDashoffset={0}
          transform={`rotate(${seg.rotation} ${cx} ${cy})`}
          className="transition-all duration-500"
        />
      ))}
    </svg>
  )
})

interface PieChartLegendProps {
  slices: PieSlice[]
  formatValue?: (v: number) => string
  className?: string
}

export const PieChartLegend = memo(function PieChartLegend({ slices, formatValue, className }: PieChartLegendProps) {
  const total = slices.reduce((s, sl) => s + sl.value, 0)
  return (
    <div className={cn('space-y-1.5', className)}>
      {slices.map((sl, i) => {
        const pct = total > 0 ? (sl.value / total * 100).toFixed(1) : '0'
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sl.color }} />
            <span className="text-xs text-foreground flex-1 truncate">{sl.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
            {formatValue && <span className="text-xs font-medium text-foreground tabular-nums ml-1">{formatValue(sl.value)}</span>}
          </div>
        )
      })}
    </div>
  )
})
