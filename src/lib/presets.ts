export interface Preset {
  skillId: string
  label: string
  points: number
}

export const PRESETS: Preset[] = [
  { skillId: 'sales',     label: 'Close Deal',         points: 150 },
  { skillId: 'sales',     label: 'VSL',                points: 20  },
  { skillId: 'sales',     label: 'Cold DM',            points: 1   },
  { skillId: 'strength',  label: 'Legendary Boss',     points: 500 },
  { skillId: 'strength',  label: 'Advanced Move',      points: 100 },
  { skillId: 'willpower', label: 'Extreme Resistance', points: 100 },
  { skillId: 'willpower', label: 'High Resistance',    points: 40  },
]
