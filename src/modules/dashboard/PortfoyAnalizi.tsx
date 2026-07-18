import { memo, useMemo, useState } from 'react'
import { PieChart } from 'lucide-react'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'
import { usePortfolioBreakdown } from '@/hooks/useAIDashboard'
import type { PieSlice } from '@/components/charts/PieChart'

const TYPE_LABELS: Record<string, string> = {
  arac: 'Araç', gayrimenkul: 'Gayrimenkul', is_makinesi: 'İş Makinesi',
  tekne: 'Tekne', karavan: 'Karavan', motosiklet: 'Motosiklet',
  cash: 'Nakit', investment: 'Yatırım', other: 'Diğer',
}

const TYPE_COLORS: Record<string, string> = {
  arac: '#C9A84C', gayrimenkul: '#3B82F6', is_makinesi: '#C9A84C',
  tekne: '#06B6D4', karavan: '#10B981', motosiklet: '#8B5CF6',
  cash: '#22C55E', investment: '#EC4899', other: '#6B7280',
}

// SVG donut with hover support
function InteractivePie({ slices, size = 150, strokeWidth = 30, onHover }: {
  slices: PieSlice[]; size?: number; strokeWidth?: number
  onHover?: (i: number | null) => void
}) {
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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${seg.dash} ${seg.gap}`}
          strokeDashoffset={0}
          transform={`rotate(${seg.rotation} ${cx} ${cy})`}
          className="transition-all duration-200 cursor-pointer"
          style={{ opacity: 1 }}
          onMouseEnter={() => onHover?.(i)}
          onMouseLeave={() => onHover?.(null)}
        />
      ))}
    </svg>
  )
}

export const PortfoyAnalizi = memo(function PortfoyAnalizi() {
  const { data, loading } = usePortfolioBreakdown()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const slices: PieSlice[] = useMemo(() => {
    if (!data?.breakdown) return []
    return data.breakdown
      .filter(b => b.total_value > 0)
      .map(b => ({
        label: TYPE_LABELS[b.type] ?? b.type,
        value: b.total_value,
        color: TYPE_COLORS[b.type] ?? '#6B7280',
      }))
  }, [data])

  const total = slices.reduce((s, sl) => s + sl.value, 0)
  const hoveredSlice = hoveredIndex !== null ? slices[hoveredIndex] : null

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/15">
          <PieChart className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">Portföy Dağılımı</p>
          <p className="text-xs text-muted-foreground mt-0.5">Kategori analizi</p>
        </div>
      </div>

      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full py-8">
            <div className="w-5 h-5 rounded-full border-2 border-yellow-600/30 border-t-yellow-600 animate-spin" />
          </div>
        ) : !data || slices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 gap-2 text-center">
            <PieChart className="w-8 h-8 text-muted/20" />
            <p className="text-xs text-muted-foreground">Varlık eklendikçe grafik oluşur</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Donut chart centered */}
            <div className="flex justify-center">
              <div className="relative">
                <InteractivePie slices={slices} size={140} strokeWidth={28} onHover={setHoveredIndex} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {hoveredSlice ? (
                    <>
                      <p className="text-[10px] text-muted-foreground leading-none">{hoveredSlice.label}</p>
                      <p className="text-xs font-bold text-foreground leading-tight mt-0.5">
                        %{((hoveredSlice.value / total) * 100).toFixed(1)}
                      </p>
                      <p className="text-[9px] text-muted-foreground leading-none mt-0.5">
                        {formatCurrency(hoveredSlice.value, 'TRY')}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] text-muted-foreground leading-none">Toplam</p>
                      <p className="text-xs font-bold text-foreground leading-tight mt-0.5">
                        {formatCurrency(total, 'TRY')}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-1.5">
              {slices.map((sl, i) => {
                const pct = total > 0 ? (sl.value / total * 100).toFixed(1) : '0'
                const isHovered = hoveredIndex === i
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-all duration-150',
                      isHovered ? 'bg-accent' : 'hover:bg-accent/50'
                    )}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sl.color }} />
                    <span className="text-xs text-foreground flex-1 truncate">{sl.label}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{pct}%</span>
                    <span className="text-[10px] font-medium text-foreground tabular-nums">{formatCurrency(sl.value, 'TRY')}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
})
