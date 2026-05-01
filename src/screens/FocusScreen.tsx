import { useEffect, useState } from 'react'
import { useEgolockStore } from '../store/useEgolockStore'
import { SKILLS, getSkill } from '../lib/skills'
import Panel from '../components/ui/Panel'
import Button from '../components/ui/Button'
import EvolutionPrompt from '../components/EvolutionPrompt'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DURATION_PRESETS = [5, 10, 15, 25, 45, 60, 90] // minutes

function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// ─── Picker — no active session ───────────────────────────────────────────────

function FocusPicker() {
  const startFocusSession = useEgolockStore(s => s.startFocusSession)

  const [selectedSkill,   setSelectedSkill]   = useState('focus')
  const [presetMin,       setPresetMin]        = useState<number | null>(25)
  const [customMin,       setCustomMin]        = useState('')

  // Resolved duration: custom overrides preset
  const durationMin =
    customMin !== '' ? parseInt(customMin, 10) : (presetMin ?? 0)
  const durationSec = durationMin * 60
  const canEngage   = durationMin >= 1 && durationMin <= 240

  const handleCustomChange = (v: string) => {
    setCustomMin(v)
    if (v !== '') setPresetMin(null) // deselect preset when typing custom
  }

  const handlePreset = (min: number) => {
    setPresetMin(min)
    setCustomMin('')
  }

  const handleEngage = () => {
    if (!canEngage) return
    startFocusSession(selectedSkill, durationSec)
  }

  return (
    <div className="max-w-lg flex flex-col gap-4">
      <Panel accent="neon" title="// FOCUS LOCK">
        <p className="text-dim text-xs leading-relaxed mt-1">
          Choose a skill. Choose a duration. Switch tabs and you fail.
          The philosophy doesn't care about your excuses.
        </p>
      </Panel>

      {/* Skill selector */}
      <Panel title="SKILL">
        <select
          value={selectedSkill}
          onChange={e => setSelectedSkill(e.target.value)}
          className="w-full bg-bg border border-line text-ink font-mono text-xs px-3 py-2 focus:border-neon outline-none"
        >
          {SKILLS.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.rarity})
            </option>
          ))}
        </select>
      </Panel>

      {/* Duration */}
      <Panel title="DURATION">
        {/* Preset grid */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {DURATION_PRESETS.map(min => (
            <button
              key={min}
              onClick={() => handlePreset(min)}
              className={[
                'border py-2 font-mono text-xs uppercase tracking-wider transition-colors',
                presetMin === min
                  ? 'border-neon text-neon bg-neon/5'
                  : 'border-line text-dim hover:border-neon hover:text-neon',
              ].join(' ')}
            >
              {min}m
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={240}
            value={customMin}
            onChange={e => handleCustomChange(e.target.value)}
            placeholder="Custom (min)"
            className="bg-bg border border-line text-ink font-mono text-xs px-3 py-2 w-full focus:border-neon outline-none placeholder:text-dim"
          />
          <span className="label text-dim shrink-0">1–240</span>
        </div>
      </Panel>

      {/* Engage */}
      <button
        onClick={handleEngage}
        disabled={!canEngage}
        className="w-full py-4 font-mono text-lg uppercase tracking-widest font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-neon text-black hover:brightness-110"
      >
        ENGAGE
      </button>
    </div>
  )
}

// ─── Running — countdown + anti-cheat ────────────────────────────────────────

function FocusRunning() {
  const focusSession     = useEgolockStore(s => s.focusSession)!
  const failFocusSession = useEgolockStore(s => s.failFocusSession)

  const skill = getSkill(focusSession.skillId)

  // ── Local countdown (updates every 250 ms) ─────────────────────────────────
  const [remaining, setRemaining] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() - focusSession.startedAt) / 1000)
    return Math.max(0, focusSession.durationSec - elapsed)
  })

  useEffect(() => {
    // Called every 250 ms AND immediately on mount.
    // If the page was closed and reopened after the timer would have expired,
    // the first tick detects remaining === 0 and completes cleanly.
    // If it was reopened before expiry, the countdown resumes from the correct
    // remaining time — refreshing is NOT treated as cheating.
    const tick = () => {
      const s = useEgolockStore.getState().focusSession
      if (!s || s.status !== 'running') return
      const elapsed  = Math.floor((Date.now() - s.startedAt) / 1000)
      const left     = Math.max(0, s.durationSec - elapsed)
      setRemaining(left)
      if (left <= 0) {
        useEgolockStore.getState().completeFocusSession()
      }
    }

    tick() // immediate check handles post-refresh expiry
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, []) // no deps — reads store directly via getState() to avoid stale closures

  // ── Anti-cheat listeners ───────────────────────────────────────────────────
  useEffect(() => {
    // PRIMARY: visibilitychange fires when the user switches browser tabs,
    // minimizes the window, or the OS hides the page.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        useEgolockStore.getState().failFocusSession()
      }
    }

    // BACKUP: window blur fires when the user alt-tabs to another native app.
    // Some Chromium builds don't fire visibilitychange on alt-tab in certain
    // desktop configurations — this catches those cases.
    // document.hasFocus() confirms true window-level focus loss (not an
    // in-page focus shift like clicking a button or select).
    const handleBlur = () => {
      if (!document.hasFocus()) {
        useEgolockStore.getState().failFocusSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
    }
    // Effect re-runs (and cleanup fires) whenever status leaves 'running'
  }, [])

  const elapsed    = focusSession.durationSec - remaining
  const elapsedPct = focusSession.durationSec > 0
    ? Math.min(100, (elapsed / focusSession.durationSec) * 100)
    : 0

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 select-none">
      {/* Locked-on label */}
      <div className="label text-dim tracking-widest">
        // LOCKED ON {skill?.name.toUpperCase() ?? focusSession.skillId.toUpperCase()}
      </div>

      {/* Countdown */}
      <div className="text-7xl font-bold text-neon tabular-nums leading-none tracking-tight">
        {formatMmSs(remaining)}
      </div>

      {/* Progress bar — no transition, updates every 250 ms */}
      <div className="w-full max-w-sm h-[2px] bg-line">
        <div
          className="h-full bg-neon"
          style={{ width: `${elapsedPct}%` }}
        />
      </div>

      {/* Warning */}
      <p className="label text-dim text-center leading-relaxed">
        DO NOT SWITCH TABS.&nbsp;&nbsp;DO NOT MINIMIZE.<br />
        THE TIMER IS WATCHING.
      </p>

      {/* Abandon — treat same as a cheat: triggers evolution prompt */}
      <Button
        variant="danger"
        size="sm"
        onClick={() => failFocusSession()}
      >
        ABANDON
      </Button>
    </div>
  )
}

// ─── Failed — evo prompt + failure panel behind it ────────────────────────────

function FocusFailed() {
  const focusSession    = useEgolockStore(s => s.focusSession)!
  const clearFocusSession = useEgolockStore(s => s.clearFocusSession)

  const skill = getSkill(focusSession.skillId)

  const elapsedSec = focusSession.failedAt
    ? Math.floor((focusSession.failedAt - focusSession.startedAt) / 1000)
    : 0
  const elapsedMin = Math.floor(elapsedSec / 60)

  // Auto-open evolution prompt; close clears session so screen returns to picker
  const [evoOpen, setEvoOpen] = useState(true)

  const handleEvoClose = () => {
    setEvoOpen(false)
    clearFocusSession()
  }

  return (
    <>
      {/* Behind the modal */}
      <Panel accent="red" title="// SESSION FAILED">
        <p className="text-ink text-sm mt-1">
          <span className="text-red font-bold uppercase tracking-wider">
            {skill?.name ?? focusSession.skillId}
          </span>
          {' '}—{' '}
          <span className="text-dim">
            {elapsedMin > 0
              ? `${elapsedMin} min before break`
              : 'failed before 1 min'}
          </span>
        </p>
        <p className="text-dim text-xs mt-2">No points awarded.</p>
      </Panel>

      <EvolutionPrompt
        open={evoOpen}
        trigger="focus-fail"
        onClose={handleEvoClose}
      />
    </>
  )
}

// ─── Completed — success state ─────────────────────────────────────────────────

function FocusCompleted() {
  const focusSession    = useEgolockStore(s => s.focusSession)!
  const clearFocusSession = useEgolockStore(s => s.clearFocusSession)

  const skill   = getSkill(focusSession.skillId)
  const minutes = Math.floor(focusSession.durationSec / 60)

  return (
    <div className="max-w-lg flex flex-col gap-4">
      <Panel accent="neon" title="// SESSION COMPLETE">
        <div className="flex flex-col gap-1 mt-1">
          <p className="text-ink text-sm">
            <span className="text-neon font-bold uppercase tracking-wider">
              {skill?.name ?? focusSession.skillId}
            </span>
            {' '}—{' '}
            <span className="text-neon tabular-nums">
              +{minutes} {minutes === 1 ? 'pt' : 'pts'}
            </span>
          </p>
          {minutes === 0 && (
            <p className="text-dim text-xs">Session was under 1 minute — no points awarded.</p>
          )}
        </div>
      </Panel>

      <Button variant="primary" size="md" onClick={clearFocusSession}>
        DONE
      </Button>
    </div>
  )
}

// ─── Root FocusScreen — routes between the four states ────────────────────────

export default function FocusScreen() {
  const focusSession = useEgolockStore(s => s.focusSession)
  const status       = focusSession?.status ?? null

  if (status === 'running')   return <FocusRunning />
  if (status === 'failed')    return <FocusFailed />
  if (status === 'completed') return <FocusCompleted />
  return <FocusPicker />
}
