import { useEffect, useState } from 'react'
import { useEgolockStore, selectEgoistScore } from './store/useEgolockStore'
import LevelUpToast from './components/LevelUpToast'
import Avatar from './components/Avatar'
import DossierScreen from './screens/DossierScreen'
import SkillsScreen from './screens/SkillsScreen'
import LoggerScreen from './screens/LoggerScreen'
import FocusScreen from './screens/FocusScreen'
import StoreScreen from './screens/StoreScreen'
import PlanScreen from './screens/PlanScreen'
import ArchiveScreen from './screens/ArchiveScreen'

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = ['Dossier', 'Skills', 'Logger', 'Focus', 'Store', 'Plan', 'Archive'] as const
type Tab = typeof TABS[number]

// ─── Momentum badge ───────────────────────────────────────────────────────────

const MOMENTUM_STYLES: Record<string, string> = {
  relentless:  'text-neon  border-neon',
  consistent:  'text-ink   border-line',
  stagnant:    'text-dim   border-line',
  elimination: 'text-red   border-red',
}

const MOMENTUM_LABEL: Record<string, string> = {
  relentless:  'RELENTLESS  1.05×',
  consistent:  'CONSISTENT  1.00×',
  stagnant:    'STAGNANT    0.90×',
  elimination: 'ELIMINATION 0.50×',
}

// ─── Placeholder for unbuilt tabs ─────────────────────────────────────────────

function Placeholder({ name }: { name: string }) {
  return (
    <div className="border border-line bg-panel p-6 max-w-2xl">
      <p className="text-dim text-sm font-mono">
        <span className="text-neon">// </span>
        {name.toUpperCase()} — under construction
      </p>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Dossier')

  const momentum     = useEgolockStore(s => s.momentum)
  const capital      = useEgolockStore(s => s.capital)
  const eScore       = useEgolockStore(selectEgoistScore)
  const focusSession = useEgolockStore(s => s.focusSession)

  // True while the anti-cheat timer is live — locks in-app navigation
  const sessionLocked = focusSession?.status === 'running'

  // Rollover on mount + 60s interval
  useEffect(() => {
    useEgolockStore.getState().rolloverIfNewDay()
    const id = setInterval(() => {
      useEgolockStore.getState().rolloverIfNewDay()
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  // If there's an active/unresolved focus session on boot, jump to Focus tab
  useEffect(() => {
    if (focusSession !== null) setActiveTab('Focus')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // only on mount — don't re-run on every session change

  const momentumStyle = MOMENTUM_STYLES[momentum] ?? MOMENTUM_STYLES.consistent
  const momentumText  = MOMENTUM_LABEL[momentum]  ?? momentum.toUpperCase()

  function renderTab() {
    switch (activeTab) {
      case 'Dossier': return <DossierScreen />
      case 'Skills':  return <SkillsScreen />
      case 'Logger':  return <LoggerScreen />
      case 'Focus':   return <FocusScreen />
      case 'Store':   return <StoreScreen />
      case 'Plan':    return <PlanScreen />
      case 'Archive': return <ArchiveScreen />
      default:        return <Placeholder name={activeTab} />
    }
  }

  return (
    <div className="min-h-screen bg-bg text-ink font-mono flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-bg border-b border-line flex items-center justify-between px-4 h-14">

        {/* Left — avatar + wordmark */}
        <div className="flex items-center gap-3">
          <Avatar size={28} />
          <div className="flex items-center gap-2">
            <span className="text-neon font-bold tracking-widest text-sm">EGOLOCK</span>
            <span className="w-2 h-2 bg-red animate-pulse inline-block" />
          </div>
        </div>

        {/* Center — Eₑ score + Mc badge */}
        <div className="flex flex-col items-center leading-none gap-1">
          <span className="text-2xl font-bold text-neon tabular-nums">
            {eScore.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
          <span className={`label border px-2 py-0.5 ${momentumStyle}`}>
            {momentumText}
          </span>
        </div>

        {/* Right — capital */}
        <div className="text-right">
          <div className="label text-dim">CAPITAL</div>
          <div className="text-ink font-bold tabular-nums">
            ${capital.toLocaleString('en-US')}
          </div>
        </div>
      </header>

      {/* ── Tab strip ───────────────────────────────────────────────────── */}
      <nav className="flex border-b border-line overflow-x-auto shrink-0">
        {TABS.map(tab => {
          const isActive   = activeTab === tab
          const isDisabled = sessionLocked && !isActive
          return (
            <button
              key={tab}
              disabled={isDisabled}
              onClick={() => { if (!isDisabled) setActiveTab(tab) }}
              className={[
                'label px-4 py-3 whitespace-nowrap border-r border-line transition-colors',
                isActive
                  ? 'text-neon border-b-2 border-b-neon bg-panel'
                  : isDisabled
                  ? 'text-dim opacity-30 cursor-not-allowed'
                  : 'text-dim hover:text-ink hover:bg-panel',
              ].join(' ')}
            >
              {tab.toUpperCase()}
            </button>
          )
        })}
      </nav>

      {/* Session-locked hint — only shown while timer is running */}
      {sessionLocked && (
        <div className="px-4 py-1.5 border-b border-line bg-panel shrink-0">
          <span className="label text-dim text-[10px]">
            // session locked — abandon or complete to navigate
          </span>
        </div>
      )}

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-6">
        {renderTab()}
      </main>

      {/* ── Level-up toast — global, outside tab switch ──────────────────── */}
      <LevelUpToast />

    </div>
  )
}
