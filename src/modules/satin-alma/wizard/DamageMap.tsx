import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { DamageStatus } from '@/types/purchases'
import { DAMAGE_STATUS_CONFIG } from '@/types/purchases'

interface CarPart {
  key: string
  label: string
  x: number
  y: number
  w: number
  h: number
  vertical?: boolean
}

// Top-down car view — 240×500 viewBox
// x zones: 10–54 (left), 54–186 (center), 186–230 (right)
// y zones: front 0–130, cabin 130–370, rear 370–500
const CAR_PARTS: CarPart[] = [
  { key: 'on_tampon',         label: 'Ön Tampon',          x: 54, y: 0,   w: 132, h: 24 },
  { key: 'sol_on_camurluk',   label: 'Sol Ön Çamurluk',   x: 10, y: 24,  w: 44,  h: 106, vertical: true },
  { key: 'kaput',             label: 'Kaput',              x: 54, y: 24,  w: 132, h: 76 },
  { key: 'sag_on_camurluk',   label: 'Sağ Ön Çamurluk',   x: 186,y: 24,  w: 44,  h: 106, vertical: true },
  { key: 'on_cam',            label: 'Ön Cam',             x: 54, y: 100, w: 132, h: 30 },
  { key: 'sol_on_kapi',       label: 'Sol Ön Kapı',        x: 10, y: 130, w: 44,  h: 120, vertical: true },
  { key: 'tavan',             label: 'Tavan',              x: 54, y: 130, w: 132, h: 240 },
  { key: 'sag_on_kapi',       label: 'Sağ Ön Kapı',        x: 186,y: 130, w: 44,  h: 120, vertical: true },
  { key: 'sol_arka_kapi',     label: 'Sol Arka Kapı',      x: 10, y: 250, w: 44,  h: 120, vertical: true },
  { key: 'sag_arka_kapi',     label: 'Sağ Arka Kapı',      x: 186,y: 250, w: 44,  h: 120, vertical: true },
  { key: 'sol_arka_camurluk', label: 'Sol Arka Çamurluk',  x: 10, y: 370, w: 44,  h: 106, vertical: true },
  { key: 'arka_cam',          label: 'Arka Cam',           x: 54, y: 370, w: 132, h: 30 },
  { key: 'sag_arka_camurluk', label: 'Sağ Arka Çamurluk',  x: 186,y: 370, w: 44,  h: 106, vertical: true },
  { key: 'bagaj',             label: 'Bagaj',              x: 54, y: 400, w: 132, h: 76 },
  { key: 'arka_tampon',       label: 'Arka Tampon',        x: 54, y: 476, w: 132, h: 24 },
]

const UNSET = { fill: '#f3f4f6', stroke: '#d1d5db' }

interface DamageMapProps {
  parts: Record<string, DamageStatus>
  onChange: (parts: Record<string, DamageStatus>) => void
}

export function DamageMap({ parts, onChange }: DamageMapProps) {
  const [active, setActive] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)

  const activePart = CAR_PARTS.find(p => p.key === active)

  function handleSelect(status: DamageStatus) {
    if (!active) return
    onChange({ ...parts, [active]: status })
    setActive(null)
  }

  function handleClear() {
    if (!active) return
    const next = { ...parts }
    delete next[active]
    onChange(next)
    setActive(null)
  }

  return (
    <div className="flex gap-5 items-start">
      {/* SVG car diagram */}
      <div className="flex-shrink-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 text-center">
          Üstten Görünüş
        </p>
        <svg
          viewBox="0 0 240 500"
          width="192"
          height="400"
          className="block"
          style={{ userSelect: 'none' }}
        >
          {/* Car body background */}
          <rect x="10" y="24" width="220" height="452" rx="6" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
          <rect x="54" y="0"  width="132" height="24"  rx="3" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
          <rect x="54" y="476" width="132" height="24" rx="3" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />

          {/* Windshield visual differentiation */}
          <rect x="62" y="102" width="116" height="26" rx="2" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="0.5" />
          <rect x="62" y="372" width="116" height="26" rx="2" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="0.5" />

          {CAR_PARTS.map(part => {
            const status = parts[part.key] as DamageStatus | undefined
            const cfg = status ? DAMAGE_STATUS_CONFIG[status] : null
            const isHovered = hover === part.key
            const isActive = active === part.key

            const fill = isActive
              ? '#fef3c7'
              : cfg
                ? cfg.fill
                : isHovered ? '#fef9c3' : UNSET.fill
            const stroke = isActive
              ? '#D97706'
              : cfg
                ? cfg.stroke
                : isHovered ? '#D97706' : UNSET.stroke
            const strokeWidth = isActive || isHovered ? 2 : 1

            const cx = part.x + part.w / 2
            const cy = part.y + part.h / 2

            return (
              <g
                key={part.key}
                onClick={() => setActive(active === part.key ? null : part.key)}
                onMouseEnter={() => setHover(part.key)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={part.x + 1}
                  y={part.y + 1}
                  width={part.w - 2}
                  height={part.h - 2}
                  rx={2}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
                {/* Label */}
                {part.vertical ? (
                  <text
                    x={cx}
                    y={cy}
                    transform={`rotate(-90, ${cx}, ${cy})`}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="7"
                    fontFamily="system-ui, sans-serif"
                    fill={cfg ? cfg.stroke : '#6b7280'}
                    pointerEvents="none"
                  >
                    {part.label}
                  </text>
                ) : (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="8"
                    fontFamily="system-ui, sans-serif"
                    fill={cfg ? cfg.stroke : '#6b7280'}
                    pointerEvents="none"
                  >
                    {part.label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="mt-3 flex flex-col gap-1">
          {(Object.entries(DAMAGE_STATUS_CONFIG) as [DamageStatus, typeof DAMAGE_STATUS_CONFIG[DamageStatus]][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: cfg.fill, border: `1px solid ${cfg.stroke}` }} />
              <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: UNSET.fill, border: `1px solid ${UNSET.stroke}` }} />
            <span className="text-[10px] text-muted-foreground">Seçilmemiş</span>
          </div>
        </div>
      </div>

      {/* Status selector panel */}
      <div className="flex-1 min-w-0">
        {activePart ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50/50 dark:bg-amber-900/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">{activePart.label}</p>
              <button onClick={() => setActive(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {(Object.entries(DAMAGE_STATUS_CONFIG) as [DamageStatus, typeof DAMAGE_STATUS_CONFIG[DamageStatus]][]).map(([key, cfg]) => {
                const selected = parts[activePart.key] === key
                return (
                  <button
                    key={key}
                    onClick={() => handleSelect(key)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                      selected
                        ? 'border-amber-500 text-white'
                        : 'border-border hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 text-foreground',
                    )}
                    style={selected ? { backgroundColor: '#D97706' } : undefined}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cfg.stroke }}
                    />
                    {cfg.label}
                  </button>
                )
              })}
            </div>

            {parts[activePart.key] && (
              <button
                onClick={handleClear}
                className="mt-2 w-full text-xs text-muted-foreground hover:text-destructive transition-colors py-1"
              >
                Durumu temizle
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
            <p className="text-sm font-medium text-foreground mb-1">Parça Seçin</p>
            <p className="text-xs text-muted-foreground">Araç şemasındaki bir parçaya tıklayarak durumunu belirleyin</p>

            {/* Summary of damaged parts */}
            {Object.keys(parts).length > 0 && (
              <div className="mt-4 text-left space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">İşaretlenen Parçalar</p>
                {Object.entries(parts).map(([key, status]) => {
                  const part = CAR_PARTS.find(p => p.key === key)
                  const cfg = DAMAGE_STATUS_CONFIG[status]
                  if (!part || !cfg) return null
                  return (
                    <div key={key} className="flex items-center justify-between px-2 py-1 rounded-md bg-muted/40">
                      <span className="text-xs text-foreground">{part.label}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.stroke }} />
                        <span className="text-xs" style={{ color: cfg.stroke }}>{cfg.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
