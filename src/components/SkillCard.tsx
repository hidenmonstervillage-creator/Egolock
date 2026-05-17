import { useEgolockStore } from '../store/useEgolockStore'
import { getSkillDef, getBranch } from '../lib/skills'
import { computeLevel, pointsToNextLevel } from '../lib/leveling'
import Panel from './ui/Panel'
import RarityBadge from './ui/RarityBadge'

interface SkillCardProps {
  skillId: string
}

export default function SkillCard({ skillId }: SkillCardProps) {
  const skillPoints    = useEgolockStore(s => s.skillPoints)
  const customSkills   = useEgolockStore(s => s.customSkills)
  const sportSkillName = useEgolockStore(s => s.sportSkillName)

  const skill = getSkillDef(skillId, customSkills)
  if (!skill) return null

  const displayName = skill.isCustomNameable ? sportSkillName : skill.name
  const branch      = getBranch(skill.branchId)
  const pts         = skillPoints[skillId] ?? 0
  const level       = computeLevel(skill.rarity, pts)
  const progress    = pointsToNextLevel(skill.rarity, pts)
  const isMaxed     = level >= 15

  return (
    <Panel
      className="flex flex-col gap-2"
      style={{ borderLeftColor: branch.color }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-1">
        <span className="font-bold text-[11px] tracking-wider uppercase text-ink leading-tight">
          {displayName}
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

      {/* Progress bar — branch-colored fill */}
      {isMaxed ? (
        <div className="label text-red text-[11px]">MAX</div>
      ) : (
        <div className="h-[2px] w-full bg-line">
          <div
            className="h-full transition-all duration-500"
            style={{
              width:           `${progress.pct * 100}%`,
              backgroundColor: branch.color,
            }}
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
