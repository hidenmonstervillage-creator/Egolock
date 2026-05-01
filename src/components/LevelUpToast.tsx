import { useCallback, useEffect, useState } from 'react'
import { useEgolockStore } from '../store/useEgolockStore'
import { getSkill } from '../lib/skills'

interface DisplayData {
  skillId: string
  newLevel: number
  capitalAwarded: number
}

export default function LevelUpToast() {
  const lastLevelUp    = useEgolockStore(s => s.lastLevelUp)
  const clearLastLevelUp = useEgolockStore(s => s.clearLastLevelUp)

  const [visible,   setVisible]   = useState(false)
  const [displayed, setDisplayed] = useState<DisplayData | null>(null)

  const dismiss = useCallback(() => {
    setVisible(false)
    // Wait for the CSS transition to finish before clearing store + unmounting
    setTimeout(() => {
      clearLastLevelUp()
      setDisplayed(null)
    }, 300)
  }, [clearLastLevelUp])

  useEffect(() => {
    if (!lastLevelUp) return
    setDisplayed(lastLevelUp)
    setVisible(true)
    const t = setTimeout(() => dismiss(), 3500)
    return () => clearTimeout(t)
  }, [lastLevelUp, dismiss])

  if (!displayed) return null

  const skill = getSkill(displayed.skillId)

  return (
    <div
      className={[
        'fixed bottom-6 right-6 z-50 cursor-pointer select-none',
        'transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      ].join(' ')}
      onClick={dismiss}
      title="Click to dismiss"
    >
      <div className="bg-panel border border-line border-l-[3px] border-l-neon p-4 min-w-[220px] shadow-none">
        <div className="label text-neon mb-2">// LEVEL UP</div>
        <div className="text-ink font-bold text-sm uppercase tracking-wider">
          {skill?.name ?? displayed.skillId} → Lv {displayed.newLevel}
        </div>
        {displayed.capitalAwarded > 0 && (
          <div className="label text-neon mt-1">
            +${displayed.capitalAwarded} CAPITAL
          </div>
        )}
      </div>
    </div>
  )
}
