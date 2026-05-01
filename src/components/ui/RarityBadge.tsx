import { clsx } from 'clsx'
import type { Rarity } from '../../lib/skills'

interface RarityBadgeProps {
  rarity: Rarity
}

const RARITY_COLORS: Record<Rarity, string> = {
  Common: 'text-dim  border-dim',
  Rare:   'text-neon border-neon',
  Epic:   'text-red  border-red',
}

export default function RarityBadge({ rarity }: RarityBadgeProps) {
  return (
    <span
      className={clsx(
        'label border px-1.5 py-0.5 inline-block',
        RARITY_COLORS[rarity],
      )}
    >
      {rarity.toUpperCase()}
    </span>
  )
}
