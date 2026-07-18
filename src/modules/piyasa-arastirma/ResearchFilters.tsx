import type { ResearchCategory, CreateResearchPayload } from '@/types/marketResearch'

type FilterValues = Partial<CreateResearchPayload>
interface Props {
  category: ResearchCategory
  values: FilterValues
  onChange: (key: keyof FilterValues, value: string | number | undefined) => void
}

const FUEL_TYPES = ['Benzin', 'Dizel', 'LPG', 'Hibrit', 'Elektrik', 'Benzin+LPG']
const TRANSMISSION_TYPES = ['Manuel', 'Otomatik', 'Yarı Otomatik']
const ROOM_COUNTS = ['1+0', '1+1', '2+1', '3+1', '3+2', '4+1', '4+2', '5+1', '5+2', '6+']

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-amber-500/60 transition-colors'
const selectCls = `${inputCls} cursor-pointer`

export function ResearchFilters({ category, values, onChange }: Props) {
  const set = (k: keyof FilterValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = e.target.value
    onChange(k, v === '' ? undefined : isNaN(Number(v)) ? v : Number(v))
  }

  if (category === 'arac' || category === 'motosiklet' || category === 'karavan') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <F label="Marka">
          <input className={inputCls} value={values.brand ?? ''} onChange={set('brand')} placeholder="Toyota, BMW..." />
        </F>
        <F label="Model">
          <input className={inputCls} value={values.model ?? ''} onChange={set('model')} placeholder="Corolla, X5..." />
        </F>
        {category === 'arac' && (
          <F label="Versiyon">
            <input className={inputCls} value={values.version ?? ''} onChange={set('version')} placeholder="1.6 Premium..." />
          </F>
        )}
        <F label="Model Yılı (başlangıç)">
          <input className={inputCls} type="number" value={values.year_from ?? ''} onChange={set('year_from')} placeholder="2018" />
        </F>
        <F label="Model Yılı (bitiş)">
          <input className={inputCls} type="number" value={values.year_to ?? ''} onChange={set('year_to')} placeholder="2023" />
        </F>
        <F label="KM (min)">
          <input className={inputCls} type="number" value={values.km_from ?? ''} onChange={set('km_from')} placeholder="0" />
        </F>
        <F label="KM (max)">
          <input className={inputCls} type="number" value={values.km_to ?? ''} onChange={set('km_to')} placeholder="150000" />
        </F>
        {category !== 'karavan' && (
          <>
            <F label="Yakıt">
              <select className={selectCls} value={values.fuel_type ?? ''} onChange={set('fuel_type')}>
                <option value="">Tümü</option>
                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </F>
            <F label="Vites">
              <select className={selectCls} value={values.transmission ?? ''} onChange={set('transmission')}>
                <option value="">Tümü</option>
                {TRANSMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </F>
          </>
        )}
        <F label="İl">
          <input className={inputCls} value={values.province ?? ''} onChange={set('province')} placeholder="İstanbul, Ankara..." />
        </F>
      </div>
    )
  }

  if (category === 'gayrimenkul') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <F label="Tür">
          <input className={inputCls} value={values.property_type ?? ''} onChange={set('property_type')} placeholder="Daire, Villa, Arsa..." />
        </F>
        <F label="Oda Sayısı">
          <select className={selectCls} value={values.room_count ?? ''} onChange={set('room_count')}>
            <option value="">Tümü</option>
            {ROOM_COUNTS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </F>
        <F label="Alan (m²) min">
          <input className={inputCls} type="number" value={values.area_from ?? ''} onChange={set('area_from')} placeholder="60" />
        </F>
        <F label="Alan (m²) max">
          <input className={inputCls} type="number" value={values.area_to ?? ''} onChange={set('area_to')} placeholder="200" />
        </F>
        <div className="col-span-2">
          <F label="İl">
            <input className={inputCls} value={values.province ?? ''} onChange={set('province')} placeholder="İstanbul, Ankara..." />
          </F>
        </div>
      </div>
    )
  }

  if (category === 'tekne') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <F label="Uzunluk (m) min">
          <input className={inputCls} type="number" value={values.length_from ?? ''} onChange={set('length_from')} placeholder="6" />
        </F>
        <F label="Uzunluk (m) max">
          <input className={inputCls} type="number" value={values.length_to ?? ''} onChange={set('length_to')} placeholder="20" />
        </F>
        <F label="Marka">
          <input className={inputCls} value={values.brand ?? ''} onChange={set('brand')} placeholder="Marka..." />
        </F>
        <F label="Model">
          <input className={inputCls} value={values.model ?? ''} onChange={set('model')} placeholder="Model..." />
        </F>
        <div className="col-span-2">
          <F label="İl">
            <input className={inputCls} value={values.province ?? ''} onChange={set('province')} placeholder="Bodrum, Marmaris..." />
          </F>
        </div>
      </div>
    )
  }

  if (category === 'is_makinesi') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <F label="Makine Türü">
          <input className={inputCls} value={values.property_type ?? ''} onChange={set('property_type')} placeholder="Ekskavatör, Beko..." />
        </F>
        <F label="Marka">
          <input className={inputCls} value={values.brand ?? ''} onChange={set('brand')} placeholder="CAT, Komatsu..." />
        </F>
        <F label="Model">
          <input className={inputCls} value={values.model ?? ''} onChange={set('model')} placeholder="Model..." />
        </F>
        <F label="Çalışma Saati (max)">
          <input className={inputCls} type="number" value={values.km_to ?? ''} onChange={set('km_to')} placeholder="5000" />
        </F>
        <div className="col-span-2">
          <F label="İl">
            <input className={inputCls} value={values.province ?? ''} onChange={set('province')} placeholder="İl..." />
          </F>
        </div>
      </div>
    )
  }

  // Default (other)
  return (
    <div className="grid grid-cols-1 gap-3">
      <F label="İl">
        <input className={inputCls} value={values.province ?? ''} onChange={set('province')} placeholder="İl..." />
      </F>
    </div>
  )
}
