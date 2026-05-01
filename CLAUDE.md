# EGOLOCK — Project Context

## What this is
A self-improvement web app inspired by Blue Lock's "Egoism Philosophy." Tracks 10 skills, levels them exponentially, rewards hyper-specialization, punishes stagnation via a daily Momentum coefficient, and enforces honesty via anti-cheat (focus timer fails on tab switch).

## Tech stack (do not change without asking)
- Vite + React 18 + TypeScript
- Tailwind CSS v3
- Zustand for state, with `persist` middleware writing to localStorage under key `egolock-v1`
- Recharts for the Aura radar chart
- shadcn/ui primitives only if needed, copied in manually (not as a dep)

## Visual identity
- OLED dark mode: pure black `#000000` background
- Neon blue `#00E5FF` for progress / positive
- Sharp red `#FF2E4D` for penalties / warnings / failure
- Off-white `#E8E8E8` body text, dim `#7A7A7A` secondary
- JetBrains Mono everywhere (technical-dossier aesthetic)
- Sharp 90deg corners, 1px borders, no soft shadows. Brutalist, fast, aggressive.

## Skill data (hardcoded constants, never fetched)
Skills (id, name, category, rarity):
- focus, Focus, Mindset, Common
- discipline, Discipline, Mindset, Common
- willpower, Willpower, Mindset, Common
- flexibility, Flexibility, Health, Common
- sleep, Sleep, Health, Common
- strength, Strength, Health, Rare
- conditioning, Conditioning, Health, Rare
- marketing, Marketing, Entrepreneur, Rare
- sales, Sales, Entrepreneur, Epic
- kickboxing, Kickboxing, Combat, Epic

Level thresholds (cumulative pts to reach level N, levels 1–15):
- Common: [10, 25, 60, 150, 400, 1000, 2500, 5000, 10000, 20000, 40000, 60000, 80000, 100000]
- Rare:   [20, 50, 120, 300, 800, 2000, 5000, 10000, 20000, 40000, 80000, 120000, 160000, 200000]
- Epic:   [30, 75, 180, 450, 1200, 3000, 7500, 15000, 30000, 60000, 120000, 180000, 240000, 300000]

Rarity multipliers (for Egoist Score Eₑ): Common=1.0, Rare=1.5, Epic=2.5
Capital per level-up: Common=$5, Rare=$10, Epic=$20

## Egoist Score formula
Eₑ = (Σ skillPoints × rarityMultiplier) × Mc

Mc (Momentum), recomputed on app open and on midnight rollover:
- Relentless 1.05x — 3+ unique skills logged today
- Consistent 1.00x — 1–2 skills logged today
- Stagnant 0.90x — 0 skills logged in the last 24h
- Elimination 0.50x — 0 skills logged for 3+ consecutive days

## Action Logger presets
- Sales: Close Deal +150, VSL +20, Cold DM +1
- Strength: Legendary Boss +500, Advanced Move +100
- Mindset (resistance): Extreme Resistance +100, High Resistance +40

## Anti-cheat (Focus Timer)
User picks duration and a skill. On document `visibilitychange` if hidden → timer fails, resets to 0, opens Evolution Log prompt: "What was the missing piece to your evolution?". On success → +1 pt/min to chosen skill.

## Failure Tax
Planned goal marked Failed or deleted next day → -$10 capital.

## Build philosophy
Speed over polish. Ship the loop end-to-end before refining any single screen. Every state change persists to localStorage. Pure client, no backend, no auth, no network calls.
