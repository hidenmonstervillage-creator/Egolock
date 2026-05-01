import { SKILLS, THRESHOLDS, RARITY_MULTIPLIER, MAX_LEVEL } from './skills'
import type { Rarity } from './skills'

export type MomentumState = 'relentless' | 'consistent' | 'stagnant' | 'elimination'

export function computeLevel(rarity: Rarity, points: number): number {
  const thresholds = THRESHOLDS[rarity]
  let level = 0
  for (let i = 0; i < thresholds.length; i++) {
    if (points >= thresholds[i]) level = i + 1
    else break
  }
  return Math.min(level, MAX_LEVEL)
}

export function pointsToNextLevel(
  rarity: Rarity,
  points: number,
): { current: number; next: number | null; remaining: number; pct: number } {
  const thresholds = THRESHOLDS[rarity]
  const level = computeLevel(rarity, points)

  if (level >= MAX_LEVEL) {
    const current = thresholds[thresholds.length - 1]
    return { current, next: null, remaining: 0, pct: 1 }
  }

  const current = level > 0 ? thresholds[level - 1] : 0
  const next = thresholds[level]
  const span = next - current
  const progress = points - current
  const pct = span > 0 ? Math.min(progress / span, 1) : 0

  return { current, next, remaining: next - points, pct }
}

export function computeEgoistScore(skillPoints: Record<string, number>): number {
  return SKILLS.reduce((sum, skill) => {
    const pts = skillPoints[skill.id] ?? 0
    return sum + pts * RARITY_MULTIPLIER[skill.rarity]
  }, 0)
}

export function momentumMultiplier(state: MomentumState): number {
  switch (state) {
    case 'relentless':  return 1.05
    case 'consistent':  return 1.00
    case 'stagnant':    return 0.90
    case 'elimination': return 0.50
  }
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function computeMomentum(args: {
  lastLogDates: string[]
  uniqueSkillsToday: number
  now: Date
}): MomentumState {
  const { lastLogDates, uniqueSkillsToday, now } = args

  if (uniqueSkillsToday >= 3) return 'relentless'
  if (uniqueSkillsToday >= 1) return 'consistent'

  // 0 logged today — check consecutive missed days
  if (lastLogDates.length === 0) return 'elimination'

  const today = toDateStr(now)

  // Count consecutive days going back from yesterday with no log
  let missedDays = 0
  const check = new Date(now)
  check.setDate(check.getDate() - 1)

  while (missedDays < 3) {
    const dayStr = toDateStr(check)
    if (lastLogDates.includes(dayStr)) break
    missedDays++
    check.setDate(check.getDate() - 1)
  }

  // If we've gone back 3 full days without finding a log entry
  if (missedDays >= 3) return 'elimination'

  // Check if last log was within 24h
  const mostRecent = lastLogDates[0] // sorted desc
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toDateStr(yesterday)

  if (mostRecent === today || mostRecent === yesterdayStr) return 'stagnant'

  return 'elimination'
}

export function finalEgoistScore(
  skillPoints: Record<string, number>,
  momentumState: MomentumState,
): number {
  return computeEgoistScore(skillPoints) * momentumMultiplier(momentumState)
}
