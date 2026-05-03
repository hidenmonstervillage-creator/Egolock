import { useState } from 'react'
import { useEgolockStore, selectEgoistScore } from '../store/useEgolockStore'
import { SKILLS } from '../lib/skills'
import { computeLevel } from '../lib/leveling'
import { EGO_QUADRANT_INFO, EGO_ARCHETYPE_INFO, getQuadrantKey } from '../lib/egoTest'
import Panel from '../components/ui/Panel'
import Button from '../components/ui/Button'
import EgoQuadrantGraphic from '../components/EgoQuadrantGraphic'
import EgoTestModal from '../components/EgoTestModal'
import AvatarUploader from '../components/AvatarUploader'

// ─── Momentum colours (mirrored from App.tsx) ─────────────────────────────────

const MC_COLOR: Record<string, string> = {
  relentless:  'text-neon  border-neon',
  consistent:  'text-ink   border-line',
  stagnant:    'text-dim   border-line',
  elimination: 'text-red   border-red',
}
const MC_LABEL: Record<string, string> = {
  relentless:  'RELENTLESS  1.05×',
  consistent:  'CONSISTENT  1.00×',
  stagnant:    'STAGNANT    0.90×',
  elimination: 'ELIMINATION 0.50×',
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DossierScreen() {
  const profile       = useEgolockStore(s => s.profile)
  const skillPoints   = useEgolockStore(s => s.skillPoints)
  const momentum      = useEgolockStore(s => s.momentum)
  const capital       = useEgolockStore(s => s.capital)
  const eScore        = useEgolockStore(selectEgoistScore)
  const updateProfile = useEgolockStore(s => s.updateProfile)
  const setEgoPosition = useEgolockStore(s => s.setEgoPosition)
  const resetEgoTest   = useEgolockStore(s => s.resetEgoTest)

  // Local input state — synced to store on blur
  const [usernameLocal, setUsernameLocal]         = useState(profile.username)
  const [egoStatementLocal, setEgoStatementLocal] = useState(profile.egoStatement)
  const [newGoal, setNewGoal]                     = useState('')
  const [testOpen, setTestOpen]                   = useState(false)

  const skillsAboveLvZero = SKILLS.filter(s =>
    computeLevel(s.rarity, skillPoints[s.id] ?? 0) > 0,
  ).length

  const mcColor = MC_COLOR[momentum] ?? MC_COLOR.consistent
  const mcLabel = MC_LABEL[momentum] ?? momentum.toUpperCase()

  // ── IRL Goals helpers ────────────────────────────────────────────────────
  const addGoal = () => {
    const trimmed = newGoal.trim()
    if (!trimmed || profile.irlGoals.length >= 5) return
    updateProfile({ irlGoals: [...profile.irlGoals, trimmed] })
    setNewGoal('')
  }

  const removeGoal = (idx: number) => {
    updateProfile({ irlGoals: profile.irlGoals.filter((_, i) => i !== idx) })
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">

      {/* ── 0: IDENTITY IMAGE ─────────────────────────────────────────────── */}
      <AvatarUploader />

      {/* ── A: IDENTITY ───────────────────────────────────────────────────── */}
      <Panel title="IDENTITY">
        <input
          type="text"
          value={usernameLocal}
          onChange={e => setUsernameLocal(e.target.value)}
          onBlur={() => updateProfile({ username: usernameLocal.trim() })}
          onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          placeholder="username"
          className="w-full bg-bg border border-line text-ink font-mono text-xs px-3 py-2 focus:border-neon outline-none placeholder:text-dim mb-4"
        />

        {/* Stat readout */}
        <div className="flex flex-col gap-2">
          {/* Eₑ Score */}
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-neon tabular-nums leading-none">
              {eScore.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
            <span className="label text-dim mb-0.5">EGOIST SCORE</span>
          </div>

          {/* Row: Mc badge · capital · skills */}
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className={`label border px-2 py-0.5 ${mcColor}`}>{mcLabel}</span>
            <span className="label text-dim">
              CAPITAL <span className="text-ink">${capital.toLocaleString()}</span>
            </span>
            <span className="label text-dim">
              SKILLS &gt; LV0 <span className="text-ink">{skillsAboveLvZero} / {SKILLS.length}</span>
            </span>
          </div>
        </div>
      </Panel>

      {/* ── B: EGO STATEMENT ──────────────────────────────────────────────── */}
      <Panel title="// EGO STATEMENT">
        <textarea
          rows={4}
          value={egoStatementLocal}
          onChange={e => setEgoStatementLocal(e.target.value)}
          onBlur={() => updateProfile({ egoStatement: egoStatementLocal })}
          placeholder="What do you want? What's the only thing? Write it here. Read it daily."
          className="w-full bg-bg border border-line text-ink font-mono text-xs px-3 py-2 focus:border-neon outline-none placeholder:text-dim resize-none transition-colors"
        />
      </Panel>

      {/* ── C: EGO TYPE ───────────────────────────────────────────────────── */}
      {!profile.egoTestCompletedAt ? (

        /* ── CASE A: not yet tested ─────────────────────────────────────── */
        <Panel title="// EGO TYPE — UNSCANNED">
          <p className="text-dim text-xs leading-relaxed mb-4">
            The Egolock cannot place you yet. Take the placement profile.
            15 questions. Answer honestly. There is no going back.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => setTestOpen(true)}
            className="w-full justify-center"
          >
            BEGIN PLACEMENT TEST
          </Button>
        </Panel>

      ) : (

        /* ── CASE B: tested ─────────────────────────────────────────────── */
        (() => {
          const pos           = profile.egoType
          const quadKey       = pos ? getQuadrantKey(pos) : null
          const quadInfo      = quadKey ? EGO_QUADRANT_INFO[quadKey] : null
          const archetypeInfo = profile.egoArchetype ? EGO_ARCHETYPE_INFO[profile.egoArchetype] : null
          const daysRemaining = profile.egoTestCompletedAt
            ? Math.max(0, 14 - Math.floor((Date.now() - profile.egoTestCompletedAt) / 86_400_000))
            : 0

          return (
            <Panel title="// EGO TYPE">

              {/* Quadrant graphic */}
              <EgoQuadrantGraphic
                position={pos ?? null}
                interactive={profile.egoTestUnlockedManualEdit}
                onChange={({ x, y }) => setEgoPosition(x, y)}
                pulseDot={false}
              />

              {/* Quadrant name + archetype + description */}
              {quadInfo && (
                <div className="flex flex-col gap-3 mt-4">
                  <span className="text-neon text-2xl font-bold font-mono tracking-widest leading-tight">
                    {quadInfo.name}
                  </span>

                  {archetypeInfo && (
                    <div className="flex items-center gap-2">
                      <span className="label text-dim text-[10px]">ARCHETYPE</span>
                      <span className="label text-red font-bold text-[11px] tracking-widest">
                        {archetypeInfo.name}
                      </span>
                    </div>
                  )}

                  <p className="text-ink text-xs leading-relaxed font-mono">
                    {quadInfo.description}
                  </p>
                </div>
              )}

              {/* Lock / unlock status strip */}
              <div className="mt-4 flex flex-col gap-0.5">
                {!profile.egoTestUnlockedManualEdit ? (
                  <>
                    <span className="label text-dim text-[10px]">
                      // PLACEMENT LOCKED — {daysRemaining} DAY{daysRemaining !== 1 ? 'S' : ''} UNTIL YOU CAN MOVE YOURSELF.
                    </span>
                    <span className="label text-dim text-[10px] opacity-60">
                      earn the right to choose. the egolock decides for now.
                    </span>
                  </>
                ) : (
                  <>
                    <span className="label text-neon text-[10px]">
                      // MANUAL CALIBRATION UNLOCKED
                    </span>
                    <span className="label text-dim text-[10px] opacity-60">
                      click anywhere in the quadrant to reposition.
                    </span>
                  </>
                )}
              </div>

              {/* Retake button */}
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('This will erase your placement and unlock a new test. Continue?')) {
                      resetEgoTest()
                      setTestOpen(true)
                    }
                  }}
                >
                  RETAKE TEST
                </Button>
              </div>

            </Panel>
          )
        })()

      )}

      {/* ── D: IRL GOALS ──────────────────────────────────────────────────── */}
      <Panel title="// IRL TARGETS">
        {profile.irlGoals.length === 0 && (
          <p className="text-dim text-xs mb-3">// no targets set. what are you actually aiming for?</p>
        )}

        <div className="flex flex-col gap-2 mb-3">
          {profile.irlGoals.map((goal, idx) => (
            <div key={idx} className="flex items-center gap-2 border border-line bg-bg px-3 py-2">
              <span className="text-neon text-xs shrink-0 tabular-nums">{idx + 1}.</span>
              <span className="text-ink text-xs flex-1">{goal}</span>
              <button
                onClick={() => removeGoal(idx)}
                className="text-dim hover:text-red text-xs transition-colors shrink-0 px-1"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {profile.irlGoals.length >= 5 ? (
          <p className="label text-dim text-[10px]">// 5 targets max — focus is a weapon.</p>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newGoal}
              onChange={e => setNewGoal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGoal()}
              placeholder="Add a target..."
              className="flex-1 bg-bg border border-line text-ink font-mono text-xs px-3 py-2 focus:border-neon outline-none placeholder:text-dim"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={addGoal}
              disabled={!newGoal.trim()}
            >
              ADD
            </Button>
          </div>
        )}
      </Panel>

      {/* Ego placement test modal */}
      <EgoTestModal open={testOpen} onClose={() => setTestOpen(false)} />

    </div>
  )
}
