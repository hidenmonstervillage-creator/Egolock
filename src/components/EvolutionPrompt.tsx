import { useEffect, useRef, useState } from 'react'
import { useEgolockStore } from '../store/useEgolockStore'
import type { EvolutionEntry } from '../store/useEgolockStore'
import Button from './ui/Button'

interface EvolutionPromptProps {
  open: boolean
  trigger: EvolutionEntry['trigger']
  onClose: () => void
}

const TRIGGER_LABEL: Record<EvolutionEntry['trigger'], string> = {
  'focus-fail':          'FOCUS FAILURE',
  'extreme-resistance':  'EXTREME RESISTANCE',
  'manual':              'MANUAL ENTRY',
}

export default function EvolutionPrompt({ open, trigger, onClose }: EvolutionPromptProps) {
  const [answer, setAnswer] = useState('')
  const addEvolutionEntry = useEgolockStore(s => s.addEvolutionEntry)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Body scroll lock + auto-focus
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      const t = setTimeout(() => textareaRef.current?.focus(), 50)
      return () => clearTimeout(t)
    } else {
      document.body.style.overflow = ''
      setAnswer('')
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Esc to close
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleArchive = () => {
    if (!answer.trim()) return
    addEvolutionEntry(trigger, answer.trim())
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-panel border border-line border-l-2 border-l-red p-6 w-full max-w-lg mx-4 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="label text-red">// EVOLUTION LOG</span>
          <span className="label text-dim">{TRIGGER_LABEL[trigger]}</span>
        </div>

        {/* Question */}
        <p className="text-ink text-sm leading-relaxed">
          What was the missing piece to your evolution?
        </p>

        {/* Answer */}
        <textarea
          ref={textareaRef}
          rows={4}
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="// write your answer..."
          className="w-full bg-bg border border-line focus:border-neon outline-none p-3 font-mono text-sm text-ink resize-none placeholder:text-dim transition-colors"
        />

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            DISMISS
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleArchive}
            disabled={!answer.trim()}
          >
            ARCHIVE
          </Button>
        </div>
      </div>
    </div>
  )
}
