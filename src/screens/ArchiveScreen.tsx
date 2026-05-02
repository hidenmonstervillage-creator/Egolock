import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useEgolockStore } from '../store/useEgolockStore'
import type { EvolutionEntry } from '../store/useEgolockStore'
import Button from '../components/ui/Button'
import EvolutionPrompt from '../components/EvolutionPrompt'

// ─── Types ────────────────────────────────────────────────────────────────────

type ArchiveFilter = 'all' | 'focus-fail' | 'extreme-resistance' | 'manual'

const FILTERS: ArchiveFilter[] = ['all', 'focus-fail', 'extreme-resistance', 'manual']

const FILTER_LABEL: Record<ArchiveFilter, string> = {
  'all':               'ALL',
  'focus-fail':        'FOCUS FAIL',
  'extreme-resistance':'RESISTANCE',
  'manual':            'MANUAL',
}

const TRIGGER_COLOR: Record<EvolutionEntry['trigger'], string> = {
  'focus-fail':          'text-red   border-red',
  'extreme-resistance':  'text-neon  border-neon',
  'manual':              'text-dim   border-line',
}

const TRIGGER_LABEL: Record<EvolutionEntry['trigger'], string> = {
  'focus-fail':          'FOCUS FAIL',
  'extreme-resistance':  'RESISTANCE',
  'manual':              'MANUAL',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatStamp(ts: number): string {
  const d = new Date(ts)
  const date = d.toLocaleDateString('en-CA')
  const hh   = String(d.getHours()).padStart(2, '0')
  const mm   = String(d.getMinutes()).padStart(2, '0')
  return `${date} ${hh}:${mm}`
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ArchiveScreen() {
  const evolutionArchive    = useEgolockStore(s => s.evolutionArchive)
  const removeEvolutionEntry = useEgolockStore(s => s.removeEvolutionEntry)

  const [filter,   setFilter]   = useState<ArchiveFilter>('all')
  const [evoOpen,  setEvoOpen]  = useState(false)

  const filtered = evolutionArchive.filter(e =>
    filter === 'all' || e.trigger === filter,
  )

  const handleDelete = (id: string) => {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    removeEvolutionEntry(id)
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">

      {/* ── A: Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink tracking-wider uppercase">
          // EVOLUTION LOG
        </h1>
        <p className="text-dim text-xs">
          Patterns repeat. Read them. Then break them.
        </p>
      </div>

      {/* ── B: Manual entry ───────────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="md"
        onClick={() => setEvoOpen(true)}
        className="w-full justify-center"
      >
        + NEW ENTRY
      </Button>

      {/* ── C: Filter strip ───────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'label border px-3 py-1.5 text-[11px] transition-colors',
              filter === f
                ? 'border-neon text-neon'
                : 'border-line text-dim hover:border-neon hover:text-neon',
            ].join(' ')}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      {/* ── D: Entries ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <p className="text-dim text-xs font-mono">
          {evolutionArchive.length === 0
            ? '// no archive yet. evolution starts with one honest answer.'
            : '// no entries match this filter.'}
        </p>
      ) : (
        <div className="flex flex-col">
          {filtered.map(entry => (
            <div
              key={entry.id}
              className="border-t border-line py-4 flex flex-col gap-2 first:border-t-0"
            >
              {/* Meta row */}
              <div className="flex items-center gap-3">
                <span className="label text-dim text-[10px] tabular-nums">
                  {formatStamp(entry.ts)}
                </span>
                <span className={`label border px-1.5 py-0.5 text-[10px] ${TRIGGER_COLOR[entry.trigger]}`}>
                  {TRIGGER_LABEL[entry.trigger]}
                </span>
                {/* Push trash to right */}
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="ml-auto text-dim hover:text-red transition-colors"
                  title="Delete entry"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Answer body */}
              <p className="text-ink text-xs leading-relaxed whitespace-pre-wrap">
                {entry.answer}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Evolution prompt — manual trigger */}
      <EvolutionPrompt
        open={evoOpen}
        trigger="manual"
        onClose={() => setEvoOpen(false)}
      />

    </div>
  )
}
