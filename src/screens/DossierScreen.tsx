import { useState } from 'react'
import { useEgolockStore, selectEgoistScore } from '../store/useEgolockStore'
import { SKILLS } from '../lib/skills'
import { computeLevel } from '../lib/leveling'
import Panel from '../components/ui/Panel'
import Button from '../components/ui/Button'

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

// ─── EgoType SVG quadrant ─────────────────────────────────────────────────────

const QW = 280 // quadrant width/height in viewBox units

function EgoTypeQuadrant() {
  const egoType     = useEgolockStore(s => s.profile.egoType)
  const updateProfile = useEgolockStore(s => s.updateProfile)

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const cx   = e.clientX - rect.left
    const cy   = e.clientY - rect.top
    // Map pixel position to [-1, 1] × [-1, 1]; Y is flipped (SVG top = positive y)
    const x = Math.max(-1, Math.min(1,  (cx / rect.width)  * 2 - 1))
    const y = Math.max(-1, Math.min(1, -((cy / rect.height) * 2 - 1)))
    updateProfile({ egoType: { x, y } })
  }

  // Convert stored [-1,1] coords to SVG pixel coords inside the viewBox
  const dotX = egoType != null ? ((egoType.x  + 1) / 2) * QW : null
  const dotY = egoType != null ? ((1 - egoType.y) / 2) * QW : null

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Y-axis top label */}
      <span className="label text-dim">COLLECTIVIST</span>

      <div className="flex items-center gap-2">
        {/* X-axis left label */}
        <span className="label text-dim writing-mode-vertical" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          PASSIVE
        </span>

        {/* SVG */}
        <svg
          viewBox={`0 0 ${QW} ${QW}`}
          width={QW}
          height={QW}
          className="cursor-crosshair border border-line bg-bg shrink-0"
          onClick={handleClick}
          style={{ maxWidth: '100%' }}
        >
          {/* Grid lines */}
          <line x1={QW / 2} y1={0} x2={QW / 2} y2={QW} stroke="#1F1F1F" strokeWidth={1} />
          <line x1={0} y1={QW / 2} x2={QW} y2={QW / 2} stroke="#1F1F1F" strokeWidth={1} />

          {/* Axis arrows */}
          <line x1={8} y1={QW / 2} x2={QW - 8} y2={QW / 2} stroke="#3A3A3A" strokeWidth={1} />
          <line x1={QW / 2} y1={8} x2={QW / 2} y2={QW - 8} stroke="#3A3A3A" strokeWidth={1} />

          {/* Dot */}
          {dotX != null && dotY != null && (
            <>
              {/* Crosshair lines through dot */}
              <line x1={dotX} y1={0} x2={dotX} y2={QW} stroke="#00E5FF" strokeWidth={0.5} strokeOpacity={0.3} />
              <line x1={0} y1={dotY} x2={QW} y2={dotY} stroke="#00E5FF" strokeWidth={0.5} strokeOpacity={0.3} />
              {/* Dot */}
              <circle cx={dotX} cy={dotY} r={6} fill="#00E5FF" />
              <circle cx={dotX} cy={dotY} r={3} fill="#000" />
            </>
          )}
        </svg>

        {/* X-axis right label */}
        <span className="label text-dim" style={{ writingMode: 'vertical-rl' }}>
          AGGRESSIVE
        </span>
      </div>

      {/* Y-axis bottom label */}
      <span className="label text-dim">INDIVIDUALIST</span>

      {/* Saved coordinates */}
      {egoType && (
        <span className="label text-dim text-[10px]">
          x {egoType.x.toFixed(2)} · y {egoType.y.toFixed(2)}
        </span>
      )}
      {!egoType && (
        <span className="label text-dim text-[10px]">click to place your ego</span>
      )}
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DossierScreen() {
  const profile       = useEgolockStore(s => s.profile)
  const skillPoints   = useEgolockStore(s => s.skillPoints)
  const momentum      = useEgolockStore(s => s.momentum)
  const capital       = useEgolockStore(s => s.capital)
  const eScore        = useEgolockStore(selectEgoistScore)
  const updateProfile = useEgolockStore(s => s.updateProfile)

  // Local input state — synced to store on blur
  const [usernameLocal, setUsernameLocal]       = useState(profile.username)
  const [egoStatementLocal, setEgoStatementLocal] = useState(profile.egoStatement)
  const [newGoal, setNewGoal]                   = useState('')

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

      {/* ── C: EGO TYPE QUADRANT ──────────────────────────────────────────── */}
      <Panel title="// EGO TYPE">
        <p className="text-dim text-xs mb-4 leading-relaxed">
          Plot yourself on the axes. Position is yours alone — no scoring, no judgment.
        </p>
        <EgoTypeQuadrant />
      </Panel>

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

    </div>
  )
}
