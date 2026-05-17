export interface Preset {
  skillId: string
  label:   string
  points:  number
}

export const PRESETS: Preset[] = [
  // ── FOCUS ──────────────────────────────────────────────────────────────────
  { skillId: 'focus',       label: 'Deep Work Block',          points: 30  },

  // ── DISCIPLINE ─────────────────────────────────────────────────────────────
  { skillId: 'discipline',  label: 'Cold Shower',              points: 10  },
  { skillId: 'discipline',  label: 'Skipped a Craving',        points: 15  },
  { skillId: 'discipline',  label: 'Followed Plan All Day',    points: 30  },

  // ── WILLPOWER ──────────────────────────────────────────────────────────────
  { skillId: 'willpower',   label: 'Extreme Resistance',       points: 100 },
  { skillId: 'willpower',   label: 'High Resistance',          points: 40  },

  // ── STRENGTH ───────────────────────────────────────────────────────────────
  { skillId: 'strength',    label: 'Legendary Boss',           points: 500 },
  { skillId: 'strength',    label: 'Advanced Move',            points: 100 },
  { skillId: 'strength',    label: 'Hit PR',                   points: 200 },
  { skillId: 'strength',    label: 'Full Workout Completed',   points: 50  },
  { skillId: 'strength',    label: 'Hard Set to Failure',      points: 10  },

  // ── FLEXIBILITY ────────────────────────────────────────────────────────────
  { skillId: 'flexibility', label: '5 Min Stretch',            points: 5   },
  { skillId: 'flexibility', label: '15 Min Mobility',          points: 15  },
  { skillId: 'flexibility', label: '30 Min Full Session',      points: 40  },

  // ── STAMINA ────────────────────────────────────────────────────────────────
  { skillId: 'stamina',     label: 'Cardio 20 Min',            points: 20  },
  { skillId: 'stamina',     label: 'Cardio 45+ Min',           points: 50  },
  { skillId: 'stamina',     label: 'HIIT Session',             points: 30  },
  { skillId: 'stamina',     label: 'Hit Max HR',               points: 15  },

  // ── SPORT (ID stays 'sport'; display name is user-set) ─────────────────────
  { skillId: 'sport',       label: 'Training Session',         points: 30  },
  { skillId: 'sport',       label: 'Sparring / Scrimmage',     points: 50  },
  { skillId: 'sport',       label: 'Competed',                 points: 150 },
  { skillId: 'sport',       label: 'Won Competition',          points: 500 },
  { skillId: 'sport',       label: 'Footage Review',           points: 15  },

  // ── SLEEP ──────────────────────────────────────────────────────────────────
  { skillId: 'sleep',       label: 'Slept 7.5h+',             points: 20  },
  { skillId: 'sleep',       label: 'Perfect Sleep Night',      points: 50  },

  // ── NUTRITION ──────────────────────────────────────────────────────────────
  { skillId: 'nutrition',   label: 'Clean Meal',               points: 5   },
  { skillId: 'nutrition',   label: 'Clean Day',                points: 30  },
  { skillId: 'nutrition',   label: 'Hit Protein Target',       points: 15  },
  { skillId: 'nutrition',   label: 'Prepped Meals for Week',   points: 40  },

  // ── SALES ──────────────────────────────────────────────────────────────────
  { skillId: 'sales',       label: 'Close Deal',               points: 150 },
  { skillId: 'sales',       label: 'VSL',                      points: 20  },
  { skillId: 'sales',       label: 'Cold DM',                  points: 1   },

  // ── MARKETING ──────────────────────────────────────────────────────────────
  { skillId: 'marketing',   label: 'Published a Post',         points: 10  },
  { skillId: 'marketing',   label: 'Published Long-form',      points: 30  },
  { skillId: 'marketing',   label: 'Outreach Batch (10+)',     points: 15  },
  { skillId: 'marketing',   label: 'Launched a Campaign',      points: 100 },
]
