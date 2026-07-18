import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Drawer, Button, Input, SmartSearch, YearStepper, NumberInput, DatePicker } from '@/components/ui'
import { assetsApi } from '@/services/assetsApi'
import { ASSET_TYPE_LABELS, ASSET_STATUS_LABELS } from '@/types/assets'
import type { AssetType, AssetStatus, AssetFormData, PartnerFormData } from '@/types/assets'
import { useBrands, useModels, useVersionsByModel, useVehicleFuels, useVehicleTransmissions, useVehicleColors, useCurrencies } from '@/hooks/useMasterData'

interface NewAssetDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editAsset?: Partial<AssetFormData> & { id?: number }
}

const EMPTY_PARTNER: PartnerFormData = { name: '', share_percent: 0 }
const PROPERTY_TYPES = ['Daire', 'Villa', 'Arsa', 'İşyeri', 'Depo', 'Tarla']
const INVESTMENT_TYPES = ['Hisse Senedi', 'Tahvil', 'Kripto', 'Fon', 'Altın', 'Döviz', 'Diğer']
const DOCUMENT_TYPES = ['Fatura', 'Sözleşme', 'Ekspertiz', 'Sigorta', 'Ruhsat', 'Diğer']

export function NewAssetDrawer({ open, onClose, onSuccess, editAsset }: NewAssetDrawerProps) {
  const isEdit = !!editAsset?.id
  const [form, setForm] = useState<AssetFormData>(() => ({
    name: '', type: 'vehicle', status: 'active', purchase_currency: 'TRY', share_percent: 100,
    ...editAsset, partners: editAsset?.partners ?? [],
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { options: brandOpts } = useBrands()
  const { options: modelOpts, loading: modelsLoading } = useModels(form.brand)
  const { options: versionOpts, loading: versionsLoading } = useVersionsByModel(form.model)
  const { options: fuelOpts } = useVehicleFuels()
  const { options: transOpts } = useVehicleTransmissions()
  const { options: colorOpts } = useVehicleColors()
  const { options: currencyOpts } = useCurrencies()

  const set = <K extends keyof AssetFormData>(key: K, value: AssetFormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const addPartner = () => setForm(prev => ({ ...prev, partners: [...(prev.partners ?? []), { ...EMPTY_PARTNER }] }))
  const removePartner = (i: number) => setForm(prev => ({ ...prev, partners: prev.partners?.filter((_, idx) => idx !== i) }))
  const setPartner = (i: number, key: keyof PartnerFormData, value: string | number) =>
    setForm(prev => {
      const partners = [...(prev.partners ?? [])]
      partners[i] = { ...partners[i], [key]: value }
      return { ...prev, partners }
    })

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Varlık adı zorunludur'); return }
    try {
      setSaving(true); setError(null)
      if (isEdit && editAsset?.id) await assetsApi.update(editAsset.id, form)
      else await assetsApi.create(form)
      onSuccess(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt hatası')
    } finally { setSaving(false) }
  }

  const t = form.type

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Varlık Düzenle' : 'Yeni Varlık'}
      subtitle="Varlık bilgilerini girin"
      width="xl"
      footer={
        <div className="flex items-center justify-between">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={onClose} disabled={saving}>İptal</Button>
            <Button onClick={handleSubmit} loading={saving}>Kaydet</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Temel Bilgiler */}
        <Section title="Temel Bilgiler">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input label="Varlık Adı *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Örn: 2022 Toyota Corolla" />
            </div>
            <div>
              <Label>Tür *</Label>
              <NativeSelect value={form.type} onChange={v => set('type', v as AssetType)}>
                {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map(k => (
                  <option key={k} value={k}>{ASSET_TYPE_LABELS[k]}</option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label>Durum</Label>
              <NativeSelect value={form.status} onChange={v => set('status', v as AssetStatus)}>
                {(Object.keys(ASSET_STATUS_LABELS) as AssetStatus[]).map(k => (
                  <option key={k} value={k}>{ASSET_STATUS_LABELS[k]}</option>
                ))}
              </NativeSelect>
            </div>
            <NumberInput
              label="Alış Fiyatı"
              value={form.purchase_price ?? null}
              onChange={v => set('purchase_price', v ?? undefined)}
              decimals={0}
              placeholder="0"
            />
            <NumberInput
              label="Güncel Değer"
              value={form.current_value ?? null}
              onChange={v => set('current_value', v ?? undefined)}
              decimals={0}
              placeholder="0"
            />
            <SmartSearch
              label="Para Birimi"
              value={form.purchase_currency}
              onChange={v => set('purchase_currency', String(v ?? 'TRY'))}
              options={currencyOpts.length ? currencyOpts : [
                { value: 'TRY', label: 'TRY' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' },
              ]}
            />
            <DatePicker
              label="Alış Tarihi"
              value={form.purchase_date ?? null}
              onChange={v => set('purchase_date', v ?? undefined)}
            />
            <NumberInput
              label="Hisse Oranım (%)"
              value={form.share_percent}
              onChange={v => set('share_percent', v ?? 100)}
              decimals={0}
              min={0}
              max={100}
              suffix="%"
            />
            <Input label="Kategori" value={form.category ?? ''} onChange={e => set('category', e.target.value)} placeholder="İsteğe bağlı" />
          </div>
        </Section>

        {/* Araç / Motosiklet / Karavan */}
        {(t === 'vehicle' || t === 'motorcycle' || t === 'caravan') && (
          <Section title={t === 'vehicle' ? 'Araç Bilgileri' : t === 'motorcycle' ? 'Motosiklet Bilgileri' : 'Karavan Bilgileri'}>
            <div className="grid grid-cols-2 gap-3">
              <SmartSearch
                label="Marka"
                value={form.brand ?? null}
                onChange={v => {
                  set('brand', String(v ?? ''))
                  set('model', undefined)
                  set('package_name', undefined)
                }}
                options={brandOpts}
                placeholder="Toyota, BMW..."
              />
              <SmartSearch
                label="Model"
                value={form.model ?? null}
                onChange={v => {
                  set('model', String(v ?? ''))
                  set('package_name', undefined)
                }}
                options={modelOpts}
                placeholder={form.brand ? 'Model seçin...' : 'Önce marka seçin'}
                disabled={!form.brand}
                loading={modelsLoading}
                emptyMessage={form.brand ? `${form.brand} için model bulunamadı` : 'Önce marka seçin'}
              />
              <SmartSearch
                label="Paket / Versiyon"
                value={form.package_name ?? null}
                onChange={v => set('package_name', String(v ?? ''))}
                options={versionOpts}
                placeholder={form.model ? 'Versiyon seçin...' : 'Önce model seçin'}
                disabled={!form.model}
                loading={versionsLoading}
              />
              <YearStepper
                label="Yıl"
                value={form.year ?? null}
                onChange={v => set('year', v)}
              />
              <NumberInput
                label="Kilometre"
                value={form.km ?? null}
                onChange={v => set('km', v ?? undefined)}
                decimals={0}
                placeholder="0"
                suffix=" km"
              />
              {t !== 'caravan' && (
                <>
                  <SmartSearch
                    label="Yakıt"
                    value={form.fuel_type ?? null}
                    onChange={v => set('fuel_type', String(v ?? ''))}
                    options={fuelOpts}
                  />
                  <SmartSearch
                    label="Vites"
                    value={form.transmission ?? null}
                    onChange={v => set('transmission', String(v ?? ''))}
                    options={transOpts}
                  />
                </>
              )}
              <Input label="Plaka" value={form.plate ?? ''} onChange={e => set('plate', e.target.value.toUpperCase())} placeholder="34 ABC 123" />
              <SmartSearch
                label="Renk"
                value={form.color ?? null}
                onChange={v => set('color', String(v ?? ''))}
                options={colorOpts}
              />
              <Input label="Hasar Durumu" value={form.damage_status ?? ''} onChange={e => set('damage_status', e.target.value)} placeholder="Hasarsız" />
              <Input label="VIN / Şasi No" value={form.vin ?? ''} onChange={e => set('vin', e.target.value)} />
            </div>
          </Section>
        )}

        {/* Gayrimenkul */}
        {t === 'real_estate' && (
          <Section title="Gayrimenkul Bilgileri">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mülk Tipi</Label>
                <NativeSelect value={form.property_type ?? ''} onChange={v => set('property_type', v)}>
                  <option value="">Seçin</option>
                  {PROPERTY_TYPES.map(p => <option key={p}>{p}</option>)}
                </NativeSelect>
              </div>
              <NumberInput label="Brüt m²" value={form.gross_area ?? null} onChange={v => set('gross_area', v ?? undefined)} decimals={0} />
              <NumberInput label="Net m²" value={form.net_area ?? null} onChange={v => set('net_area', v ?? undefined)} decimals={0} />
              <Input label="Oda Sayısı" value={form.room_count ?? ''} onChange={e => set('room_count', e.target.value)} placeholder="3+1" />
              <NumberInput label="Bina Yaşı" value={form.building_age ?? null} onChange={v => set('building_age', v ?? undefined)} decimals={0} />
              <Input label="Kat" value={form.floor_number ?? ''} onChange={e => set('floor_number', e.target.value)} placeholder="3. Kat" />
              <div className="col-span-2"><Input label="Adres" value={form.location_address ?? ''} onChange={e => set('location_address', e.target.value)} /></div>
            </div>
          </Section>
        )}

        {/* Tekne */}
        {t === 'boat' && (
          <Section title="Tekne Bilgileri">
            <div className="grid grid-cols-2 gap-3">
              <SmartSearch label="Marka" value={form.brand ?? null} onChange={v => set('brand', String(v ?? ''))} options={brandOpts} />
              <Input label="Model" value={form.model ?? ''} onChange={e => set('model', e.target.value)} />
              <YearStepper label="Yıl" value={form.year ?? null} onChange={v => set('year', v)} />
              <NumberInput label="Uzunluk (m)" value={form.length_m ?? null} onChange={v => set('length_m', v ?? undefined)} decimals={1} />
              <Input label="Motor Gücü" value={form.engine_power ?? ''} onChange={e => set('engine_power', e.target.value)} placeholder="200 HP" />
              <Input label="Tekne Ruhsat No" value={form.boat_reg_number ?? ''} onChange={e => set('boat_reg_number', e.target.value)} />
            </div>
          </Section>
        )}

        {/* İş Makinesi */}
        {t === 'construction_equipment' && (
          <Section title="İş Makinesi Bilgileri">
            <div className="grid grid-cols-2 gap-3">
              <SmartSearch label="Marka" value={form.brand ?? null} onChange={v => set('brand', String(v ?? ''))} options={brandOpts} />
              <Input label="Model" value={form.model ?? ''} onChange={e => set('model', e.target.value)} />
              <YearStepper label="Yıl" value={form.year ?? null} onChange={v => set('year', v)} />
              <Input label="Makine Türü" value={form.equipment_type ?? ''} onChange={e => set('equipment_type', e.target.value)} placeholder="Kepçe, Vinç..." />
              <NumberInput label="Motor Saati" value={form.engine_hours ?? null} onChange={v => set('engine_hours', v ?? undefined)} decimals={0} />
              <Input label="Seri No" value={form.serial_number ?? ''} onChange={e => set('serial_number', e.target.value)} />
            </div>
          </Section>
        )}

        {/* Yatırım */}
        {t === 'investment' && (
          <Section title="Yatırım Bilgileri">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Yatırım Türü</Label>
                <NativeSelect value={form.investment_type ?? ''} onChange={v => set('investment_type', v)}>
                  <option value="">Seçin</option>
                  {INVESTMENT_TYPES.map(i => <option key={i}>{i}</option>)}
                </NativeSelect>
              </div>
              <Input label="Kurum / Platform" value={form.institution ?? ''} onChange={e => set('institution', e.target.value)} placeholder="Garanti, Binance..." />
              <NumberInput label="Adet / Lot" value={form.units ?? null} onChange={v => set('units', v ?? undefined)} decimals={4} />
              <NumberInput label="Birim Fiyat" value={form.unit_price ?? null} onChange={v => set('unit_price', v ?? undefined)} decimals={4} />
            </div>
          </Section>
        )}

        {/* Nakit */}
        {t === 'cash' && (
          <Section title="Nakit Bilgileri">
            <div className="col-span-2">
              <Input label="Banka / Cüzdan" value={form.bank_wallet ?? ''} onChange={e => set('bank_wallet', e.target.value)} placeholder="Garanti Bankası, MetaMask..." />
            </div>
          </Section>
        )}

        {/* Notlar */}
        <Section title="Notlar">
          <textarea
            value={form.description ?? ''}
            onChange={e => set('description', e.target.value)}
            rows={3}
            placeholder="İsteğe bağlı notlar..."
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Section>

        {/* Hissedarlar */}
        <Section
          title="Hissedarlar"
          action={
            <button onClick={addPartner} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="w-3.5 h-3.5" /> Ekle
            </button>
          }
        >
          {(form.partners ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Henüz hissedar eklenmedi.</p>
          ) : (
            <div className="space-y-3">
              {(form.partners ?? []).map((partner, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Input value={partner.name} onChange={e => setPartner(i, 'name', e.target.value)} placeholder="Ad Soyad" />
                  </div>
                  <div className="col-span-2">
                    <NumberInput value={partner.share_percent} onChange={v => setPartner(i, 'share_percent', v ?? 0)} decimals={0} suffix="%" min={0} max={100} />
                  </div>
                  <div className="col-span-4">
                    <Input value={partner.phone ?? ''} onChange={e => setPartner(i, 'phone', e.target.value)} placeholder="Telefon" />
                  </div>
                  <div className="col-span-1 flex justify-end pb-0.5">
                    <button onClick={() => removePartner(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </Drawer>
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-foreground mb-1.5">{children}</label>
}

function NativeSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {children}
    </select>
  )
}

const DOCUMENT_TYPES_EXPORT = DOCUMENT_TYPES
export { DOCUMENT_TYPES_EXPORT as DOCUMENT_TYPES }
