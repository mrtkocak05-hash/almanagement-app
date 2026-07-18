import { useRef, useState } from 'react'
import { Upload, Star, Trash2, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui'
import { assetsApi } from '@/services/assetsApi'
import type { AssetDetail, AssetPhoto } from '@/types/assets'
import { cn } from '@/utils/cn'

interface Props { asset: AssetDetail; onRefresh: () => void }

export function AssetDetailPhotos({ asset, onRefresh }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const photos = asset.photos.filter(p => !p.deleted_at)

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    try {
      setUploading(true)
      await assetsApi.uploadPhotos(asset.id, Array.from(files))
      onRefresh()
    } finally {
      setUploading(false)
    }
  }

  const handleSetMain = async (photo: AssetPhoto) => {
    await assetsApi.setMainPhoto(asset.id, photo.id)
    onRefresh()
  }

  const handleDelete = async (photo: AssetPhoto) => {
    if (!confirm('Bu fotoğraf silinsin mi?')) return
    await assetsApi.deletePhoto(asset.id, photo.id)
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{photos.length} fotoğraf</p>
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="w-3.5 h-3.5 mr-1" />
          {uploading ? 'Yükleniyor...' : 'Fotoğraf Ekle'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleUpload(e.target.files)}
        />
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <ImageOff className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Henüz fotoğraf yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map(photo => (
            <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              <img
                src={`/storage/${photo.path}`}
                alt=""
                className="w-full h-full object-cover"
              />
              {photo.is_main === 1 && (
                <div className="absolute top-2 left-2 bg-black/70 text-yellow-400 rounded px-1.5 py-0.5 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs">Ana</span>
                </div>
              )}
              <div className={cn(
                'absolute inset-0 bg-black/50 flex items-center justify-center gap-2',
                'opacity-0 group-hover:opacity-100 transition-opacity',
              )}>
                {photo.is_main !== 1 && (
                  <button
                    onClick={() => handleSetMain(photo)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                    title="Ana fotoğraf yap"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(photo)}
                  className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
