import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SKILLS, CAPITAL_PER_LEVEL, getSkill } from '../lib/skills'
import {
  computeLevel,
  computeMomentum,
  finalEgoistScore,
  type MomentumState,
} from '../lib/leveling'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Profile {
  username: string
  egoStatement: string
  egoType: { x: number; y: number } | null
  irlGoals: string[]
}

export interface ActionLogEntry {
  id: string
  ts: number
  skillId: string
  points: number
  label: string
}

export interface PlanningGoal {
  id: string
  date: string // YYYY-MM-DD
  text: string
  status: 'pending' | 'done' | 'failed'
}

export interface EvolutionEntry {
  id: string
  ts: number
  trigger: 'focus-fail' | 'extreme-resistance' | 'manual'
  answer: string
}

export interface CustomReward {
  id: string
  name: string
  cost: number
}

export interface OwnedReward {
  rewardId: string
  ts: number
}

export interface LevelUpEvent {
  skillId: string
  newLevel: number
  capitalAwarded: number
  ts: number
}

export interface FocusSession {
  skillId: string
  durationSec: number   // total chosen duration in seconds
  startedAt: number     // Date.now() at the moment ENGAGE was pressed
  status: 'running' | 'completed' | 'failed'
  failedAt: number | null
}

// ─── State + Actions ──────────────────────────────────────────────────────────

interface EgolockState {
  // ── Persisted ────────────────────────────────────────────────────────────
  profile: Profile
  skillPoints: Record<string, number>
  capital: number
  actionLog: ActionLogEntry[]
  planning: PlanningGoal[]
  evolutionArchive: EvolutionEntry[]
  customRewards: CustomReward[]
  ownedRewards: OwnedReward[]
  momentum: MomentumState
  lastSeenDate: string
  // focusSession IS persisted — so refreshing during a session doesn't escape the timer.
  // The anti-cheat (visibilitychange / blur) only fires while the app is alive.
  // Refreshing resumes the countdown from where it was.
  focusSession: FocusSession | null

  // ── In-memory only (excluded from localStorage via partialize) ────────
  lastLevelUp: LevelUpEvent | null

  // ── Actions ───────────────────────────────────────────────────────────
  logAction: (skillId: string, points: number, label: string) => void
  clearLastLevelUp: () => void
  startFocusSession: (skillId: string, durationSec: number) => boolean
  failFocusSession: () => void
  completeFocusSession: () => void
  clearFocusSession: () => void
  addCustomReward: (name: string, cost: number) => void
  purchaseReward: (rewardId: string) => boolean
  addPlannedGoal: (text: string, dateISO: string) => void
  markGoalStatus: (id: string, status: PlanningGoal['status']) => void
  deleteGoal: (id: string) => void
  addEvolutionEntry: (trigger: EvolutionEntry['trigger'], answer: string) => void
  updateProfile: (partial: Partial<Profile>) => void
  recomputeMomentum: (now?: Date) => void
  rolloverIfNewDay: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function initSkillPoints(): Record<string, number> {
  return Object.fromEntries(SKILLS.map(s => [s.id, 0]))
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEgolockStore = create<EgolockState>()(
  persist(
    (set, get) => ({
      // ── Initial persisted state ────────────────────────────────────────────
      profile: {
        username: '',
        egoStatement: '',
        egoType: null,
        irlGoals: [],
      },
      skillPoints: initSkillPoints(),
      capital: 0,
      actionLog: [],
      planning: [],
      evolutionArchive: [],
      customRewards: [],
      ownedRewards: [],
      momentum: 'consistent',
      lastSeenDate: toDateStr(new Date()),
      focusSession: null,

      // ── Initial in-memory state ────────────────────────────────────────────
      lastLevelUp: null,

      // ── logAction ──────────────────────────────────────────────────────────
      logAction(skillId, points, label) {
        const skill = getSkill(skillId)
        if (!skill) return

        const prev = get().skillPoints[skillId] ?? 0
        const prevLevel = computeLevel(skill.rarity, prev)
        const newPts = prev + points
        const newLevel = computeLevel(skill.rarity, newPts)
        const levelsGained = newLevel - prevLevel
        const capitalAwarded = levelsGained > 0
          ? levelsGained * CAPITAL_PER_LEVEL[skill.rarity]
          : 0

        const entry: ActionLogEntry = {
          id: uid(),
          ts: Date.now(),
          skillId,
          points,
          label,
        }

        set(state => ({
          actionLog: [entry, ...state.actionLog],
          skillPoints: { ...state.skillPoints, [skillId]: newPts },
          capital: state.capital + capitalAwarded,
          ...(levelsGained > 0
            ? {
                lastLevelUp: {
                  skillId,
                  newLevel,
                  capitalAwarded,
                  ts: Date.now(),
                },
              }
            : {}),
        }))
      },

      // ── clearLastLevelUp ───────────────────────────────────────────────────
      clearLastLevelUp() {
        set({ lastLevelUp: null })
      },

      // ── startFocusSession ──────────────────────────────────────────────────
      startFocusSession(skillId, durationSec) {
        if (get().focusSession?.status === 'running') return false
        set({
          focusSession: {
            skillId,
            durationSec,
            startedAt: Date.now(),
            status: 'running',
            failedAt: null,
          },
        })
        return true
      },

      // ── failFocusSession ───────────────────────────────────────────────────
      failFocusSession() {
        const s = get().focusSession
        if (!s || s.status !== 'running') return
        set({ focusSession: { ...s, status: 'failed', failedAt: Date.now() } })
      },

      // ── completeFocusSession ───────────────────────────────────────────────
      completeFocusSession() {
        const s = get().focusSession
        if (!s || s.status !== 'running') return
        // Award +1 pt per full minute of chosen duration
        const minutes = Math.floor(s.durationSec / 60)
        if (minutes > 0) {
          get().logAction(s.skillId, minutes, `Focus Session — ${minutes} min`)
        }
        // Mark completed but don't clear — UI will call clearFocusSession after
        // the user has seen the success state and clicked DONE
        set({ focusSession: { ...s, status: 'completed' } })
      },

      // ── clearFocusSession ──────────────────────────────────────────────────
      clearFocusSession() {
        set({ focusSession: null })
      },

      // ── addCustomReward ────────────────────────────────────────────────────
      addCustomReward(name, cost) {
        const reward: CustomReward = { id: uid(), name, cost }
        set(state => ({ customRewards: [...state.customRewards, reward] }))
      },

      // ── purchaseReward ─────────────────────────────────────────────────────
      purchaseReward(rewardId) {
        const state = get()
        const reward = state.customRewards.find(r => r.id === rewardId)
        if (!reward || state.capital < reward.cost) return false
        set(s => ({
          capital: s.capital - reward.cost,
          ownedRewards: [...s.ownedRewards, { rewardId, ts: Date.now() }],
        }))
        return true
      },

      // ── addPlannedGoal ─────────────────────────────────────────────────────
      addPlannedGoal(text, dateISO) {
        const goal: PlanningGoal = {
          id: uid(),
          date: dateISO,
          text,
          status: 'pending',
        }
        set(state => ({ planning: [...state.planning, goal] }))
      },

      // ── markGoalStatus ─────────────────────────────────────────────────────
      markGoalStatus(id, status) {
        const failureTax = status === 'failed' ? -10 : 0
        set(state => ({
          planning: state.planning.map(g =>
            g.id === id ? { ...g, status } : g,
          ),
          capital: state.capital + failureTax,
        }))
      },

      // ── deleteGoal ─────────────────────────────────────────────────────────
      deleteGoal(id) {
        const state = get()
        const found = state.planning.find(g => g.id === id)
        const today = toDateStr(new Date())
        const isOverdue = found?.status === 'pending' && found.date < today
        set(s => ({
          planning: s.planning.filter(g => g.id !== id),
          capital: s.capital + (isOverdue ? -10 : 0),
        }))
      },

      // ── addEvolutionEntry ──────────────────────────────────────────────────
      addEvolutionEntry(trigger, answer) {
        const entry: EvolutionEntry = { id: uid(), ts: Date.now(), trigger, answer }
        set(state => ({ evolutionArchive: [entry, ...state.evolutionArchive] }))
      },

      // ── updateProfile ──────────────────────────────────────────────────────
      updateProfile(partial) {
        set(state => ({ profile: { ...state.profile, ...partial } }))
      },

      // ── recomputeMomentum ──────────────────────────────────────────────────
      recomputeMomentum(now = new Date()) {
        const { actionLog } = get()
        const todayStr = toDateStr(now)

        const uniqueSkillsToday = new Set(
          actionLog
            .filter(e => toDateStr(new Date(e.ts)) === todayStr)
            .map(e => e.skillId),
        ).size

        const lastLogDates = [
          ...new Set(actionLog.map(e => toDateStr(new Date(e.ts)))),
        ].sort().reverse()

        const momentum = computeMomentum({ lastLogDates, uniqueSkillsToday, now })
        set({ momentum })
      },

      // ── rolloverIfNewDay ───────────────────────────────────────────────────
      rolloverIfNewDay() {
        const state = get()
        const today = toDateStr(new Date())
        if (state.lastSeenDate === today) return

        const now = new Date()
        let taxAccumulated = 0
        const updatedPlanning = state.planning.map(g => {
          if (g.status === 'pending' && g.date < today) {
            taxAccumulated += 10
            return { ...g, status: 'failed' as const }
          }
          return g
        })

        set({
          planning: updatedPlanning,
          capital: state.capital - taxAccumulated,
          lastSeenDate: today,
        })

        get().recomputeMomentum(now)
      },
    }),
    {
      name: 'egolock-v1',
      version: 1,
      // focusSession IS persisted (anti-escape). lastLevelUp is NOT (in-memory only).
      partialize: (state) => ({
        profile:          state.profile,
        skillPoints:      state.skillPoints,
        capital:          state.capital,
        actionLog:        state.actionLog,
        planning:         state.planning,
        evolutionArchive: state.evolutionArchive,
        customRewards:    state.customRewards,
        ownedRewards:     state.ownedRewards,
        momentum:         state.momentum,
        lastSeenDate:     state.lastSeenDate,
        focusSession:     state.focusSession,
      }),
    },
  ),
)

// ─── Selectors ────────────────────────────────────────────────────────────────

export function selectEgoistScore(state: EgolockState): number {
  return finalEgoistScore(state.skillPoints, state.momentum)
}

export function selectUniqueSkillsToday(state: EgolockState): number {
  const todayStr = new Date().toISOString().slice(0, 10)
  return new Set(
    state.actionLog
      .filter(e => new Date(e.ts).toISOString().slice(0, 10) === todayStr)
      .map(e => e.skillId),
  ).size
}

export function selectLevel(state: EgolockState, skillId: string): number {
  const skill = getSkill(skillId)
  if (!skill) return 0
  return computeLevel(skill.rarity, state.skillPoints[skillId] ?? 0)
}
