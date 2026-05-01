import { useMemo } from 'react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useEgolockStore } from '../store/useEgolockStore'
import { SKILLS } from '../lib/skills'
import { computeLevel } from '../lib/leveling'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RadarDatum {
  name: string
  skillId: string
  level: number
  max: number
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: RadarDatum }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-panel border border-line px-3 py-2 text-xs font-mono">
      <span className="text-dim uppercase tracking-wider">{d.name}</span>
      <span className="text-neon ml-3">Lv {d.level}</span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SkillRadar() {
  const skillPoints = useEgolockStore(s => s.skillPoints)

  const data = useMemo<RadarDatum[]>(
    () =>
      SKILLS.map(skill => ({
        name: skill.name,
        skillId: skill.id,
        level: computeLevel(skill.rarity, skillPoints[skill.id] ?? 0),
        max: 15,
      })),
    [skillPoints],
  )

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#1F1F1F" />
        <PolarAngleAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: '#7A7A7A', fontFamily: 'JetBrains Mono' }}
        />
        <PolarRadiusAxis domain={[0, 15]} tick={false} axisLine={false} />

        {/* Background ceiling — always at max 15, no interactivity */}
        <Radar
          dataKey="max"
          stroke="#1F1F1F"
          fill="#0A0A0A"
          fillOpacity={1}
          isAnimationActive={false}
          tooltipType="none"
        />

        {/* User data */}
        <Radar
          dataKey="level"
          stroke="#00E5FF"
          fill="#00E5FF"
          fillOpacity={0.18}
          strokeWidth={1.5}
        />

        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
