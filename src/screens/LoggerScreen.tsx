import { useState } from 'react'
import { useEgolockStore } from '../store/useEgolockStore'
import { BRANCHES, SYSTEM_SKILLS, getSkillDef, getAllSkillDefs } from '../lib/skills'
import { PRESETS } from '../lib/presets'
import Panel from '../components/ui/Panel'
import Button from '../components/ui/Button'
import RarityBadge from '../components/ui/RarityBadge'
import EvolutionPrompt from '../components/EvolutionPrompt'
import type { EvolutionEntry } from '../store/useEgolockStore'

// ─── Build branch → skill → presets structure (static, based on PRESETS order) ─

interface SkillGroup  { skillId: string; presets: typeof PRESETS }
interface BranchGroup { branchId: string; skills:  SkillGroup[] }

const BRANCH_GROUPS: BranchGroup[] = BRANCHES.flatMap(branch => {
  // Skills in this branch that have at least one preset, in preset-first-appearance order
  const seen   = new Set<string>()
  const skills: SkillGroup[] = []

  for (const p of PRESETS) {
    const def = SYSTEM_SKILLS.find(s => s.id === p.skillId)
    if (!def || def.branchId !== branch.id) continue
    if (!seen.has(p.skillId)) {
      seen.add(p.skillId)
      skills.push({ skillId: p.skillId, presets: [] })
    }
    skills.find(g => g.skillId === p.skillId)!.presets.push(p)
  }

  return skills.length > 0 ? [{ branchId: branch.id, skills }] : []
})

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoggerScreen() {
  const logAction      = useEgolockStore(s => s.logAction)
  const actionLog      = useEgolockStore(s => s.actionLog)
  const customSkills   = useEgolockStore(s => s.customSkills)
  const sportSkillName = useEgolockStore(s => s.sportSkillName)

  // Preset button flash feedback
  const [flashKey, setFlashKey] = useState<string | null>(null)

  // Evolution prompt
  const [evoOpen,    setEvoOpen]    = useState(false)
  const [evoTrigger, setEvoTrigger] = useState<EvolutionEntry['trigger']>('extreme-resistance')

  // Custom log form — default to first system skill
  const [customSkill,  setCustomSkill]  = useState(SYSTEM_SKILLS[0].id)
  const [customPoints, setCustomPoints] = useState('')
  const [customLabel,  setCustomLabel]  = useState('')

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handlePreset = (skillId: string, points: number, label: string) => {
    logAction(skillId, points, label)
    const key = `${skillId}-${label}`
    setFlashKey(key)
    setTimeout(() => setFlashKey(null), 200)

    if (label === 'Extreme Resistance') {
      setEvoTrigger('extreme-resistance')
      setEvoOpen(true)
    }
  }

  const handleCustomLog = () => {
    const pts = parseInt(customPoints, 10)
    if (!customSkill || !pts || pts < 1 || !customLabel.trim()) return
    logAction(customSkill, pts, customLabel.trim())
    setCustomPoints('')
    setCustomLabel('')
  }

  const recent    = actionLog.slice(0, 10)
  const allSkills = getAllSkillDefs(customSkills)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 max-w-2xl">

      {/* ── A: Presets — grouped by branch then by skill ─────────────────── */}
      <Panel title="PRESETS">
        <div className="flex flex-col gap-6">
          {BRANCH_GROUPS.map(({ branchId, skills }) => {
            const branch = BRANCHES.find(b => b.id === branchId)!
            return (
              <div key={branchId} className="flex flex-col gap-4">

                {/* Branch header */}
                <div
                  className="border-b pb-1"
                  style={{ borderColor: branch.color }}
                >
                  <span
                    className="label text-[10px] font-bold tracking-widest"
                    style={{ color: branch.color }}
                  >
                    {branch.name}
                  </span>
                </div>

                {skills.map(({ skillId, presets }) => {
                  const skill = getSkillDef(skillId, customSkills)
                  if (!skill) return null
                  // Use custom sport name if applicable
                  const displayName = skill.isCustomNameable ? sportSkillName : skill.name

                  return (
                    <div key={skillId}>
                      {/* Skill group header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-ink text-xs font-bold uppercase tracking-wider">
                          {displayName}
                        </span>
                        <RarityBadge rarity={skill.rarity} />
                      </div>

                      {/* Preset buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {presets.map(p => {
                          const key      = `${skillId}-${p.label}`
                          const flashing = flashKey === key
                          return (
                            <button
                              key={p.label}
                              onClick={() => handlePreset(p.skillId, p.points, p.label)}
                              className={[
                                'border p-2.5 text-left font-mono transition-all duration-200',
                                flashing
                                  ? 'border-neon bg-neon/10'
                                  : 'border-line bg-bg hover:border-neon hover:bg-neon/5',
                              ].join(' ')}
                            >
                              <div className="text-ink text-xs uppercase tracking-wider leading-tight">
                                {p.label}
                              </div>
                              <div className="text-neon text-xs mt-0.5 tabular-nums">
                                +{p.points}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </Panel>

      {/* ── B: Custom log ───────────────────────────────────────────────────── */}
      <Panel title="CUSTOM LOG">
        <div className="flex flex-col gap-3">
          {/* Grouped <select> by branch */}
          <select
            value={customSkill}
            onChange={e => setCustomSkill(e.target.value)}
            className="bg-bg border border-line text-ink font-mono text-xs px-3 py-2 focus:border-neon outline-none w-full"
          >
            {BRANCHES.map(branch => {
              const branchSkills = allSkills.filter(s => s.branchId === branch.id)
              if (branchSkills.length === 0) return null
              return (
                <optgroup key={branch.id} label={branch.name}>
                  {branchSkills.map(s => {
                    const displayName = s.isCustomNameable ? sportSkillName : s.name
                    return (
                      <option key={s.id} value={s.id}>
                        {displayName} ({s.rarity})
                      </option>
                    )
                  })}
                </optgroup>
              )
            })}
          </select>

          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={customPoints}
              onChange={e => setCustomPoints(e.target.value)}
              placeholder="Pts"
              className="bg-bg border border-line text-ink font-mono text-xs px-3 py-2 w-20 shrink-0 focus:border-neon outline-none placeholder:text-dim"
            />
            <input
              type="text"
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              placeholder="What did you do?"
              className="bg-bg border border-line text-ink font-mono text-xs px-3 py-2 flex-1 min-w-0 focus:border-neon outline-none placeholder:text-dim"
              onKeyDown={e => e.key === 'Enter' && handleCustomLog()}
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCustomLog}
            disabled={
              !customLabel.trim() ||
              !customPoints ||
              parseInt(customPoints, 10) < 1
            }
            className="self-start"
          >
            LOG
          </Button>
        </div>
      </Panel>

      {/* ── C: Recent ───────────────────────────────────────────────────────── */}
      <Panel title="RECENT">
        {recent.length === 0 ? (
          <p className="text-dim text-xs font-mono">
            // no actions logged yet. start the climb.
          </p>
        ) : (
          <div className="flex flex-col">
            {recent.map(entry => {
              const skill       = getSkillDef(entry.skillId, customSkills)
              const displayName = skill?.isCustomNameable ? sportSkillName : (skill?.name ?? entry.skillId)
              const d           = new Date(entry.ts)
              const hhmm        = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 py-1.5 border-b border-line last:border-0 text-xs"
                >
                  <span className="text-dim tabular-nums shrink-0 w-10">{hhmm}</span>
                  <span className="text-dim uppercase tracking-wider shrink-0 w-[84px] truncate">
                    {displayName}
                  </span>
                  <span className="text-ink flex-1 truncate">{entry.label}</span>
                  <span className="text-neon tabular-nums shrink-0">+{entry.points}</span>
                </div>
              )
            })}
          </div>
        )}
      </Panel>

      {/* Evolution prompt modal */}
      <EvolutionPrompt
        open={evoOpen}
        trigger={evoTrigger}
        onClose={() => setEvoOpen(false)}
      />
    </div>
  )
}
