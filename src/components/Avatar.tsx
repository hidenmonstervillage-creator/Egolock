import { useEgolockStore } from '../store/useEgolockStore'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AvatarProps {
  size?:         number   // px, default 40
  className?:    string
  showFallback?: boolean  // render initials/placeholder when no avatar, default true
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Avatar({ size = 40, className = '', showFallback = true }: AvatarProps) {
  const avatarDataUrl = useEgolockStore(s => s.profile.avatarDataUrl)
  const username      = useEgolockStore(s => s.profile.username)

  const sizeStyle: React.CSSProperties = { width: size, height: size, minWidth: size, minHeight: size }

  // ── Avatar image ────────────────────────────────────────────────────────────
  if (avatarDataUrl) {
    return (
      <img
        src={avatarDataUrl}
        alt="avatar"
        style={{ ...sizeStyle, objectFit: 'cover' }}
        className={`border border-line shrink-0 ${className}`}
      />
    )
  }

  // ── No avatar ───────────────────────────────────────────────────────────────
  if (!showFallback) return null

  const initial = username.trim().charAt(0).toUpperCase() || null

  return (
    <div
      style={{ ...sizeStyle, fontSize: Math.max(10, Math.round(size * 0.4)) }}
      className={`bg-panel border border-line flex items-center justify-center shrink-0 font-mono font-bold ${className}`}
    >
      {initial
        ? <span className="text-neon leading-none">{initial}</span>
        : <span className="text-dim leading-none">?</span>
      }
    </div>
  )
}
