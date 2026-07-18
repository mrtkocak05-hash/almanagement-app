import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Check } from 'lucide-react'
import { assetsApi } from '@/services/assetsApi'
import { salesApi } from '@/services/salesApi'
import { ASSET_TYPE_LABELS } from '@/types/assets'
import { formatCurrency } from '@/utils/format'
import type { Asset } from '@/types/assets'
import type { SaleWizardData } from '@/types/sales'
import { cn } from '@/utils/cn'

interface Props {
  data: SaleWizardData
  set: <K extends keyof SaleWizardData>(key: K, value: SaleWizardData[K]) => void
  setMany: (partial: Partial<SaleWizardData>) => void
  onConfirm?: () => void // called on double-click or Enter when asset is selected
}

export function Step1Asset({ data, setMany, onConfirm }: Props) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [contextLoading, setContextLoading] = useState(false)
  const [keyboardIndex, setKeyboardIndex] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    assetsApi.list({ status: 'active', limit: 200 }).then(r => {
      setAssets(r.items)
      setLoading(false)
    }).catch(() => setLoading(false))
    // Focus search on mount
    setTimeout(() => searchRef.current?.focus(), 50)
  }, [])

  const filtered = assets.filter(a =>
    !search ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    ASSET_TYPE_LABELS[a.type]?.toLowerCase().includes(search.toLowerCase())
  )

  // Reset keyboard index when filter changes
  useEffect(() => { setKeyboardIndex(-1) }, [search])

  // Scroll keyboard-highlighted row into view
  useEffect(() => {
    if (keyboardIndex < 0 || !listRef.current) return
    const el = listRef.current.children[keyboardIndex] as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [keyboardIndex])

  const doSelect = useCallback(async (asset: Asset) => {
    try {
      setContextLoading(true)
      const ctx = await salesApi.getAssetContext(asset.id) as unknown as Record<string, unknown>
      setMany({
        asset_id: asset.id,
        asset_name: asset.name,
        asset_type: asset.type,
        purchase_id: (ctx.purchase_id as number) || null,
        purchase_price_try: (ctx.purchase_price_try as number) || 0,
        total_purchase_expenses_try: (ctx.total_purchase_expenses_try as number) || 0,
        total_cost_try: (ctx.total_cost_try as number) || (ctx.purchase_price_try as number) || 0,
        share_percent: (ctx.share_percent as number) || 100,
        purchase_date: (ctx.purchase_date as string) || null,
      })
    } catch {
      setMany({
        asset_id: asset.id,
        asset_name: asset.name,
        asset_type: asset.type,
        purchase_id: null,
        purchase_price_try: asset.purchase_price || 0,
        total_purchase_expenses_try: 0,
        total_cost_try: asset.current_value || asset.purchase_price || 0,
        share_percent: asset.share_percent || 100,
        purchase_date: asset.purchase_date || null,
      })
    } finally {
      setContextLoading(false)
    }
  }, [setMany])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (filtered.length === 0) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setKeyboardIndex(i => Math.min(i + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setKeyboardIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter': {
        e.preventDefault()
        const target = keyboardIndex >= 0 ? filtered[keyboardIndex] : null
        if (target) {
          doSelect(target).then(() => {
            if (onConfirm) setTimeout(onConfirm, 100)
          })
        } else if (data.asset_id && onConfirm) {
          onConfirm()
        }
        break
      }
      case 'Escape':
        setSearch('')
        searchRef.current?.blur()
        break
    }
  }

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Satış Yapılacak Varlık</h2>
        <p className="text-sm text-muted-foreground mt-1">Yalnızca aktif varlıklar listeleniyor</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={searchRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Varlık ara..."
          autoComplete="off"
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Aktif varlık bulunamadı</p>
      ) : (
        <div ref={listRef} className="space-y-1.5 max-h-72 overflow-y-auto overscroll-contain pr-0.5">
          {filtered.map((asset, idx) => {
            const selected = data.asset_id === asset.id
            const kbHighlighted = keyboardIndex === idx
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => doSelect(asset)}
                onDoubleClick={() => {
                  doSelect(asset).then(() => {
                    if (onConfirm) setTimeout(onConfirm, 100)
                  })
                }}
                disabled={contextLoading}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border-l-4 text-left transition-all',
                  'focus:outline-none',
                  selected
                    ? 'border-l-primary bg-primary/10 border-t border-r border-b border-primary/20'
                    : kbHighlighted
                      ? 'border-l-muted-foreground bg-accent border-t border-r border-b border-border'
                      : 'border-l-transparent border-t border-r border-b border-border hover:border-l-muted-foreground/40 hover:bg-accent/60',
                  contextLoading && 'opacity-60 pointer-events-none',
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors',
                  selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}>
                  {asset.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    selected ? 'text-foreground' : 'text-foreground',
                  )}>
                    {asset.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {ASSET_TYPE_LABELS[asset.type]}
                    {asset.current_value != null && ` · ${formatCurrency(asset.current_value)}`}
                  </p>
                </div>

                {/* Check */}
                {selected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Selected asset summary */}
      {data.asset_id && data.total_cost_try > 0 && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm space-y-1">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="font-semibold text-foreground">{data.asset_name}</p>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground pl-6">
            <span>Toplam Maliyet: <span className="text-foreground font-semibold">{formatCurrency(data.total_cost_try)}</span></span>
            {data.share_percent < 100 && <span>Hisse: <span className="text-foreground">{data.share_percent}%</span></span>}
            {data.purchase_date && <span>Alım: <span className="text-foreground">{data.purchase_date}</span></span>}
          </div>
        </div>
      )}
    </div>
  )
}
