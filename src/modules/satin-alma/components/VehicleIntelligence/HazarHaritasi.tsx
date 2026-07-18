import { useState } from 'react'
import type { VehiclePart, PartStatus } from '@/types/vehicleIntelligence'
import { PART_LABELS, STATUS_LABELS, STATUS_COLORS, ALL_STATUSES } from '@/types/vehicleIntelligence'

interface Props {
  parts: VehiclePart[]
  onPartChange: (partKey: string, status: PartStatus, notes?: string) => void
  readonly?: boolean
}

function getStatusColor(status: PartStatus): string {
  return STATUS_COLORS[status] ?? STATUS_COLORS.orijinal
}

function getPartStatus(parts: VehiclePart[], key: string): PartStatus {
  return (parts.find(p => p.part_key === key)?.status ?? 'orijinal') as PartStatus
}

interface PartDef {
  key: string
  d?: string
  shape?: 'rect' | 'ellipse' | 'path'
  x?: number; y?: number; width?: number; height?: number
  cx?: number; cy?: number; rx?: number; ry?: number
}

const CAR_PARTS: PartDef[] = [
  // Ön tampon
  { key: 'on_tampon',         shape: 'rect', x: 65, y: 18, width: 130, height: 28 },
  // Kaput
  { key: 'kaput',             shape: 'rect', x: 55, y: 50, width: 150, height: 90 },
  // Ön fenerler (farlar)
  { key: 'farlar',            shape: 'rect', x: 30, y: 28, width: 32, height: 40 },
  // Sol ön çamurluk
  { key: 'sol_on_camurluk',   shape: 'rect', x: 25, y: 68, width: 30, height: 72 },
  // Sağ ön çamurluk
  { key: 'sag_on_camurluk',   shape: 'rect', x: 205, y: 68, width: 30, height: 72 },
  // Sol ön kapı
  { key: 'sol_on_kapi',       shape: 'rect', x: 20, y: 148, width: 35, height: 75 },
  // Sağ ön kapı
  { key: 'sag_on_kapi',       shape: 'rect', x: 205, y: 148, width: 35, height: 75 },
  // Sol arka kapı
  { key: 'sol_arka_kapi',     shape: 'rect', x: 20, y: 230, width: 35, height: 75 },
  // Sağ arka kapı
  { key: 'sag_arka_kapi',     shape: 'rect', x: 205, y: 230, width: 35, height: 75 },
  // Tavan
  { key: 'tavan',             shape: 'rect', x: 60, y: 148, width: 140, height: 157 },
  // Sol arka çamurluk
  { key: 'sol_arka_camurluk', shape: 'rect', x: 25, y: 312, width: 30, height: 72 },
  // Sağ arka çamurluk
  { key: 'sag_arka_camurluk', shape: 'rect', x: 205, y: 312, width: 30, height: 72 },
  // Bagaj
  { key: 'bagaj',             shape: 'rect', x: 55, y: 360, width: 150, height: 90 },
  // Arka tampon
  { key: 'arka_tampon',       shape: 'rect', x: 65, y: 454, width: 130, height: 28 },
  // Stoplar
  { key: 'stoplar',           shape: 'rect', x: 198, y: 430, width: 32, height: 40 },
  // Sol ayna
  { key: 'sol_ayna',          shape: 'rect', x: 5, y: 152, width: 16, height: 22 },
  // Sağ ayna
  { key: 'sag_ayna',          shape: 'rect', x: 239, y: 152, width: 16, height: 22 },
  // Camlar
  { key: 'camlar',            shape: 'rect', x: 72, y: 160, width: 116, height: 140 },
  // Jantlar (all 4 wheels — treated as single part)
  { key: 'jantlar',           shape: 'rect', x: 0, y: 0, width: 0, height: 0 }, // placeholder, rendered specially
]

const WHEELS = [
  { cx: 44, cy: 180, rx: 20, ry: 28 },
  { cx: 216, cy: 180, rx: 20, ry: 28 },
  { cx: 44, cy: 320, rx: 20, ry: 28 },
  { cx: 216, cy: 320, rx: 20, ry: 28 },
]

export function HazarHaritasi({ parts, onPartChange, readonly }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ key: string; x: number; y: number } | null>(null)

  function handleClick(key: string) {
    if (readonly) return
    setSelected(prev => prev === key ? null : key)
    setTooltip(null)
  }

  function handleStatusSelect(key: string, status: PartStatus) {
    onPartChange(key, status)
    setSelected(null)
  }

  const LABEL_COLOR = '#6B7280' // muted

  return (
    <div className="flex gap-6 items-start">
      {/* SVG Car Diagram */}
      <div className="relative flex-shrink-0">
        <svg
          viewBox="0 0 260 500"
          width={220}
          height={420}
          className="rounded-xl border border-border bg-card"
        >
          {/* Body outline */}
          <rect x="55" y="18" width="150" height="464" rx="30" fill="#1e293b" stroke="#334155" strokeWidth="1" />

          {/* Parts */}
          {CAR_PARTS.filter(p => p.key !== 'jantlar').map(part => {
            const status = getPartStatus(parts, part.key)
            const color  = getStatusColor(status)
            const isSelected = selected === part.key
            const opacity = selected && !isSelected ? 0.55 : 1
            const strokeW = isSelected ? 2.5 : 1
            const strokeC = isSelected ? '#fff' : 'rgba(255,255,255,0.15)'

            if (!part.shape || part.shape === 'rect') {
              return (
                <rect
                  key={part.key}
                  x={part.x} y={part.y}
                  width={part.width} height={part.height}
                  fill={color} fillOpacity={0.82 * opacity}
                  stroke={strokeC} strokeWidth={strokeW}
                  rx={4}
                  style={{ cursor: readonly ? 'default' : 'pointer', transition: 'fill-opacity .15s' }}
                  onClick={() => handleClick(part.key)}
                  onMouseEnter={e => {
                    ;(e.target as SVGElement).closest('svg')!
                    setTooltip({ key: part.key, x: (part.x ?? 0) + (part.width ?? 0) / 2, y: (part.y ?? 0) })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            }
            return null
          })}

          {/* Wheels (jantlar) */}
          {WHEELS.map((w, i) => {
            const status = getPartStatus(parts, 'jantlar')
            const color  = getStatusColor(status)
            const isSelected = selected === 'jantlar'
            return (
              <ellipse
                key={`w${i}`}
                cx={w.cx} cy={w.cy} rx={w.rx} ry={w.ry}
                fill={color} fillOpacity={0.82}
                stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.15)'}
                strokeWidth={isSelected ? 2.5 : 1}
                style={{ cursor: readonly ? 'default' : 'pointer' }}
                onClick={() => handleClick('jantlar')}
                onMouseEnter={() => setTooltip({ key: 'jantlar', x: 130, y: 210 })}
                onMouseLeave={() => setTooltip(null)}
              />
            )
          })}

          {/* Tooltip */}
          {tooltip && (
            <g>
              <rect
                x={Math.min(tooltip.x - 30, 170)} y={tooltip.y - 24}
                width={90} height={20} rx={4}
                fill="#0f172a" fillOpacity={0.92}
              />
              <text
                x={Math.min(tooltip.x + 15, 215)} y={tooltip.y - 10}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={9}
              >
                {PART_LABELS[tooltip.key] ?? tooltip.key}
              </text>
            </g>
          )}

          {/* Labels */}
          <text x="130" y="95"  textAnchor="middle" fill={LABEL_COLOR} fontSize={8}>Kaput</text>
          <text x="130" y="345" textAnchor="middle" fill={LABEL_COLOR} fontSize={8}>Bagaj</text>
          <text x="130" y="228" textAnchor="middle" fill={LABEL_COLOR} fontSize={8}>Tavan</text>
        </svg>

        {/* Status popup */}
        {selected && !readonly && (
          <div
            className="absolute z-20 bg-popover border border-border rounded-xl shadow-lg p-2 w-44 top-0 left-full ml-2"
          >
            <p className="text-xs font-semibold text-foreground mb-2 truncate">
              {PART_LABELS[selected] ?? selected}
            </p>
            <div className="grid grid-cols-1 gap-0.5">
              {ALL_STATUSES.map(s => (
                <button
                  key={s}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted text-left text-xs transition-colors"
                  onClick={() => handleStatusSelect(selected, s)}
                >
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ background: STATUS_COLORS[s] }}
                  />
                  <span className="text-foreground">{STATUS_LABELS[s]}</span>
                  {getPartStatus(parts, selected) === s && (
                    <span className="ml-auto text-muted-foreground">✓</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="mt-1 w-full text-xs text-muted-foreground hover:text-foreground py-0.5"
            >
              Kapat
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-xs font-semibold text-foreground mb-1">Renk Göstergesi</p>
        {ALL_STATUSES.map(s => (
          <div key={s} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ background: STATUS_COLORS[s] }}
            />
            <span className="text-xs text-muted-foreground">{STATUS_LABELS[s]}</span>
          </div>
        ))}

        {/* Summary of non-original parts */}
        {parts.filter(p => p.status !== 'orijinal').length > 0 && (
          <div className="mt-3 border-t border-border pt-2">
            <p className="text-xs font-semibold text-foreground mb-1">Notlar</p>
            {parts.filter(p => p.status !== 'orijinal').map(p => (
              <div key={p.part_key} className="flex items-start gap-1 mb-0.5">
                <span
                  className="w-2 h-2 rounded-sm mt-0.5 flex-shrink-0"
                  style={{ background: STATUS_COLORS[p.status as PartStatus] }}
                />
                <span className="text-xs text-muted-foreground">
                  {PART_LABELS[p.part_key] ?? p.part_key}:{' '}
                  <span className="text-foreground">{STATUS_LABELS[p.status as PartStatus]}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
