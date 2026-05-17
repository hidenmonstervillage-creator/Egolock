// ─── Types ────────────────────────────────────────────────────────────────────

export type Rarity   = 'Common' | 'Rare' | 'Epic'
export type BranchId = 'mental' | 'physical' | 'health' | 'entrepreneur'

export interface Branch {
  id:    BranchId
  name:  string   // display name, uppercase
  color: string   // accent hex colour
}

export interface SkillDef {
  id:                string
  name:              string
  branchId:          BranchId
  rarity:            Rarity
  isCustomNameable?: boolean   // true only for the Sport skill
}

// ─── Branches ─────────────────────────────────────────────────────────────────
// Order here controls section order in every UI that iterates branches.

export const BRANCHES: Branch[] = [
  { id: 'mental',       name: 'MENTAL',       color: '#00E5FF' },
  { id: 'physical',     name: 'PHYSICAL',     color: '#FF2E4D' },
  { id: 'health',       name: 'HEALTH',       color: '#7FFFB2' },
  { id: 'entrepreneur', name: 'ENTREPRENEUR', color: '#FFD400' },
]

// ─── System skills ─────────────────────────────────────────────────────────────

export const SYSTEM_SKILLS: SkillDef[] = [
  // MENTAL
  { id: 'focus',        name: 'Focus',        branchId: 'mental',       rarity: 'Common' },
  { id: 'discipline',   name: 'Discipline',   branchId: 'mental',       rarity: 'Common' },
  { id: 'willpower',    name: 'Willpower',    branchId: 'mental',       rarity: 'Common' },
  // PHYSICAL
  { id: 'strength',     name: 'Strength',     branchId: 'physical',     rarity: 'Common' },
  { id: 'flexibility',  name: 'Flexibility',  branchId: 'physical',     rarity: 'Rare'   },
  { id: 'stamina',      name: 'Stamina',      branchId: 'physical',     rarity: 'Rare'   },
  { id: 'sport',        name: 'Combat Sport', branchId: 'physical',     rarity: 'Epic',  isCustomNameable: true },
  // HEALTH
  { id: 'sleep',        name: 'Sleep',        branchId: 'health',       rarity: 'Rare'   },
  { id: 'nutrition',    name: 'Nutrition',    branchId: 'health',       rarity: 'Common' },
  // ENTREPRENEUR
  { id: 'sales',        name: 'Sales',        branchId: 'entrepreneur', rarity: 'Epic'   },
  { id: 'marketing',    name: 'Marketing',    branchId: 'entrepreneur', rarity: 'Rare'   },
]

// ─── Thresholds (V2 — reduced 0.6× from V1, rounded to clean integers) ────────

export const THRESHOLDS: Record<Rarity, number[]> = {
  Common: [6, 15, 36, 90, 240, 600, 1500, 3000, 6000, 12000, 24000, 36000, 48000, 60000],
  Rare:   [12, 30, 72, 180, 480, 1200, 3000, 6000, 12000, 24000, 48000, 72000, 96000, 120000],
  Epic:   [18, 45, 108, 270, 720, 1800, 4500, 9000, 18000, 36000, 72000, 108000, 144000, 180000],
}

// ─── Multipliers / capital ─────────────────────────────────────────────────────

export const RARITY_MULTIPLIER: Record<Rarity, number> = {
  Common: 1.0,
  Rare:   1.5,
  Epic:   2.5,
}

export const CAPITAL_PER_LEVEL: Record<Rarity, number> = {
  Common: 5,
  Rare:   10,
  Epic:   20,
}

export const MAX_LEVEL = 15

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getBranch(id: BranchId): Branch {
  const b = BRANCHES.find(b => b.id === id)
  if (!b) throw new Error(`Unknown branch: ${id}`)
  return b
}

/** Look up a skill def — system skills first, then custom defs. */
export function getSkillDef(id: string, customDefs?: SkillDef[]): SkillDef | undefined {
  return SYSTEM_SKILLS.find(s => s.id === id) ?? customDefs?.find(s => s.id === id)
}

/** All skills in a branch (system + custom). */
export function getSkillsInBranch(branchId: BranchId, customDefs?: SkillDef[]): SkillDef[] {
  const system = SYSTEM_SKILLS.filter(s => s.branchId === branchId)
  const custom = (customDefs ?? []).filter(s => s.branchId === branchId)
  return [...system, ...custom]
}

/** All skill defs: system skills followed by custom defs. */
export function getAllSkillDefs(customDefs?: SkillDef[]): SkillDef[] {
  return [...SYSTEM_SKILLS, ...(customDefs ?? [])]
}
