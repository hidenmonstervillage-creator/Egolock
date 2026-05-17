import { useEgolockStore } from '../store/useEgolockStore'
import { BRANCHES, getSkillsInBranch } from '../lib/skills'
import { computeLevel } from '../lib/leveling'
import Panel from '../components/ui/Panel'
import SkillRadar from '../components/SkillRadar'
import SkillCard from '../components/SkillCard'

export default function SkillsScreen() {
  const skillPoints  = useEgolockStore(s => s.skillPoints)
  const customSkills = useEgolockStore(s => s.customSkills)
  const isPremium    = useEgolockStore(s => s.isPremium)

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* ── AURA radar ──────────────────────────────────────────────────── */}
      <Panel title="AURA">
        <SkillRadar />
      </Panel>

      {/* ── Branch sections ─────────────────────────────────────────────── */}
      {BRANCHES.map(branch => {
        const skills    = getSkillsInBranch(branch.id, customSkills)
        const activeN   = skills.filter(s => computeLevel(s.rarity, skillPoints[s.id] ?? 0) > 0).length
        const totalN    = skills.length

        return (
          <div key={branch.id} className="flex flex-col gap-3">
            {/* Branch header strip */}
            <div
              className="flex items-center justify-between border-b pb-1.5"
              style={{ borderColor: branch.color }}
            >
              <span
                className="label text-xs font-bold tracking-widest"
                style={{ color: branch.color }}
              >
                {branch.name}
              </span>
              <span className="label text-dim text-[10px]">
                {activeN}/{totalN} skills active
              </span>
            </div>

            {/* Skill card grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {skills.map(skill => (
                <SkillCard key={skill.id} skillId={skill.id} />
              ))}
            </div>
          </div>
        )
      })}

      {/* ── Premium / custom skills hint ─────────────────────────────────── */}
      {isPremium ? (
        <div className="border border-line bg-panel px-4 py-3">
          <span className="label text-neon text-[10px]">
            // PRO UNLOCKED — CUSTOM SKILL CREATOR COMING NEXT SESSION.
          </span>
        </div>
      ) : (
        <div className="border border-line bg-panel px-4 py-3">
          <span className="label text-dim text-[10px]">
            // CUSTOM SKILLS — PRO ONLY. ADD YOUR OWN BRANCHES OF MASTERY.
          </span>
        </div>
      )}

    </div>
  )
}
