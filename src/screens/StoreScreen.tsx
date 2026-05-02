import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useEgolockStore } from '../store/useEgolockStore'
import Panel from '../components/ui/Panel'
import Button from '../components/ui/Button'

export default function StoreScreen() {
  const capital          = useEgolockStore(s => s.capital)
  const customRewards    = useEgolockStore(s => s.customRewards)
  const ownedRewards     = useEgolockStore(s => s.ownedRewards)
  const addCustomReward  = useEgolockStore(s => s.addCustomReward)
  const removeCustomReward = useEgolockStore(s => s.removeCustomReward)
  const purchaseReward   = useEgolockStore(s => s.purchaseReward)

  // Forge form
  const [forgeName, setForgeName] = useState('')
  const [forgeCost, setForgeCost] = useState('')
  const [flashId,   setFlashId]   = useState<string | null>(null)

  const handleForge = () => {
    const cost = parseInt(forgeCost, 10)
    if (!forgeName.trim() || !cost || cost < 1) return
    addCustomReward(forgeName.trim(), cost)
    setForgeName('')
    setForgeCost('')
  }

  const handlePurchase = (id: string) => {
    const ok = purchaseReward(id)
    if (ok) {
      setFlashId(id)
      setTimeout(() => setFlashId(null), 400)
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone and awards no refund.`)) return
    removeCustomReward(id)
  }

  // Resolve reward name from customRewards for history rows
  const rewardName = (rewardId: string): { name: string; cost: number } | null => {
    return customRewards.find(r => r.id === rewardId) ?? null
  }

  const sortedOwned = [...ownedRewards].sort((a, b) => b.ts - a.ts)

  return (
    <div className="flex flex-col gap-4 max-w-2xl">

      {/* ── A: Capital header ─────────────────────────────────────────────── */}
      <div className="flex flex-col items-start gap-0.5">
        <span className="label text-dim">EGOIST CAPITAL</span>
        <span className="text-5xl font-bold text-neon tabular-nums leading-none">
          ${capital.toLocaleString('en-US')}
        </span>
      </div>

      {/* ── B: Forge a reward ─────────────────────────────────────────────── */}
      <Panel title="// FORGE A REWARD">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={forgeName}
              onChange={e => setForgeName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleForge()}
              placeholder="Reward name"
              className="flex-1 bg-bg border border-line text-ink font-mono text-xs px-3 py-2 focus:border-neon outline-none placeholder:text-dim"
            />
            <input
              type="number"
              min={1}
              value={forgeCost}
              onChange={e => setForgeCost(e.target.value)}
              placeholder="Cost $"
              className="w-24 shrink-0 bg-bg border border-line text-ink font-mono text-xs px-3 py-2 focus:border-neon outline-none placeholder:text-dim"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleForge}
            disabled={!forgeName.trim() || !forgeCost || parseInt(forgeCost, 10) < 1}
            className="self-start"
          >
            FORGE
          </Button>
          <p className="label text-dim text-[10px] leading-relaxed">
            Your rewards. Your rules. Don't be soft. Don't be reckless.
          </p>
        </div>
      </Panel>

      {/* ── C: Available rewards ──────────────────────────────────────────── */}
      <Panel title="AVAILABLE REWARDS">
        {customRewards.length === 0 ? (
          <p className="text-dim text-xs">// no rewards forged yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customRewards.map(reward => {
              const affordable = capital >= reward.cost
              const flashing   = flashId === reward.id
              return (
                <div
                  key={reward.id}
                  className={[
                    'border p-3 flex flex-col gap-2 relative transition-all duration-300',
                    flashing ? 'border-neon bg-neon/5' : 'border-line bg-bg',
                  ].join(' ')}
                >
                  {/* Trash icon */}
                  <button
                    onClick={() => handleDelete(reward.id, reward.name)}
                    className="absolute top-2 right-2 text-dim hover:text-red transition-colors"
                    title="Delete reward"
                  >
                    <Trash2 size={13} />
                  </button>

                  <span className="text-ink font-bold text-xs uppercase tracking-wider pr-5">
                    {reward.name}
                  </span>

                  <span className={`text-lg font-bold tabular-nums ${affordable ? 'text-neon' : 'text-red'}`}>
                    ${reward.cost.toLocaleString()}
                  </span>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handlePurchase(reward.id)}
                    disabled={!affordable}
                    className={!affordable ? 'opacity-40 border border-red bg-transparent text-red' : ''}
                  >
                    PURCHASE
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </Panel>

      {/* ── D: Purchase history ───────────────────────────────────────────── */}
      <Panel title="PURCHASE HISTORY">
        {sortedOwned.length === 0 ? (
          <p className="text-dim text-xs">// no purchases yet. earn it first.</p>
        ) : (
          <div className="flex flex-col">
            {sortedOwned.map(owned => {
              const resolved = rewardName(owned.rewardId)
              const d        = new Date(owned.ts)
              const stamp    = `${d.toLocaleDateString('en-CA')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
              return (
                <div
                  key={`${owned.rewardId}-${owned.ts}`}
                  className="flex items-center gap-3 py-1.5 border-b border-line last:border-0 text-xs"
                >
                  <span className="text-dim tabular-nums shrink-0">{stamp}</span>
                  <span className={`flex-1 ${resolved ? 'text-ink' : 'text-red opacity-50'}`}>
                    {resolved ? resolved.name : '{deleted reward}'}
                  </span>
                  {resolved && (
                    <span className="text-neon tabular-nums shrink-0">
                      ${resolved.cost.toLocaleString()}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Panel>

    </div>
  )
}
