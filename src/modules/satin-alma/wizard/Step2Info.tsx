import { Input, SmartSearch, YearStepper, NumberInput } from '@/components/ui'
import { ASSET_TYPE_LABELS } from '@/types/assets'
import type { AssetType } from '@/types/assets'
import type { PurchaseWizardData } from '@/types/purchases'
import {
  useBrands,
  useModels,
  useVersionsByModel,
  useVehicleFuels,
  useVehicleTransmissions,
  useVehicleColors,
} from '@/hooks/useMasterData'

type F = PurchaseWizardData
type SetFn = <K extends keyof F>(key: K, value: F[K]) => void
interface Props { data: F; set: SetFn }

const PROP_TYPES = ['Daire', 'Villa', 'Arsa', 'İşyeri', 'Dükkan', 'Depo', 'Tarla']
const INV_TYPES = ['Hisse Senedi', 'Tahvil', 'Kripto', 'Fon', 'Altın', 'Döviz', 'Diğer']

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-foreground mb-1.5">{children}</label>
}

function Sel({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {children}
    </select>
  )
}

export function Step2Info({ data, set }: Props) {
  const t: AssetType = data.type

  const { options: brandOpts, loading: brandsLoading, fetchError: brandsError } = useBrands()
  const { options: modelOpts, loading: modelsLoading } = useModels(data.brand)
  const { options: versionOpts, loading: versionsLoading } = useVersionsByModel(data.model)
  const { options: fuelOpts } = useVehicleFuels()
  const { options: transOpts } = useVehicleTransmissions()
  const { options: colorOpts } = useVehicleColors()

  function onBrandChange(v: string | number | null) {
    set('brand', String(v ?? ''))
    set('model', undefined)
    set('package_name', undefined)
  }

  function onModelChange(v: string | number | null) {
    set('model', String(v ?? ''))
    set('package_name', undefined)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{ASSET_TYPE_LABELS[t]} Bilgileri</h2>
        <p className="text-sm text-muted-foreground mt-1">Varlığa ait teknik bilgileri girin</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Input
            label="Varlık Adı *"
            required
            value={data.asset_name}
            onChange={e => set('asset_name', e.target.value)}
            placeholder="Örn: 2022 Toyota Corolla"
          />
        </div>
      </div>

      {/* Araç / Motosiklet / Karavan */}
      {(t === 'vehicle' || t === 'motorcycle' || t === 'caravan') && (
        <div className="grid grid-cols-2 gap-3">
          {/* Brand */}
          <SmartSearch
            label="Marka"
            value={data.brand ?? null}
            onChange={onBrandChange}
            options={brandOpts}
            placeholder="Toyota, BMW..."
            loading={brandsLoading}
            error={brandsError ?? undefined}
            emptyMessage="Marka listesi yükleniyor..."
          />

          {/* Model — disabled until brand selected */}
          <SmartSearch
            label="Model"
            value={data.model ?? null}
            onChange={onModelChange}
            options={modelOpts}
            placeholder={data.brand ? 'Model seçin...' : 'Önce marka seçin'}
            disabled={!data.brand}
            loading={modelsLoading}
            emptyMessage={data.brand ? `${data.brand} için model bulunamadı` : 'Önce marka seçin'}
          />

          {/* Version — disabled until model selected */}
          {t === 'vehicle' && (
            <SmartSearch
              label="Paket / Versiyon"
              value={data.package_name ?? null}
              onChange={v => set('package_name', String(v ?? ''))}
              options={versionOpts}
              placeholder={data.model ? 'Versiyon seçin...' : 'Önce model seçin'}
              disabled={!data.model}
              loading={versionsLoading}
            />
          )}

          <YearStepper label="Yıl" value={data.year ?? null} onChange={v => set('year', v)} />
          <NumberInput
            label="Kilometre"
            value={data.km ?? null}
            onChange={v => set('km', v ?? undefined)}
            decimals={0}
            suffix=" km"
          />

          {t !== 'caravan' && (
            <>
              <SmartSearch
                label="Yakıt"
                value={data.fuel_type ?? null}
                onChange={v => set('fuel_type', String(v ?? ''))}
                options={fuelOpts}
              />
              <SmartSearch
                label="Vites"
                value={data.transmission ?? null}
                onChange={v => set('transmission', String(v ?? ''))}
                options={transOpts}
              />
            </>
          )}

          <Input
            label="Plaka"
            value={data.plate ?? ''}
            onChange={e => set('plate', e.target.value.toUpperCase())}
            placeholder="34 ABC 123"
          />
          <SmartSearch
            label="Renk"
            value={data.color ?? null}
            onChange={v => set('color', String(v ?? ''))}
            options={colorOpts}
          />
          <Input label="VIN / Şasi" value={data.vin ?? ''} onChange={e => set('vin', e.target.value)} />
          <Input label="Motor No" value={data.engine_number ?? ''} onChange={e => set('engine_number', e.target.value)} />
          <Input label="Motor Hacmi" value={data.engine_size ?? ''} onChange={e => set('engine_size', e.target.value)} placeholder="1.4 TFSI" />
          <div className="col-span-2">
            <Input label="Hasar Bilgisi" value={data.damage_status ?? ''} onChange={e => set('damage_status', e.target.value)} placeholder="Hasarsız" />
          </div>
        </div>
      )}

      {/* Gayrimenkul */}
      {t === 'real_estate' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Mülk Tipi</Label>
            <Sel value={data.property_type ?? ''} onChange={v => set('property_type', v)}>
              <option value="">Seçin</option>
              {PROP_TYPES.map(p => <option key={p}>{p}</option>)}
            </Sel>
          </div>
          <div>
            <Label>Tapu Türü</Label>
            <Sel value={data.title_deed_type ?? ''} onChange={v => set('title_deed_type', v)}>
              <option value="">Seçin</option>
              {['Kat Mülkiyeti', 'Kat İrtifakı', 'Hisseli Tapu', 'Arsa Tapusu', 'Muhdes'].map(v => <option key={v}>{v}</option>)}
            </Sel>
          </div>
          <Input label="Ada" value={data.ada ?? ''} onChange={e => set('ada', e.target.value)} placeholder="123" />
          <Input label="Parsel" value={data.parsel ?? ''} onChange={e => set('parsel', e.target.value)} placeholder="45" />
          <Input label="Bağımsız Bölüm" value={data.independent_section ?? ''} onChange={e => set('independent_section', e.target.value)} placeholder="6" />
          <Input label="Kat" value={data.floor_number ?? ''} onChange={e => set('floor_number', e.target.value)} placeholder="3. Kat" />
          <Input label="Oda Sayısı" value={data.room_count ?? ''} onChange={e => set('room_count', e.target.value)} placeholder="3+1" />
          <NumberInput label="Brüt m²" value={data.gross_area ?? null} onChange={v => set('gross_area', v ?? undefined)} decimals={0} />
          <NumberInput label="Net m²" value={data.net_area ?? null} onChange={v => set('net_area', v ?? undefined)} decimals={0} />
          <NumberInput label="Bina Yaşı" value={data.building_age ?? null} onChange={v => set('building_age', v ?? undefined)} decimals={0} />
          <div>
            <Label>Cephe</Label>
            <Sel value={data.front_exposure ?? ''} onChange={v => set('front_exposure', v)}>
              <option value="">Seçin</option>
              {['Kuzey', 'Güney', 'Doğu', 'Batı', 'Güneydoğu', 'Güneybatı', 'Kuzeydoğu', 'Kuzeybatı'].map(v => <option key={v}>{v}</option>)}
            </Sel>
          </div>
          <div>
            <Label>Isınma</Label>
            <Sel value={data.heating_type ?? ''} onChange={v => set('heating_type', v)}>
              <option value="">Seçin</option>
              {['Doğalgaz (Merkezi)', 'Doğalgaz (Kombi)', 'Elektrik', 'Klima', 'Soba', 'Kat Kaloriferi', 'Güneş Enerjisi'].map(v => <option key={v}>{v}</option>)}
            </Sel>
          </div>
          <div>
            <Label>Kullanım Durumu</Label>
            <Sel value={data.usage_status ?? ''} onChange={v => set('usage_status', v)}>
              <option value="">Seçin</option>
              {['Boş', 'Kiracılı', 'Mülk Sahibi Kullanımında'].map(v => <option key={v}>{v}</option>)}
            </Sel>
          </div>
          <div className="col-span-2"><Input label="Konum / Adres" value={data.location_address ?? ''} onChange={e => set('location_address', e.target.value)} /></div>
          <div className="col-span-2"><Input label="Tapu / Sicil Bilgisi" value={data.title_deed ?? ''} onChange={e => set('title_deed', e.target.value)} placeholder="Kadastro bilgisi, yevmiye no..." /></div>
        </div>
      )}

      {/* Tekne */}
      {t === 'boat' && (
        <div className="grid grid-cols-2 gap-3">
          <SmartSearch label="Marka" value={data.brand ?? null} onChange={v => set('brand', String(v ?? ''))} options={brandOpts} />
          <Input label="Model" value={data.model ?? ''} onChange={e => set('model', e.target.value)} />
          <YearStepper label="Yıl" value={data.year ?? null} onChange={v => set('year', v)} />
          <NumberInput label="Uzunluk (m)" value={data.length_m ?? null} onChange={v => set('length_m', v ?? undefined)} decimals={1} />
          <Input label="Motor Gücü" value={data.engine_power ?? ''} onChange={e => set('engine_power', e.target.value)} placeholder="200 HP" />
          <Input label="Tekne Ruhsat" value={data.boat_reg_number ?? ''} onChange={e => set('boat_reg_number', e.target.value)} />
        </div>
      )}

      {/* İş Makinesi */}
      {t === 'construction_equipment' && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Makine Türü" value={data.equipment_type ?? ''} onChange={e => set('equipment_type', e.target.value)} placeholder="Kepçe, Vinç, Forklift..." />
          <SmartSearch label="Marka" value={data.brand ?? null} onChange={v => set('brand', String(v ?? ''))} options={brandOpts} loading={brandsLoading} />
          <Input label="Model" value={data.model ?? ''} onChange={e => set('model', e.target.value)} placeholder="330D, R944C..." />
          <YearStepper label="Yıl" value={data.year ?? null} onChange={v => set('year', v)} />
          <NumberInput label="Çalışma Saati" value={data.engine_hours ?? null} onChange={v => set('engine_hours', v ?? undefined)} decimals={0} suffix=" saat" />
          <Input label="Seri No" value={data.serial_number ?? ''} onChange={e => set('serial_number', e.target.value)} />
          <Input label="Motor Gücü" value={data.engine_power ?? ''} onChange={e => set('engine_power', e.target.value)} placeholder="250 HP" />
          <SmartSearch label="Yakıt" value={data.fuel_type ?? null} onChange={v => set('fuel_type', String(v ?? ''))} options={fuelOpts} />
        </div>
      )}

      {/* Yatırım */}
      {t === 'investment' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Yatırım Türü</Label>
            <Sel value={data.investment_type ?? ''} onChange={v => set('investment_type', v)}>
              <option value="">Seçin</option>
              {INV_TYPES.map(i => <option key={i}>{i}</option>)}
            </Sel>
          </div>
          <Input label="Kurum / Platform" value={data.institution ?? ''} onChange={e => set('institution', e.target.value)} />
          <NumberInput label="Adet / Lot" value={data.units ?? null} onChange={v => set('units', v ?? undefined)} decimals={4} />
          <NumberInput label="Birim Fiyat" value={data.unit_price ?? null} onChange={v => set('unit_price', v ?? undefined)} decimals={4} />
        </div>
      )}

      {/* Nakit */}
      {t === 'cash' && (
        <div className="grid grid-cols-1 gap-3">
          <Input label="Banka / Cüzdan" value={data.bank_wallet ?? ''} onChange={e => set('bank_wallet', e.target.value)} placeholder="Garanti Bankası..." />
        </div>
      )}

      <div>
        <Label>Açıklama / Notlar</Label>
        <textarea
          value={data.description ?? ''}
          onChange={e => set('description', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  )
}
