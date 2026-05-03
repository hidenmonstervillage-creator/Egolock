import { useEffect, useState } from 'react'
import {
  EGO_AXIS_QUESTIONS,
  EGO_ARCHETYPE_QUESTIONS,
  EGO_QUESTION_ORDER,
  EGO_QUADRANT_INFO,
  EGO_ARCHETYPE_INFO,
  scoreEgoTest,
  getQuadrantKey,
} from '../lib/egoTest'
import type { EgoTestResult } from '../lib/egoTest'
import type { EgoArchetype } from '../store/useEgolockStore'
import { useEgolockStore } from '../store/useEgolockStore'
import EgoQuadrantGraphic from './EgoQuadrantGraphic'

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'questions' | 'reading' | 'reveal'

// ─── Reading animation CSS ────────────────────────────────────────────────────

const SCAN_CSS = `
@keyframes scanLine {
  0%   { transform: translateX(-100%); }
  50%  { transform: translateX(100%);  }
  100% { transform: translateX(-100%); }
}
.ego-scan-line {
  animation: scanLine 1.2s ease-in-out infinite;
}
`

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open:    boolean
  onClose: () => void
}

// ─── Question screen ──────────────────────────────────────────────────────────

function QuestionScreen({
  step,
  total,
  onAxisAnswer,
  onArchetypeAnswer,
  onCancel,
}: {
  step:               number
  total:              number
  onAxisAnswer:       (id: string, weight: -1 | 1) => void
  onArchetypeAnswer:  (id: string, archetype: EgoArchetype) => void
  onCancel:           () => void
}) {
  const [flash, setFlash] = useState<0 | 1 | null>(null)

  const orderItem = EGO_QUESTION_ORDER[step]
  const isAxis    = orderItem.type === 'axis'
  const axisQ     = isAxis ? EGO_AXIS_QUESTIONS.find(q => q.id === orderItem.id)! : null
  const archQ     = !isAxis ? EGO_ARCHETYPE_QUESTIONS.find(q => q.id === orderItem.id)! : null

  const prompt  = isAxis ? axisQ!.prompt : archQ!.prompt
  const choices = isAxis
    ? axisQ!.choices.map(c => c.label)
    : archQ!.choices.map(c => c.label)

  const handleChoose = (idx: 0 | 1) => {
    setFlash(idx)
    setTimeout(() => {
      setFlash(null)
      if (isAxis) {
        onAxisAnswer(orderItem.id, axisQ!.choices[idx].weight)
      } else {
        onArchetypeAnswer(orderItem.id, archQ!.choices[idx].archetype)
      }
    }, 200)
  }

  const progress = (step / total) * 100

  return (
    <div className="flex flex-col gap-8 max-w-xl w-full mx-auto">

      {/* Counter + progress */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="label text-dim text-[10px] tracking-[0.2em]">
            {isAxis ? 'EGO PLACEMENT' : 'ARCHETYPE'}
          </span>
          <span className="label text-dim text-[10px] tabular-nums">
            {String(step + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
        </div>
        <div className="h-px bg-line w-full relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-neon transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Prompt */}
      <p className="text-ink text-xl font-bold font-mono leading-snug tracking-wide">
        {prompt}
      </p>

      {/* Choices */}
      <div className="flex flex-col gap-3">
        {([0, 1] as const).map(idx => (
          <button
            key={idx}
            onClick={() => handleChoose(idx)}
            disabled={flash !== null}
            className={[
              'bg-panel border p-4 text-left font-mono transition-all duration-200',
              flash === idx
                ? 'border-neon bg-neon/10'
                : 'border-line hover:border-neon hover:bg-neon/5',
            ].join(' ')}
          >
            <span className="label text-dim text-[10px] mr-2">
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="text-ink text-xs leading-snug">
              {choices[idx]}
            </span>
          </button>
        ))}
      </div>

      {/* Footer note */}
      <div className="flex items-center justify-between">
        <span className="label text-dim text-[10px]">
          // no going back. answer honest.
        </span>
        <button
          onClick={onCancel}
          className="label text-dim text-[10px] hover:text-red transition-colors"
        >
          CANCEL
        </button>
      </div>

    </div>
  )
}

// ─── Reading phase ────────────────────────────────────────────────────────────

function ReadingScreen() {
  return (
    <>
      <style>{SCAN_CSS}</style>
      <div className="flex flex-col items-center gap-8 max-w-sm w-full mx-auto">
        <span className="label text-dim text-[10px] tracking-[0.3em]">// READING YOUR EGO...</span>
        <div className="w-full h-px bg-line relative overflow-hidden">
          <div className="ego-scan-line absolute inset-y-0 w-1/2 bg-neon" />
        </div>
      </div>
    </>
  )
}

// ─── Reveal screen ────────────────────────────────────────────────────────────

function RevealScreen({
  result,
  onEngrave,
  onRetake,
}: {
  result:    EgoTestResult
  onEngrave: () => void
  onRetake:  () => void
}) {
  const quadKey     = getQuadrantKey(result)
  const quadInfo    = EGO_QUADRANT_INFO[quadKey]
  const archetypeInfo = EGO_ARCHETYPE_INFO[result.archetype]

  return (
    <div className="flex flex-col gap-6 max-w-lg w-full mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="label text-dim text-[10px] tracking-[0.25em]">// PROFILED</span>
        <span className="text-neon text-4xl font-bold font-mono tracking-widest leading-tight mt-1">
          {quadInfo.name}
        </span>
      </div>

      {/* Quadrant graphic — pulse dot, not interactive */}
      <EgoQuadrantGraphic
        position={result}
        interactive={false}
        pulseDot
      />

      {/* Quadrant description */}
      <p className="text-ink text-xs leading-relaxed font-mono">
        {quadInfo.description}
      </p>

      {/* Archetype card */}
      <div className="bg-panel border border-line border-l-2 border-l-red p-4 flex flex-col gap-1">
        <span className="label text-dim text-[10px]">ARCHETYPE</span>
        <span className="text-red font-bold font-mono tracking-widest text-base mt-0.5">
          {archetypeInfo.name}
        </span>
        <p className="text-ink text-xs leading-relaxed mt-1">
          {archetypeInfo.description}
        </p>
      </div>

      {/* CTA row */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onEngrave}
          className="w-full py-4 font-mono text-sm uppercase tracking-widest font-bold bg-neon text-black hover:brightness-110 transition-all"
        >
          ENGRAVE
        </button>
        <button
          onClick={onRetake}
          className="label text-dim text-[10px] hover:text-neon transition-colors text-center"
        >
          RETAKE TEST
        </button>
      </div>

    </div>
  )
}

// ─── Root modal ───────────────────────────────────────────────────────────────

export default function EgoTestModal({ open, onClose }: Props) {
  const completeEgoTest = useEgolockStore(s => s.completeEgoTest)

  const [phase,            setPhase]            = useState<Phase>('questions')
  const [step,             setStep]             = useState(0)
  const [axisAnswers,      setAxisAnswers]      = useState<Record<string, number>>({})
  const [archetypeAnswers, setArchetypeAnswers] = useState<Record<string, EgoArchetype>>({})
  const [result,           setResult]           = useState<EgoTestResult | null>(null)

  const TOTAL = EGO_QUESTION_ORDER.length   // 15

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Reading phase timer
  useEffect(() => {
    if (phase !== 'reading') return
    const id = setTimeout(() => setPhase('reveal'), 1500)
    return () => clearTimeout(id)
  }, [phase])

  if (!open) return null

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAxisAnswer = (id: string, weight: -1 | 1) => {
    const next = { ...axisAnswers, [id]: weight }
    setAxisAnswers(next)
    advance(next, archetypeAnswers)
  }

  const handleArchetypeAnswer = (id: string, archetype: EgoArchetype) => {
    const next = { ...archetypeAnswers, [id]: archetype }
    setArchetypeAnswers(next)
    advance(axisAnswers, next)
  }

  const advance = (
    ax: Record<string, number>,
    ar: Record<string, EgoArchetype>,
  ) => {
    const nextStep = step + 1
    if (nextStep < TOTAL) {
      setStep(nextStep)
    } else {
      // All answered — compute and enter reading phase
      setResult(scoreEgoTest(ax, ar))
      setPhase('reading')
    }
  }

  const handleEngrave = () => {
    if (!result) return
    completeEgoTest({ x: result.x, y: result.y, archetype: result.archetype })
    resetLocal()
    onClose()
  }

  const handleRetake = () => {
    resetLocal()
  }

  const handleCancel = () => {
    resetLocal()
    onClose()
  }

  const resetLocal = () => {
    setPhase('questions')
    setStep(0)
    setAxisAnswers({})
    setArchetypeAnswers({})
    setResult(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 overflow-y-auto">
      {phase === 'questions' && (
        <QuestionScreen
          step={step}
          total={TOTAL}
          onAxisAnswer={handleAxisAnswer}
          onArchetypeAnswer={handleArchetypeAnswer}
          onCancel={handleCancel}
        />
      )}
      {phase === 'reading' && <ReadingScreen />}
      {phase === 'reveal' && result && (
        <RevealScreen
          result={result}
          onEngrave={handleEngrave}
          onRetake={handleRetake}
        />
      )}
    </div>
  )
}
