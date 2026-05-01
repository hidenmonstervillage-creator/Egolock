import { useState } from 'react'
import { useEgolockStore } from '../store/useEgolockStore'
import { SKILLS, getSkill } from '../lib/skills'
import { PRESETS } from '../lib/presets'
import Panel from '../components/ui/Panel'
import Button from '../components/ui/Button'
import RarityBadge from '../components/ui/RarityBadge'
import EvolutionPrompt from '../components/EvolutionPrompt'
import type { EvolutionEntry } from '../store/useEgolockStore'

// ─── Group presets by skillId (preserves order of first appearance) ───────────

const PRESET_GROUPS: Array<{ skillId: string; presets: typeof PRESETS }> = []
const _seen = new Set<string>()
for (const p of PRESETS) {
  if (!_seen.has(p.skillId)) {
    _seen.add(p.skillId)
    PRESET_GROUPS.push({ skillId: p.skillId, presets: [] })
  }
  PRESET_GROUPS.find(g => g.skillId === p.skillId)!.presets.push(p)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoggerScreen() {
  const logAction = useEgolockStore(s => s.logAction)
  const actionLog = useEgolockStore(s => s.actionLog)

  // Preset button flash feedback
  const [flashKey, setFlashKey] = useState<string | null>(null)

  // Evolution prompt
  const [evoOpen,    setEvoOpen]    = useState(false)
  const [evoTrigger, setEvoTrigger] = useState<EvolutionEntry['trigger']>('extreme-resistance')

  // Custom log form
  const [customSkill,  setCustomSkill]  = useState(SKILLS[0].id)
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

  const recent = actionLog.slice(0, 10)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* ── A: Presets ──────────────────────────────────────────────────────── */}
      <Panel title="PRESETS">
        <div className="flex flex-col gap-5">
          {PRESET_GROUPS.map(({ skillId, presets }) => {
            const skill = getSkill(skillId)
            if (!skill) return null
            return (
              <div key={skillId}>
                {/* Skill group header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-ink text-xs font-bold uppercase tracking-wider">
                    {skill.name}
                  </span>
                  <RarityBadge rarity={skill.rarity} />
                </div>

                {/* Preset buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {presets.map(p => {
                    const key = `${skillId}-${p.label}`
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
      </Panel>

      {/* ── B: Custom log ───────────────────────────────────────────────────── */}
      <Panel title="CUSTOM LOG">
        <div className="flex flex-col gap-3">
          <select
            value={customSkill}
            onChange={e => setCustomSkill(e.target.value)}
            className="bg-bg border border-line text-ink font-mono text-xs px-3 py-2 focus:border-neon outline-none w-full"
          >
            {SKILLS.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.rarity})
              </option>
            ))}
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
              const skill = getSkill(entry.skillId)
              const d = new Date(entry.ts)
              const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 py-1.5 border-b border-line last:border-0 text-xs"
                >
                  <span className="text-dim tabular-nums shrink-0 w-10">{hhmm}</span>
                  <span className="text-dim uppercase tracking-wider shrink-0 w-[84px] truncate">
                    {skill?.name ?? entry.skillId}
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
