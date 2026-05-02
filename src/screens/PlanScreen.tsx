import { useState } from 'react'
import { useEgolockStore } from '../store/useEgolockStore'
import type { PlanningGoal } from '../store/useEgolockStore'
import Panel from '../components/ui/Panel'
import Button from '../components/ui/Button'

// ─── Date helpers (Europe/Sofia local time) ───────────────────────────────────

function getSofiaDate(offsetDays: number = 0): string {
  // Add whole days in ms so the moment-in-time is right, then convert to Sofia tz
  const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000)
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Sofia' })
}

// ─── Status icon + colours ────────────────────────────────────────────────────

function StatusIcon({ status }: { status: PlanningGoal['status'] }) {
  if (status === 'done')   return <span className="text-neon text-sm shrink-0">✓</span>
  if (status === 'failed') return <span className="text-red  text-sm shrink-0">✗</span>
  return <span className="text-dim text-sm shrink-0">○</span>
}

// ─── Single goal row ──────────────────────────────────────────────────────────

interface GoalRowProps {
  goal: PlanningGoal
  showActions: boolean // pending goals show DONE/FAIL/DELETE; resolved show only DELETE
}

function GoalRow({ goal, showActions }: GoalRowProps) {
  const markGoalStatus = useEgolockStore(s => s.markGoalStatus)
  const deleteGoal     = useEgolockStore(s => s.deleteGoal)

  const isPending = goal.status === 'pending'

  return (
    <div className="flex items-center gap-2 py-2 border-b border-line last:border-0">
      <StatusIcon status={goal.status} />
      <span className={`flex-1 text-xs leading-snug ${goal.status === 'failed' ? 'text-dim line-through' : 'text-ink'}`}>
        {goal.text}
      </span>
      {showActions && (
        <div className="flex gap-1 shrink-0">
          {isPending && (
            <>
              <button
                onClick={() => markGoalStatus(goal.id, 'done')}
                className="label text-[10px] text-neon border border-neon px-1.5 py-0.5 hover:bg-neon hover:text-black transition-colors"
              >
                DONE
              </button>
              <button
                onClick={() => markGoalStatus(goal.id, 'failed')}
                className="label text-[10px] text-red border border-red px-1.5 py-0.5 hover:bg-red hover:text-black transition-colors"
              >
                FAIL
              </button>
            </>
          )}
          <button
            onClick={() => deleteGoal(goal.id)}
            className="label text-[10px] text-dim border border-line px-1.5 py-0.5 hover:border-red hover:text-red transition-colors"
          >
            DEL
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Add-goal form ────────────────────────────────────────────────────────────

function AddGoalForm({ date, count }: { date: string; count: number }) {
  const addPlannedGoal = useEgolockStore(s => s.addPlannedGoal)
  const [text, setText] = useState('')

  const atLimit = count >= 3

  const submit = () => {
    if (!text.trim() || atLimit) return
    addPlannedGoal(text.trim(), date)
    setText('')
  }

  if (atLimit) {
    return (
      <p className="label text-dim text-[10px] mt-2">
        // 3 goals max — egoism, not greed
      </p>
    )
  }

  return (
    <div className="flex gap-2 mt-3">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Add a target..."
        className="flex-1 bg-bg border border-line text-ink font-mono text-xs px-3 py-2 focus:border-neon outline-none placeholder:text-dim"
      />
      <Button variant="ghost" size="sm" onClick={submit} disabled={!text.trim()}>
        ADD
      </Button>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PlanScreen() {
  const planning = useEgolockStore(s => s.planning)

  const todayStr    = getSofiaDate(0)
  const tomorrowStr = getSofiaDate(1)

  // Bucket goals by date and status
  const todayGoals    = planning.filter(g => g.date === todayStr)
  const tomorrowGoals = planning.filter(g => g.date === tomorrowStr)
  const pastDue       = planning.filter(g => g.status === 'pending' && g.date < todayStr)

  // History: resolved goals, newest first, last 30 days
  const cutoff = getSofiaDate(-30)
  const history = planning
    .filter(g => (g.status === 'done' || g.status === 'failed') && g.date >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date))

  const [showHistory, setShowHistory] = useState(false)

  return (
    <div className="flex flex-col gap-4 max-w-2xl">

      {/* ── PAST DUE (red panel, shown only when there are overdue items) ─── */}
      {pastDue.length > 0 && (
        <Panel accent="red" title="// REGRESSION — UNRESOLVED PROMISES">
          <p className="text-dim text-xs mb-3 leading-relaxed">
            These goals are past due and still pending. -$10 per failure or overdue delete.
          </p>
          {pastDue.map(g => (
            <GoalRow key={g.id} goal={g} showActions />
          ))}
        </Panel>
      )}

      {/* ── TOMORROW ──────────────────────────────────────────────────────── */}
      <Panel title="// TOMORROW'S TARGETS">
        <div className="label text-dim text-[10px] mb-2">{tomorrowStr}</div>
        {tomorrowGoals.length === 0 && (
          <p className="text-dim text-xs">// nothing planned yet.</p>
        )}
        {tomorrowGoals.map(g => (
          <GoalRow key={g.id} goal={g} showActions={g.status === 'pending'} />
        ))}
        <AddGoalForm
          date={tomorrowStr}
          count={tomorrowGoals.filter(g => g.status === 'pending').length}
        />
      </Panel>

      {/* ── TODAY ─────────────────────────────────────────────────────────── */}
      <Panel title="// TODAY'S TARGETS">
        <div className="label text-dim text-[10px] mb-2">{todayStr}</div>
        {todayGoals.length === 0 && (
          <p className="text-dim text-xs">// nothing planned for today.</p>
        )}
        {todayGoals.map(g => (
          <GoalRow key={g.id} goal={g} showActions />
        ))}
        <AddGoalForm
          date={todayStr}
          count={todayGoals.filter(g => g.status === 'pending').length}
        />
      </Panel>

      {/* ── HISTORY (collapsible) ─────────────────────────────────────────── */}
      {history.length > 0 && (
        <Panel title="HISTORY">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="label text-dim hover:text-neon transition-colors text-[10px] mb-2"
          >
            {showHistory ? '▲ COLLAPSE' : `▼ SHOW ${history.length} RESOLVED GOALS`}
          </button>

          {showHistory && (
            <div className="flex flex-col">
              {history.map(g => (
                <div
                  key={g.id}
                  className="flex items-center gap-3 py-1.5 border-b border-line last:border-0 text-xs"
                >
                  <span className="text-dim tabular-nums shrink-0 w-24">{g.date}</span>
                  <StatusIcon status={g.status} />
                  <span className={`flex-1 truncate ${g.status === 'failed' ? 'text-dim line-through' : 'text-ink'}`}>
                    {g.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

    </div>
  )
}
