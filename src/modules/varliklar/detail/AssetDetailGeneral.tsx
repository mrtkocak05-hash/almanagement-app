import { formatCurrency, formatDate } from '@/utils/format'
import { ASSET_TYPE_LABELS, ASSET_STATUS_LABELS } from '@/types/assets'
import type { AssetDetail } from '@/types/assets'
import { Badge } from '@/components/ui'

interface Props { asset: AssetDetail }

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-foreground flex-1">{value}</span>
    </div>
  )
}

export function AssetDetailGeneral({ asset }: Props) {
  const gain = asset.current_value != null && asset.purchase_price != null
    ? asset.current_value - asset.purchase_price
    : null

  return (
    <div className="space-y-6">
      {/* Financial */}
      <Section title="Finansal Bilgiler">
        <Row label="Alış Fiyatı" value={asset.purchase_price != null ? formatCurrency(asset.purchase_price) : null} />
        <Row label="Güncel Değer" value={asset.current_value != null ? formatCurrency(asset.current_value) : null} />
        {gain !== null && (
          <Row
            label="Kar / Zarar"
            value={
              <span className={gain >= 0 ? 'text-green-500' : 'text-red-500'}>
                {gain >= 0 ? '+' : ''}{formatCurrency(gain)}
              </span>
            }
          />
        )}
        <Row label="Hisse Oranı" value={asset.share_percent < 100 ? `%${asset.share_percent}` : '—'} />
        <Row label="Alış Tarihi" value={asset.purchase_date ? formatDate(asset.purchase_date) : null} />
        <Row label="Para Birimi" value={asset.purchase_currency} />
      </Section>

      {/* Type-specific */}
      {(asset.brand || asset.model || asset.year || asset.plate) && (
        <Section title={ASSET_TYPE_LABELS[asset.type] + ' Detayları'}>
          <Row label="Marka / Model" value={[asset.brand, asset.model].filter(Boolean).join(' ')} />
          <Row label="Yıl" value={asset.year} />
          <Row label="Kilometre" value={asset.km != null ? `${asset.km.toLocaleString('tr-TR')} km` : null} />
          <Row label="Yakıt" value={asset.fuel_type} />
          <Row label="Vites" value={asset.transmission} />
          <Row label="Renk" value={asset.color} />
          <Row label="Plaka" value={asset.plate} />
          <Row label="Hasar" value={asset.damage_status} />
          <Row label="VIN" value={asset.vin} />
          <Row label="Motor No" value={asset.engine_number} />
          <Row label="Motor Hacmi" value={asset.engine_size} />
        </Section>
      )}

      {asset.property_type && (
        <Section title="Gayrimenkul Detayları">
          <Row label="Mülk Tipi" value={asset.property_type} />
          <Row label="Brüt m²" value={asset.gross_area} />
          <Row label="Net m²" value={asset.net_area} />
          <Row label="Oda Sayısı" value={asset.room_count} />
          <Row label="Bina Yaşı" value={asset.building_age} />
          <Row label="Kat" value={asset.floor_number} />
          <Row label="Adres" value={asset.location_address} />
        </Section>
      )}

      {asset.length_m && (
        <Section title="Tekne Detayları">
          <Row label="Uzunluk" value={`${asset.length_m} m`} />
          <Row label="Motor Gücü" value={asset.engine_power} />
          <Row label="Tekne Ruhsat" value={asset.boat_reg_number} />
        </Section>
      )}

      {asset.equipment_type && (
        <Section title="İş Makinesi Detayları">
          <Row label="Makine Türü" value={asset.equipment_type} />
          <Row label="Motor Saati" value={asset.engine_hours != null ? `${asset.engine_hours.toLocaleString('tr-TR')} saat` : null} />
          <Row label="Seri No" value={asset.serial_number} />
        </Section>
      )}

      {asset.investment_type && (
        <Section title="Yatırım Detayları">
          <Row label="Yatırım Türü" value={asset.investment_type} />
          <Row label="Kurum" value={asset.institution} />
          <Row label="Adet" value={asset.units} />
          <Row label="Birim Fiyat" value={asset.unit_price != null ? formatCurrency(asset.unit_price) : null} />
        </Section>
      )}

      {asset.bank_wallet && (
        <Section title="Nakit Detayları">
          <Row label="Banka / Cüzdan" value={asset.bank_wallet} />
        </Section>
      )}

      {asset.description && (
        <Section title="Notlar">
          <p className="text-sm text-foreground/80 leading-relaxed">{asset.description}</p>
        </Section>
      )}

      {/* Meta */}
      <Section title="Genel">
        <Row label="Tür" value={ASSET_TYPE_LABELS[asset.type]} />
        <Row label="Durum" value={
          <Badge variant={asset.status === 'active' ? 'success' : asset.status === 'sold' ? 'warning' : 'default'}>
            {ASSET_STATUS_LABELS[asset.status]}
          </Badge>
        } />
        <Row label="Kategori" value={asset.category} />
        <Row label="Oluşturulma" value={formatDate(asset.created_at)} />
        <Row label="Güncelleme" value={formatDate(asset.updated_at)} />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h4>
      <div className="bg-card rounded-lg border border-border px-4">{children}</div>
    </div>
  )
}
