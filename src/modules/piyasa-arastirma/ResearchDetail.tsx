import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { Button, PageLoading } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'
import { marketResearchApi } from '@/services/marketResearchApi'
import type { MarketResearchDetail, MarketListing } from '@/types/marketResearch'
import { RESEARCH_CATEGORY_LABELS } from '@/types/marketResearch'
import { OpportunityScore } from './OpportunityScore'
import { PriceStatsCard } from './PriceStats'
import { ListingForm } from './ListingForm'

interface Props { researchId: number; onBack: () => void }

export function ResearchDetail({ researchId, onBack }: Props) {
  const [data, setData] = useState<MarketResearchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showListingForm, setShowListingForm] = useState(false)
  const [editListing, setEditListing] = useState<MarketListing | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await marketResearchApi.get(researchId)) } catch (_) {}
    setLoading(false)
  }, [researchId])

  useEffect(() => { load() }, [load])

  if (loading) return <PageLoading />
  if (!data) return <div className="p-6 text-sm text-muted-foreground">Araştırma bulunamadı</div>

  async function deleteListing(l: MarketListing) {
    if (!confirm(`"${l.title}" ilanı silinsin mi?`)) return
    await marketResearchApi.deleteListing(researchId, l.id)
    load()
  }

  const filterSummary = [
    data.brand, data.model, data.version,
    data.year_from && data.year_to ? `${data.year_from}–${data.year_to}` : data.year_from ?? data.year_to,
    data.fuel_type, data.transmission, data.province,
  ].filter(Boolean).join(' · ')

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors mt-0.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-base font-semibold text-foreground">{data.title}</h2>
            <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
              {RESEARCH_CATEGORY_LABELS[data.category]}
            </span>
            {data.opportunity && <OpportunityScore opportunity={data.opportunity} size="sm" />}
          </div>
          {filterSummary && <p className="text-xs text-muted-foreground mt-1">{filterSummary}</p>}
        </div>
      </div>

      {/* Stats */}
      <PriceStatsCard stats={data.stats} />

      {/* Listings header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">İlanlar ({data.listings.length})</p>
        <Button size="sm" onClick={() => { setEditListing(null); setShowListingForm(true) }}
          style={{ backgroundColor: '#D97706', color: 'white' }}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          İlan Ekle
        </Button>
      </div>

      {/* Listings table */}
      {data.listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-sm text-muted-foreground">Henüz ilan eklenmedi</p>
          <button onClick={() => { setEditListing(null); setShowListingForm(true) }}
            className="text-xs text-amber-600 hover:underline">İlk ilanı ekle</button>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İlan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Platform</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Fiyat</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">KM</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tarih</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.listings.map(l => (
                <tr key={l.id} className="hover:bg-accent/20 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate max-w-[220px]">{l.title}</p>
                      {l.url && (
                        <a href={l.url} target="_blank" rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-amber-500 transition-colors flex-shrink-0">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {l.seller && <p className="text-[10px] text-muted-foreground">{l.seller}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{l.platform ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{formatCurrency(l.price, l.currency as 'TRY')}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                    {l.km != null ? `${l.km.toLocaleString('tr-TR')} km` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{l.listing_date ? formatDate(l.listing_date) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditListing(l); setShowListingForm(true) }}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-accent text-muted-foreground transition-colors">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => deleteListing(l)}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Notlar</p>
          <p className="text-sm text-foreground">{data.notes}</p>
        </div>
      )}

      {showListingForm && (
        <ListingForm
          researchId={researchId}
          listing={editListing ?? undefined}
          onClose={() => { setShowListingForm(false); setEditListing(null) }}
          onSave={load}
        />
      )}
    </div>
  )
}
