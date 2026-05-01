import { useEgolockStore } from '../store/useEgolockStore'
import { getSkill } from '../lib/skills'
import { computeLevel, pointsToNextLevel } from '../lib/leveling'
import Panel from './ui/Panel'
import RarityBadge from './ui/RarityBadge'

interface SkillCardProps {
  skillId: string
}

export default function SkillCard({ skillId }: SkillCardProps) {
  const skillPoints = useEgolockStore(s => s.skillPoints)
  const skill = getSkill(skillId)
  if (!skill) return null

  const pts = skillPoints[skillId] ?? 0
  const level = computeLevel(skill.rarity, pts)
  const progress = pointsToNextLevel(skill.rarity, pts)
  const isMaxed = level >= 15

  return (
    <Panel className="flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-start justify-between gap-1">
        <span className="font-bold text-[11px] tracking-wider uppercase text-ink leading-tight">
          {skill.name}
        </span>
        <RarityBadge rarity={skill.rarity} />
      </div>

      {/* Level number */}
      <div
        className={`text-3xl font-bold tabular-nums leading-none ${
          level > 0 ? 'text-neon' : 'text-dim'
        }`}
      >
        Lv {level}
      </div>

      {/* Progress bar */}
      {isMaxed ? (
        <div className="label text-red text-[11px]">MAX</div>
      ) : (
        <div className="h-[2px] w-full bg-line">
          <div
            className="h-full bg-neon transition-all duration-500"
            style={{ width: `${progress.pct * 100}%` }}
          />
        </div>
      )}

      {/* Points label */}
      <div className="label text-dim text-[10px] tabular-nums">
        {isMaxed
          ? `${pts.toLocaleString()} pts`
          : `${pts.toLocaleString()} / ${progress.next?.toLocaleString() ?? '—'}`}
      </div>
    </Panel>
  )
}
