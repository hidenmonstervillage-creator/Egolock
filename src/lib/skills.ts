export type Rarity = 'Common' | 'Rare' | 'Epic'
export type Category = 'Mindset' | 'Health' | 'Entrepreneur' | 'Combat'

export interface Skill {
  id: string
  name: string
  category: Category
  rarity: Rarity
}

export const SKILLS: Skill[] = [
  { id: 'focus',        name: 'Focus',        category: 'Mindset',      rarity: 'Common' },
  { id: 'discipline',   name: 'Discipline',   category: 'Mindset',      rarity: 'Common' },
  { id: 'willpower',    name: 'Willpower',    category: 'Mindset',      rarity: 'Common' },
  { id: 'flexibility',  name: 'Flexibility',  category: 'Health',       rarity: 'Common' },
  { id: 'sleep',        name: 'Sleep',        category: 'Health',       rarity: 'Common' },
  { id: 'strength',     name: 'Strength',     category: 'Health',       rarity: 'Rare'   },
  { id: 'conditioning', name: 'Conditioning', category: 'Health',       rarity: 'Rare'   },
  { id: 'marketing',    name: 'Marketing',    category: 'Entrepreneur', rarity: 'Rare'   },
  { id: 'sales',        name: 'Sales',        category: 'Entrepreneur', rarity: 'Epic'   },
  { id: 'kickboxing',   name: 'Kickboxing',   category: 'Combat',       rarity: 'Epic'   },
]

export const THRESHOLDS: Record<Rarity, number[]> = {
  Common: [10, 25, 60, 150, 400, 1000, 2500, 5000, 10000, 20000, 40000, 60000, 80000, 100000],
  Rare:   [20, 50, 120, 300, 800, 2000, 5000, 10000, 20000, 40000, 80000, 120000, 160000, 200000],
  Epic:   [30, 75, 180, 450, 1200, 3000, 7500, 15000, 30000, 60000, 120000, 180000, 240000, 300000],
}

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

export function getSkill(id: string): Skill | undefined {
  return SKILLS.find(s => s.id === id)
}
