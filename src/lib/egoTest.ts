import type { EgoArchetype } from '../store/useEgolockStore'

// ─── Question types ───────────────────────────────────────────────────────────

export type Axis = 'x' | 'y'

export interface AxisChoice {
  label: string
  weight: -1 | 1
}

export interface AxisQuestion {
  id:      string
  axis:    Axis
  prompt:  string
  choices: [AxisChoice, AxisChoice]
}

export interface ArchetypeChoice {
  label:     string
  archetype: EgoArchetype
}

export interface ArchetypeQuestion {
  id:      string
  prompt:  string
  choices: [ArchetypeChoice, ArchetypeChoice]
}

// ─── Axis questions ───────────────────────────────────────────────────────────
// X axis: Wholistic = -1, Individualistic = +1
// Y axis: Freedom   = +1, Restriction     = -1

export const EGO_AXIS_QUESTIONS: AxisQuestion[] = [
  // ── X-axis: x1–x6 ──────────────────────────────────────────────────────────
  {
    id: 'x1', axis: 'x',
    prompt: 'When you imagine your ideal future, you see —',
    choices: [
      { label: 'yourself winning across many arenas — career, body, mind, relationships.', weight: -1 },
      { label: 'yourself dominating one specific arena no one else can touch you in.',      weight:  1 },
    ],
  },
  {
    id: 'x2', axis: 'x',
    prompt: 'Two paths to success: A) world-class generalist, B) world-class specialist —',
    choices: [
      { label: 'generalist. variety is the point.',   weight: -1 },
      { label: 'specialist. obsession is the point.', weight:  1 },
    ],
  },
  {
    id: 'x3', axis: 'x',
    prompt: 'When a rival succeeds in a field you don\'t care about —',
    choices: [
      { label: 'you feel competitive. you want to beat them there too.', weight: -1 },
      { label: 'you feel indifferent. their lane isn\'t your lane.',     weight:  1 },
    ],
  },
  {
    id: 'x4', axis: 'x',
    prompt: 'If you could only be remembered for one thing —',
    choices: [
      { label: 'being formidable across the board — the complete person.', weight: -1 },
      { label: 'being unmatched at one specific craft.',                   weight:  1 },
    ],
  },
  {
    id: 'x5', axis: 'x',
    prompt: 'When you set goals, you tend to —',
    choices: [
      { label: 'set many across different domains and chase them in parallel.', weight: -1 },
      { label: 'set one obsessive goal and let the rest blur.',                weight:  1 },
    ],
  },
  {
    id: 'x6', axis: 'x',
    prompt: 'Your weakness is more often —',
    choices: [
      { label: 'spreading thin and being mediocre everywhere.', weight: -1 },
      { label: 'tunnel vision and neglecting everything else.', weight:  1 },
    ],
  },

  // ── Y-axis: y1–y6 ──────────────────────────────────────────────────────────
  {
    id: 'y1', axis: 'y',
    prompt: 'When you have unlimited options to approach a task —',
    choices: [
      { label: 'you get energized. the openness is fuel.',            weight:  1 },
      { label: 'you freeze. too many doors, can\'t pick one.',        weight: -1 },
    ],
  },
  {
    id: 'y2', axis: 'y',
    prompt: 'Your best work happens when —',
    choices: [
      { label: 'you\'re free to experiment and shift approach mid-flight.', weight:  1 },
      { label: 'the rules are tight and the path is one.',                  weight: -1 },
    ],
  },
  {
    id: 'y3', axis: 'y',
    prompt: 'Strict deadlines and constraints make you —',
    choices: [
      { label: 'feel boxed in and resentful.',           weight:  1 },
      { label: 'lock in and produce your best work.',    weight: -1 },
    ],
  },
  {
    id: 'y4', axis: 'y',
    prompt: 'An unstructured day off feels —',
    choices: [
      { label: 'like freedom. you\'ll figure it out.', weight:  1 },
      { label: 'like quicksand. you need a frame.',    weight: -1 },
    ],
  },
  {
    id: 'y5', axis: 'y',
    prompt: 'When the rules of a system feel unfair —',
    choices: [
      { label: 'you leave the system and find or build a freer one.',                                                           weight:  1 },
      { label: 'you either follow them precisely OR break them in a calculated way to win INSIDE the system.',                  weight: -1 },
    ],
  },
  {
    id: 'y6', axis: 'y',
    prompt: 'Your sharpest output comes when you are —',
    choices: [
      { label: 'self-directed with no oversight.',         weight:  1 },
      { label: 'under pressure with hard constraints.',    weight: -1 },
    ],
  },
]

// ─── Archetype questions ──────────────────────────────────────────────────────
// Orthogonal dimension — NOT plotted on the quadrant axes

export const EGO_ARCHETYPE_QUESTIONS: ArchetypeQuestion[] = [
  {
    id: 'g1',
    prompt: 'When you encounter a new skill, you mostly —',
    choices: [
      { label: 'click with parts of it instinctively before being taught.',     archetype: 'genius' },
      { label: 'watch others do it and mirror the technique fast.',              archetype: 'talented-learner' },
    ],
  },
  {
    id: 'g2',
    prompt: 'Your edge over peers comes from —',
    choices: [
      { label: 'something that just feels natural that others struggle to copy.', archetype: 'genius' },
      { label: 'studying everyone around you and absorbing their moves.',         archetype: 'talented-learner' },
    ],
  },
  {
    id: 'g3',
    prompt: 'When stuck, your first instinct is to —',
    choices: [
      { label: 'trust your gut and ship something only you would make.',     archetype: 'genius' },
      { label: 'find someone who\'s solved this and reverse-engineer it.',   archetype: 'talented-learner' },
    ],
  },
]

// ─── Interleaved question order for the modal ─────────────────────────────────
// x1, y1, x2, y2, x3, y3, x4, y4, x5, y5, x6, y6, g1, g2, g3
export const EGO_QUESTION_ORDER: Array<{ type: 'axis' | 'archetype'; id: string }> = [
  { type: 'axis',      id: 'x1' }, { type: 'axis',      id: 'y1' },
  { type: 'axis',      id: 'x2' }, { type: 'axis',      id: 'y2' },
  { type: 'axis',      id: 'x3' }, { type: 'axis',      id: 'y3' },
  { type: 'axis',      id: 'x4' }, { type: 'axis',      id: 'y4' },
  { type: 'axis',      id: 'x5' }, { type: 'axis',      id: 'y5' },
  { type: 'axis',      id: 'x6' }, { type: 'axis',      id: 'y6' },
  { type: 'archetype', id: 'g1' }, { type: 'archetype', id: 'g2' }, { type: 'archetype', id: 'g3' },
]

// ─── Quadrant keys + info ─────────────────────────────────────────────────────

export type QuadrantKey =
  | 'wholistic-freedom'
  | 'individualistic-freedom'
  | 'wholistic-restrictive'
  | 'individualistic-restrictive'

export function getQuadrantKey(pos: { x: number; y: number }): QuadrantKey {
  const isIndividualistic = pos.x > 0
  const isFreedom         = pos.y >= 0   // 0 treated as Freedom (top)
  if (!isIndividualistic &&  isFreedom) return 'wholistic-freedom'
  if ( isIndividualistic &&  isFreedom) return 'individualistic-freedom'
  if (!isIndividualistic && !isFreedom) return 'wholistic-restrictive'
  return 'individualistic-restrictive'
}

export const EGO_QUADRANT_INFO: Record<QuadrantKey, { name: string; description: string }> = {
  'wholistic-freedom': {
    name: 'WHOLISTIC + FREEDOM',
    description:
      'You want to win at everything — and you need the space to pursue it all at once. ' +
      'Structure kills your momentum; the more doors open, the more alive you feel. ' +
      'Your risk is becoming a generalist with no clear blade. Your gift is adaptability no one else can match.',
  },
  'individualistic-freedom': {
    name: 'INDIVIDUALISTIC + FREEDOM',
    description:
      'One obsession, infinite roads to reach it. ' +
      'You know exactly what you want to dominate, but you refuse to be told how. ' +
      'Constraints make you toxic. Open paths make you unstoppable. ' +
      'The danger is that freedom without discipline becomes drift.',
  },
  'wholistic-restrictive': {
    name: 'WHOLISTIC + RESTRICTIVE',
    description:
      'You want to win across every domain, but you need a rail to run on. ' +
      'Systems, routines, and accountability structures are your best friends — ' +
      'they force you to stop spreading and start executing. ' +
      'Without a frame, your ambition scatters into noise.',
  },
  'individualistic-restrictive': {
    name: 'INDIVIDUALISTIC + RESTRICTIVE',
    description:
      'One lane. Maximum pressure. That is the formula. ' +
      'You are most dangerous when the constraints are tight and the target is singular. ' +
      'Choice overwhelms you; focus detonates you. ' +
      'The tighter the box, the more you figure out how to explode out of it.',
  },
}

// ─── Axis info (for (i) tooltips) ────────────────────────────────────────────

export const EGO_AXIS_INFO: Record<'wholistic' | 'individualistic' | 'freedom' | 'restriction', string> = {
  wholistic:
    'Wholistic drive: you want to win at everything in life, no matter the field. ' +
    'Career, body, mind, relationships — all of it matters, all at once. ' +
    'This is a generalist orientation: the more arenas you can compete in, the more complete you feel.',

  individualistic:
    'Individualistic drive: you want to win in your own specific way at the one thing you desire most. ' +
    'Other fields feel irrelevant. Only your lane matters. ' +
    'This is a specialist orientation: the deeper you go, the more dangerous you become.',

  freedom:
    'Freedom axis: you thrive when given many paths to choose from. ' +
    'Open-ended environments fuel you — you experiment, pivot, and invent your own process. ' +
    'Rigid systems stifle your output. You stagnate under rules that weren\'t built by you.',

  restriction:
    'Restriction axis: you thrive when forced down one path. ' +
    'Freedom of choice causes paralysis; the fewer the options, the cleaner the execution. ' +
    'Two flavors exist here — the Compliant, who abides strictly by the rules and finds power in precision; ' +
    'and the Rebel, who gets crushed by the rules and then crushes back, needing the pressure to invent a way out.',
}

// ─── Archetype info ───────────────────────────────────────────────────────────

export const EGO_ARCHETYPE_INFO: Record<EgoArchetype, { name: string; description: string }> = {
  'genius': {
    name: 'GENIUS',
    description:
      'Your edge is innate — a natural talent that cannot be fully copied or learned by others. ' +
      'You tend toward the individualistic: your gift is singular and it pulls you toward a specific domain. ' +
      'The trap is complacency. The weapon is that no one can replicate exactly what you produce.',
  },
  'talented-learner': {
    name: 'TALENTED LEARNER',
    description:
      'Your edge is adaptive — you observe, absorb, and replicate at an inhuman rate. ' +
      'You tend toward the wholistic: every expert around you is a resource to be extracted from. ' +
      'The trap is that you become a mirror with no origin. The weapon is that you can steal from everyone.',
  },
}

// ─── Score computation ────────────────────────────────────────────────────────

export interface EgoTestResult {
  x:         number        // [-1, 1]
  y:         number        // [-1, 1]
  archetype: EgoArchetype
}

export function scoreEgoTest(
  axisAnswers:      Record<string, number>,      // qId → weight (-1 or 1)
  archetypeAnswers: Record<string, EgoArchetype>,
): EgoTestResult {
  // X score — 6 questions, each ±1, normalised to [-1, 1]
  const xQ = EGO_AXIS_QUESTIONS.filter(q => q.axis === 'x')
  const rawX = xQ.reduce((sum, q) => sum + (axisAnswers[q.id] ?? 0), 0)
  const x = xQ.length > 0 ? rawX / xQ.length : 0

  // Y score — 6 questions, each ±1, normalised to [-1, 1]
  const yQ = EGO_AXIS_QUESTIONS.filter(q => q.axis === 'y')
  const rawY = yQ.reduce((sum, q) => sum + (axisAnswers[q.id] ?? 0), 0)
  const y = yQ.length > 0 ? rawY / yQ.length : 0

  // Archetype — majority vote over g1..g3 (3 questions, no tie possible)
  const votes = EGO_ARCHETYPE_QUESTIONS.reduce<Record<EgoArchetype, number>>(
    (acc, q) => {
      const a = archetypeAnswers[q.id]
      if (a) acc[a] = (acc[a] ?? 0) + 1
      return acc
    },
    { genius: 0, 'talented-learner': 0 },
  )
  const archetype: EgoArchetype = votes.genius >= votes['talented-learner'] ? 'genius' : 'talented-learner'

  return { x, y, archetype }
}
