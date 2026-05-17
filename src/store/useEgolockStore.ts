import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  SYSTEM_SKILLS,
  CAPITAL_PER_LEVEL,
  getSkillDef,
} from '../lib/skills'
import type { SkillDef } from '../lib/skills'
import {
  computeLevel,
  computeMomentum,
  finalEgoistScore,
  type MomentumState,
} from '../lib/leveling'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EgoArchetype = 'genius' | 'talented-learner'

export interface Profile {
  username:                  string
  egoStatement:              string
  egoType:                   { x: number; y: number } | null
  egoArchetype:              EgoArchetype | null
  egoTestCompletedAt:        number | null       // epoch ms; null = never tested
  egoTestUnlockedManualEdit: boolean             // true after 14 days post-test
  avatarDataUrl:             string | null       // base64 JPEG data URL, client-compressed
  irlGoals:                  string[]
}

export interface ActionLogEntry {
  id:      string
  ts:      number
  skillId: string
  points:  number
  label:   string
}

export interface PlanningGoal {
  id:     string
  date:   string   // YYYY-MM-DD (Europe/Sofia local time)
  text:   string
  status: 'pending' | 'done' | 'failed'
}

export interface EvolutionEntry {
  id:      string
  ts:      number
  trigger: 'focus-fail' | 'extreme-resistance' | 'manual'
  answer:  string
}

export interface CustomReward {
  id:   string
  name: string
  cost: number
}

export interface OwnedReward {
  rewardId: string
  ts:       number
}

export interface LevelUpEvent {
  skillId:       string
  newLevel:      number
  capitalAwarded: number
  ts:            number
}

export interface FocusSession {
  skillId:    string
  durationSec: number
  startedAt:  number
  status:     'running' | 'completed' | 'failed'
  failedAt:   number | null
}

// ─── State + Actions ──────────────────────────────────────────────────────────

interface EgolockState {
  // ── Persisted ────────────────────────────────────────────────────────────
  profile:          Profile
  skillPoints:      Record<string, number>
  capital:          number
  actionLog:        ActionLogEntry[]
  planning:         PlanningGoal[]
  evolutionArchive: EvolutionEntry[]
  customRewards:    CustomReward[]
  ownedRewards:     OwnedReward[]
  momentum:         MomentumState
  lastSeenDate:     string
  focusSession:     FocusSession | null

  // ── V2 persisted ─────────────────────────────────────────────────────────
  isPremium:         boolean
  customSkills:      SkillDef[]
  sportSkillName:    string    // display name only; skill ID stays 'sport'
  sportNamePrompted: boolean   // true once the naming dialog has been shown

  // ── In-memory only (excluded from localStorage via partialize) ────────
  lastLevelUp: LevelUpEvent | null

  // ── Actions ───────────────────────────────────────────────────────────
  logAction:          (skillId: string, points: number, label: string) => void
  clearLastLevelUp:   () => void
  startFocusSession:  (skillId: string, durationSec: number) => boolean
  failFocusSession:   () => void
  completeFocusSession: () => void
  clearFocusSession:  () => void
  addCustomReward:    (name: string, cost: number) => void
  removeCustomReward: (id: string) => void
  purchaseReward:     (rewardId: string) => boolean
  addPlannedGoal:     (text: string, dateISO: string) => void
  markGoalStatus:     (id: string, status: PlanningGoal['status']) => void
  deleteGoal:         (id: string) => void
  addEvolutionEntry:  (trigger: EvolutionEntry['trigger'], answer: string) => void
  removeEvolutionEntry: (id: string) => void
  updateProfile:      (partial: Partial<Profile>) => void
  recomputeMomentum:  (now?: Date) => void
  rolloverIfNewDay:   () => void
  // ── Ego test actions ──────────────────────────────────────────────────────
  completeEgoTest:    (params: { x: number; y: number; archetype: EgoArchetype }) => void
  setEgoPosition:     (x: number, y: number) => void
  checkEgoEditUnlock: () => void
  resetEgoTest:       () => void
  // ── Avatar actions ────────────────────────────────────────────────────────
  setAvatar:          (dataUrl: string) => void
  clearAvatar:        () => void
  // ── V2 actions ────────────────────────────────────────────────────────────
  setPremium:         (value: boolean) => void
  addCustomSkill:     (def: SkillDef) => boolean   // false if already at 5-skill cap
  removeCustomSkill:  (id: string) => void
  setSportSkillName:  (name: string) => void
  markSportNamePrompted: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function sofiaToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Sofia' })
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function initSkillPoints(): Record<string, number> {
  return Object.fromEntries(SYSTEM_SKILLS.map(s => [s.id, 0]))
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEgolockStore = create<EgolockState>()(
  persist(
    (set, get) => ({
      // ── Initial persisted state ────────────────────────────────────────────
      profile: {
        username:                  '',
        egoStatement:              '',
        egoType:                   null,
        egoArchetype:              null,
        egoTestCompletedAt:        null,
        egoTestUnlockedManualEdit: false,
        avatarDataUrl:             null,
        irlGoals:                  [],
      },
      skillPoints:      initSkillPoints(),
      capital:          0,
      actionLog:        [],
      planning:         [],
      evolutionArchive: [],
      customRewards:    [],
      ownedRewards:     [],
      momentum:         'consistent',
      lastSeenDate:     toDateStr(new Date()),
      focusSession:     null,

      // ── V2 initial state ──────────────────────────────────────────────────
      isPremium:         false,
      customSkills:      [],
      sportSkillName:    'Combat Sport',
      sportNamePrompted: false,

      // ── Initial in-memory state ────────────────────────────────────────────
      lastLevelUp: null,

      // ── logAction ──────────────────────────────────────────────────────────
      logAction(skillId, points, label) {
        const state = get()
        const skill = getSkillDef(skillId, state.customSkills)
        if (!skill) return

        const prev           = state.skillPoints[skillId] ?? 0
        const prevLevel      = computeLevel(skill.rarity, prev)
        const newPts         = prev + points
        const newLevel       = computeLevel(skill.rarity, newPts)
        const levelsGained   = newLevel - prevLevel
        const capitalAwarded = levelsGained > 0
          ? levelsGained * CAPITAL_PER_LEVEL[skill.rarity]
          : 0

        const entry: ActionLogEntry = {
          id: uid(), ts: Date.now(), skillId, points, label,
        }

        set(s => ({
          actionLog:   [entry, ...s.actionLog],
          skillPoints: { ...s.skillPoints, [skillId]: newPts },
          capital:     s.capital + capitalAwarded,
          ...(levelsGained > 0
            ? { lastLevelUp: { skillId, newLevel, capitalAwarded, ts: Date.now() } }
            : {}),
        }))
      },

      // ── clearLastLevelUp ───────────────────────────────────────────────────
      clearLastLevelUp() {
        set({ lastLevelUp: null })
      },

      // ── Focus session actions ──────────────────────────────────────────────
      startFocusSession(skillId, durationSec) {
        if (get().focusSession?.status === 'running') return false
        set({
          focusSession: {
            skillId, durationSec, startedAt: Date.now(),
            status: 'running', failedAt: null,
          },
        })
        return true
      },

      failFocusSession() {
        const s = get().focusSession
        if (!s || s.status !== 'running') return
        set({ focusSession: { ...s, status: 'failed', failedAt: Date.now() } })
      },

      completeFocusSession() {
        const s = get().focusSession
        if (!s || s.status !== 'running') return
        const minutes = Math.floor(s.durationSec / 60)
        if (minutes > 0) {
          get().logAction(s.skillId, minutes, `Focus Session — ${minutes} min`)
        }
        set({ focusSession: { ...s, status: 'completed' } })
      },

      clearFocusSession() {
        set({ focusSession: null })
      },

      // ── Reward actions ─────────────────────────────────────────────────────
      addCustomReward(name, cost) {
        const reward: CustomReward = { id: uid(), name, cost }
        set(state => ({ customRewards: [...state.customRewards, reward] }))
      },

      removeCustomReward(id) {
        set(state => ({ customRewards: state.customRewards.filter(r => r.id !== id) }))
      },

      purchaseReward(rewardId) {
        const state  = get()
        const reward = state.customRewards.find(r => r.id === rewardId)
        if (!reward || state.capital < reward.cost) return false
        set(s => ({
          capital:      Math.max(0, s.capital - reward.cost),
          ownedRewards: [...s.ownedRewards, { rewardId, ts: Date.now() }],
        }))
        return true
      },

      // ── Planning actions ───────────────────────────────────────────────────
      addPlannedGoal(text, dateISO) {
        const goal: PlanningGoal = { id: uid(), date: dateISO, text, status: 'pending' }
        set(state => ({ planning: [...state.planning, goal] }))
      },

      markGoalStatus(id, status) {
        const current       = get().planning.find(g => g.id === id)
        const alreadyFailed = current?.status === 'failed'
        const chargeTax     = status === 'failed' && !alreadyFailed
        set(state => ({
          planning: state.planning.map(g => g.id === id ? { ...g, status } : g),
          capital:  Math.max(0, state.capital - (chargeTax ? 10 : 0)),
        }))
      },

      deleteGoal(id) {
        const state     = get()
        const found     = state.planning.find(g => g.id === id)
        const today     = sofiaToday()
        const isOverdue = found?.status === 'pending' && !!found.date && found.date < today
        set(s => ({
          planning: s.planning.filter(g => g.id !== id),
          capital:  Math.max(0, s.capital - (isOverdue ? 10 : 0)),
        }))
      },

      // ── Evolution archive ──────────────────────────────────────────────────
      addEvolutionEntry(trigger, answer) {
        const entry: EvolutionEntry = { id: uid(), ts: Date.now(), trigger, answer }
        set(state => ({ evolutionArchive: [entry, ...state.evolutionArchive] }))
      },

      removeEvolutionEntry(id) {
        set(state => ({ evolutionArchive: state.evolutionArchive.filter(e => e.id !== id) }))
      },

      // ── Profile ────────────────────────────────────────────────────────────
      updateProfile(partial) {
        set(state => ({ profile: { ...state.profile, ...partial } }))
      },

      // ── Momentum ───────────────────────────────────────────────────────────
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

      // ── Rollover ───────────────────────────────────────────────────────────
      rolloverIfNewDay() {
        const state = get()
        const today = toDateStr(new Date())
        if (state.lastSeenDate === today) return
        set({ lastSeenDate: today })
        get().recomputeMomentum()
        get().checkEgoEditUnlock()
      },

      // ── Ego test ───────────────────────────────────────────────────────────
      completeEgoTest({ x, y, archetype }) {
        set(state => ({
          profile: {
            ...state.profile,
            egoType:                   { x, y },
            egoArchetype:              archetype,
            egoTestCompletedAt:        Date.now(),
            egoTestUnlockedManualEdit: false,
          },
        }))
      },

      setEgoPosition(x, y) {
        if (!get().profile.egoTestUnlockedManualEdit) return
        set(state => ({
          profile: { ...state.profile, egoType: { x, y } },
        }))
      },

      checkEgoEditUnlock() {
        const { egoTestCompletedAt, egoTestUnlockedManualEdit } = get().profile
        if (!egoTestCompletedAt || egoTestUnlockedManualEdit) return
        const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
        if (Date.now() - egoTestCompletedAt >= FOURTEEN_DAYS_MS) {
          set(state => ({
            profile: { ...state.profile, egoTestUnlockedManualEdit: true },
          }))
        }
      },

      resetEgoTest() {
        set(state => ({
          profile: {
            ...state.profile,
            egoType:                   null,
            egoArchetype:              null,
            egoTestCompletedAt:        null,
            egoTestUnlockedManualEdit: false,
          },
        }))
      },

      // ── Avatar ─────────────────────────────────────────────────────────────
      setAvatar(dataUrl) {
        set(state => ({ profile: { ...state.profile, avatarDataUrl: dataUrl } }))
      },

      clearAvatar() {
        set(state => ({ profile: { ...state.profile, avatarDataUrl: null } }))
      },

      // ── V2 actions ─────────────────────────────────────────────────────────
      setPremium(value) {
        set({ isPremium: value })
      },

      addCustomSkill(def) {
        const state = get()
        if (state.customSkills.length >= 5) return false
        set(s => ({ customSkills: [...s.customSkills, def] }))
        return true
      },

      removeCustomSkill(id) {
        set(s => ({ customSkills: s.customSkills.filter(d => d.id !== id) }))
      },

      setSportSkillName(name) {
        set({ sportSkillName: name })
      },

      markSportNamePrompted() {
        set({ sportNamePrompted: true })
      },
    }),
    {
      name: 'egolock-v1',
      version: 4,
      migrate(persistedState: unknown, version: number) {
        const s = persistedState as Record<string, unknown>

        // v1 → v2: ego test fields added to profile
        if (version < 2) {
          const p = (s.profile ?? {}) as Record<string, unknown>
          s.profile = {
            ...p,
            egoArchetype:              p.egoArchetype              ?? null,
            egoTestCompletedAt:        p.egoTestCompletedAt        ?? null,
            egoTestUnlockedManualEdit: p.egoTestUnlockedManualEdit ?? false,
          }
        }

        // v2 → v3: avatar field added to profile
        if (version < 3) {
          const p = (s.profile ?? {}) as Record<string, unknown>
          s.profile = { ...p, avatarDataUrl: p.avatarDataUrl ?? null }
        }

        // v3 → v4: V2 skill tree
        if (version < 4) {
          // ── Skill point migrations ──────────────────────────────────────────
          const sp = ((s.skillPoints ?? {}) as Record<string, number>)

          // conditioning (Rare Health, removed) → 50% goodwill transfer to stamina
          const condPts = sp['conditioning'] ?? 0
          if (condPts > 0) {
            sp['stamina'] = (sp['stamina'] ?? 0) + Math.floor(condPts / 2)
          }
          delete sp['conditioning']

          // kickboxing (Epic Combat, removed) → 100% transfer to sport
          const kbPts = sp['kickboxing'] ?? 0
          if (kbPts > 0) {
            sp['sport'] = (sp['sport'] ?? 0) + kbPts
          }
          delete sp['kickboxing']

          // Zero-init any new V2 skill IDs not already present
          for (const id of ['stamina', 'sport', 'nutrition', 'marketing']) {
            if (!(id in sp)) sp[id] = 0
          }

          s.skillPoints = sp

          // ── New store fields ────────────────────────────────────────────────
          s.isPremium         = false
          s.customSkills      = []
          s.sportSkillName    = 'Combat Sport'
          // Existing users: mark prompted so the naming dialog never shows
          s.sportNamePrompted = true
        }

        return s
      },
      partialize: (state) => ({
        profile:           state.profile,
        skillPoints:       state.skillPoints,
        capital:           state.capital,
        actionLog:         state.actionLog,
        planning:          state.planning,
        evolutionArchive:  state.evolutionArchive,
        customRewards:     state.customRewards,
        ownedRewards:      state.ownedRewards,
        momentum:          state.momentum,
        lastSeenDate:      state.lastSeenDate,
        focusSession:      state.focusSession,
        isPremium:         state.isPremium,
        customSkills:      state.customSkills,
        sportSkillName:    state.sportSkillName,
        sportNamePrompted: state.sportNamePrompted,
      }),
    },
  ),
)

// ─── Selectors ────────────────────────────────────────────────────────────────

export function selectEgoistScore(state: EgolockState): number {
  return finalEgoistScore(state.skillPoints, state.momentum, state.customSkills)
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
  const skill = getSkillDef(skillId, state.customSkills)
  if (!skill) return 0
  return computeLevel(skill.rarity, state.skillPoints[skillId] ?? 0)
}
