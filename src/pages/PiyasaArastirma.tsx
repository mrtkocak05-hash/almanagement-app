import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, BarChart2, Tag } from 'lucide-react'
import { Button, PageLoading } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { marketResearchApi } from '@/services/marketResearchApi'
import type { MarketResearch, ResearchCategory } from '@/types/marketResearch'
import { RESEARCH_CATEGORIES, RESEARCH_CATEGORY_LABELS } from '@/types/marketResearch'
import { OpportunityScore } from '@/modules/piyasa-arastirma/OpportunityScore'
import { ResearchForm } from '@/modules/piyasa-arastirma/ResearchForm'
import { ResearchDetail } from '@/modules/piyasa-arastirma/ResearchDetail'

const CATEGORY_COLORS: Record<string, string> = {
  arac: 'bg-purple-500/10 text-purple-500',
  gayrimenkul: 'bg-blue-500/10 text-blue-500',
  motosiklet: 'bg-indigo-500/10 text-indigo-500',
  tekne: 'bg-cyan-500/10 text-cyan-500',
  karavan: 'bg-teal-500/10 text-teal-500',
  is_makinesi: 'bg-orange-500/10 text-orange-500',
  other: 'bg-muted text-muted-foreground',
}

export function PiyasaArastirma() {
  const [researches, setResearches] = useState<MarketResearch[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ResearchCategory | ''>('')
  const [showForm, setShowForm] = useState(false)
  const [editResearch, setEditResearch] = useState<MarketResearch | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await marketResearchApi.list({
        search: search || undefined,
        category: categoryFilter || undefined,
      })
      setResearches(res.data ?? [])
      setTotal(res.total ?? 0)
    } catch (_) {}
    setLoading(false)
  }, [search, categoryFilter])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  async function handleDelete(r: MarketResearch) {
    if (!confirm(`"${r.title}" araştırması silinsin mi?`)) return
    await marketResearchApi.delete(r.id)
    load()
  }

  if (selectedId !== null) {
    return (
      <div className="p-6">
        <ResearchDetail researchId={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground">Piyasa Araştırma</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{total} araştırma</p>
        </div>
        <Button onClick={() => { setEditResearch(null); setShowForm(true) }}
          style={{ backgroundColor: '#D97706', color: 'white' }}>
          <Plus className="w-4 h-4 mr-1.5" />
          Yeni Araştırma
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <input
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-amber-500/60 transition-colors"
            placeholder="Araştırma ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!categoryFilter ? 'text-white' : 'text-muted-foreground hover:bg-accent'}`}
            style={!categoryFilter ? { backgroundColor: '#D97706' } : undefined}
          >
            Tümü
          </button>
          {RESEARCH_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value === categoryFilter ? '' : cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${categoryFilter === cat.value ? 'text-white' : 'text-muted-foreground hover:bg-accent'}`}
              style={categoryFilter === cat.value ? { backgroundColor: '#D97706' } : undefined}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <PageLoading />
      ) : researches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <BarChart2 className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Henüz araştırma yok</p>
            <p className="text-sm text-muted-foreground">İlk piyasa araştırmanızı oluşturun</p>
          </div>
          <Button onClick={() => setShowForm(true)} style={{ backgroundColor: '#D97706', color: 'white' }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Yeni Araştırma
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {researches.map(r => {
            const catColor = CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS.other
            const listingCount = r.listing_count ?? 0
            const avgPrice = r.avg_price
            const dummyOpportunity = listingCount > 0 ? {
              score: 70 + Math.min(listingCount * 2, 20),
              rating: 'normal' as const,
              stars: 3,
            } : null

            return (
              <div
                key={r.id}
                className="group rounded-2xl border border-border bg-card hover:border-amber-500/40 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
                onClick={() => setSelectedId(r.id)}
              >
                {/* Card header */}
                <div className="p-4 border-b border-border flex-shrink-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 ${catColor}`}>
                        <Tag className="w-2.5 h-2.5" />
                        {RESEARCH_CATEGORY_LABELS[r.category]}
                      </span>
                      <p className="text-sm font-semibold text-foreground leading-snug">{r.title}</p>
                      {(r.brand || r.model) && (
                        <p className="text-xs text-muted-foreground mt-1">{[r.brand, r.model].filter(Boolean).join(' ')}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditResearch(r); setShowForm(true) }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground transition-colors">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete(r)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">İlan</p>
                      <p className="text-lg font-bold text-foreground">{listingCount}</p>
                    </div>
                    <div className="text-center border-x border-border">
                      <p className="text-[10px] text-muted-foreground">Ort. Fiyat</p>
                      <p className="text-xs font-bold text-foreground">{avgPrice ? formatCurrency(avgPrice, 'TRY') : '—'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Min Fiyat</p>
                      <p className="text-xs font-semibold text-green-500">{r.min_price ? formatCurrency(r.min_price, 'TRY') : '—'}</p>
                    </div>
                  </div>
                  {dummyOpportunity && <OpportunityScore opportunity={dummyOpportunity} size="sm" />}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <ResearchForm
          research={editResearch ?? undefined}
          onClose={() => { setShowForm(false); setEditResearch(null) }}
          onSave={load}
        />
      )}
    </div>
  )
}
