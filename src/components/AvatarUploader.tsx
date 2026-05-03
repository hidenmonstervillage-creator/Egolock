import { useRef, useState } from 'react'
import { useEgolockStore } from '../store/useEgolockStore'
import { compressImage } from '../lib/imageCompress'
import Panel from './ui/Panel'
import Button from './ui/Button'

// ─── Shimmer animation ────────────────────────────────────────────────────────

const SHIMMER_CSS = `
@keyframes avatarShimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
.avatar-shimmer {
  animation: avatarShimmer 1.1s ease-in-out infinite;
}
`

// ─── Constants ────────────────────────────────────────────────────────────────

const PREVIEW_SIZE = 160   // px

// ─── Component ────────────────────────────────────────────────────────────────

type Status = 'idle' | 'compressing' | 'error'

export default function AvatarUploader() {
  const avatarDataUrl = useEgolockStore(s => s.profile.avatarDataUrl)
  const setAvatar     = useEgolockStore(s => s.setAvatar)
  const clearAvatar   = useEgolockStore(s => s.clearAvatar)

  const inputRef             = useRef<HTMLInputElement>(null)
  const [status, setStatus]  = useState<Status>('idle')
  const [errorMsg, setError] = useState<string | null>(null)

  // ── File handling ──────────────────────────────────────────────────────────

  const triggerPicker = () => {
    setError(null)
    inputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset input so the same file can be reselected after an error
    e.target.value = ''

    if (!file) return

    // Up-front validation (mirrors compressImage but gives immediate feedback)
    if (!file.type.startsWith('image/')) {
      setError('Not an image — please pick a jpg, png, or webp file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large — must be under 10 MB.')
      return
    }

    setStatus('compressing')
    setError(null)

    try {
      const dataUrl = await compressImage(file)
      setAvatar(dataUrl)
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed.')
      setStatus('error')
    }
  }

  const handleRemove = () => {
    if (!window.confirm('Remove your profile image?')) return
    clearAvatar()
    setStatus('idle')
    setError(null)
  }

  // ── Sub-renders ────────────────────────────────────────────────────────────

  const previewArea = (
    <div
      style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
      className={[
        'shrink-0 flex items-center justify-center',
        avatarDataUrl
          ? 'border border-line bg-panel'
          : 'border border-dashed border-line bg-panel',
      ].join(' ')}
    >
      {avatarDataUrl ? (
        <img
          src={avatarDataUrl}
          alt="profile"
          style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span className="label text-dim text-[10px]">// NO IMAGE</span>
      )}
    </div>
  )

  const shimmerBar = (
    <div className="flex flex-col gap-2">
      <span className="label text-dim text-[10px]">// COMPRESSING...</span>
      <div className="w-full h-px bg-line relative overflow-hidden">
        <div className="absolute inset-y-0 w-1/4 bg-neon avatar-shimmer" />
      </div>
    </div>
  )

  const errorArea = errorMsg && (
    <div className="flex flex-col gap-2">
      <span className="text-red text-[10px] font-mono leading-relaxed">{errorMsg}</span>
      <Button variant="ghost" size="sm" onClick={triggerPicker}>
        TRY AGAIN
      </Button>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{SHIMMER_CSS}</style>

      <Panel title="// IDENTITY IMAGE">
        <div className="flex flex-col gap-4">

          {/* Preview */}
          {previewArea}

          {/* Controls */}
          {status === 'compressing' ? (
            shimmerBar
          ) : status === 'error' && errorArea ? (
            errorArea
          ) : avatarDataUrl ? (
            /* Has avatar — REPLACE + REMOVE */
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={triggerPicker}>
                  REPLACE
                </Button>
                <Button variant="danger" size="sm" onClick={handleRemove}>
                  REMOVE
                </Button>
              </div>
              <span className="label text-dim text-[10px]">
                // stored locally on this device only.
              </span>
            </div>
          ) : (
            /* No avatar — UPLOAD */
            <div className="flex flex-col gap-2">
              <Button variant="primary" size="md" onClick={triggerPicker} className="w-full justify-center">
                UPLOAD IMAGE
              </Button>
              <span className="label text-dim text-[10px] leading-relaxed">
                jpg, png, webp. compressed to 256×256 on your device. nothing sent anywhere.
              </span>
            </div>
          )}

        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </Panel>
    </>
  )
}
