import { useEffect, useRef, useState } from 'react'
import { useEgolockStore } from '../store/useEgolockStore'
import Button from './ui/Button'

interface SportNameDialogProps {
  open:    boolean
  onClose: () => void
}

export default function SportNameDialog({ open, onClose }: SportNameDialogProps) {
  const sportSkillName      = useEgolockStore(s => s.sportSkillName)
  const setSportSkillName   = useEgolockStore(s => s.setSportSkillName)
  const markSportNamePrompted = useEgolockStore(s => s.markSportNamePrompted)

  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync input to current stored name whenever dialog opens
  useEffect(() => {
    if (open) {
      setInputVal(sportSkillName === 'Combat Sport' ? '' : sportSkillName)
      setTimeout(() => inputRef.current?.focus(), 50)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [open, sportSkillName])

  if (!open) return null

  const trimmed = inputVal.trim()

  const handleLockIn = () => {
    if (!trimmed) return
    setSportSkillName(trimmed)
    markSportNamePrompted()
    onClose()
  }

  const handleSkip = () => {
    markSportNamePrompted()
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && trimmed) handleLockIn()
    if (e.key === 'Escape') handleSkip()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div
        className="bg-panel border border-line border-l-2 w-full max-w-md mx-4"
        style={{ borderLeftColor: '#FF2E4D' }}
      >
        {/* Header */}
        <div className="border-b border-line px-5 py-4">
          <span className="label text-red text-xs tracking-widest">// NAME YOUR SPORT</span>
        </div>

        {/* Body */}
        <div className="px-5 py-5 flex flex-col gap-4">
          <p className="text-dim text-xs font-mono leading-relaxed">
            One sport. The one you'd compete in. Boxing, BJJ, tennis, basketball,
            dance, esports — your call. You can change this later in the Dossier.
          </p>

          <input
            ref={inputRef}
            type="text"
            maxLength={24}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Combat Sport"
            className="w-full bg-bg border border-line text-ink font-mono text-sm px-3 py-2.5 focus:border-neon outline-none placeholder:text-dim transition-colors"
          />

          <div className="flex gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleLockIn}
              disabled={!trimmed}
              className="flex-1 justify-center"
            >
              LOCK IN
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={handleSkip}
            >
              SKIP
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
