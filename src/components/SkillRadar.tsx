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
import { getAllSkillDefs, getBranch } from '../lib/skills'
import { computeLevel } from '../lib/leveling'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RadarDatum {
  skillId:     string
  displayName: string
  branchColor: string
  level:       number
  max:         number
  aboveZero:   boolean
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface TooltipProps {
  active?:  boolean
  payload?: Array<{ payload: RadarDatum }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-panel border border-line px-3 py-2 text-xs font-mono">
      <span className="text-dim uppercase tracking-wider">{d.displayName}</span>
      <span className="ml-3 font-bold" style={{ color: d.branchColor }}>
        Lv {d.level}
      </span>
    </div>
  )
}

// ─── Branch-colored axis tick ─────────────────────────────────────────────────
// Factory that closes over the data array so each tick can look up its color.

type SvgTextAnchor = 'start' | 'middle' | 'end' | 'inherit'

function makeBranchTick(dataItems: RadarDatum[]) {
  return function BranchTick({
    x,
    y,
    payload,
    textAnchor,
  }: {
    x:           number
    y:           number
    payload:     { value: string }
    textAnchor?: SvgTextAnchor
  }) {
    const item = dataItems.find(d => d.skillId === payload.value)
    if (!item) return null
    return (
      <text
        x={x}
        y={y}
        fontSize={9}
        fontFamily="JetBrains Mono, monospace"
        fill={item.branchColor}
        opacity={item.aboveZero ? 1 : 0.55}
        textAnchor={textAnchor ?? 'middle'}
        dominantBaseline="central"
      >
        {item.displayName}
      </text>
    )
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SkillRadar() {
  const skillPoints    = useEgolockStore(s => s.skillPoints)
  const customSkills   = useEgolockStore(s => s.customSkills)
  const sportSkillName = useEgolockStore(s => s.sportSkillName)

  const allDefs = useMemo(() => getAllSkillDefs(customSkills), [customSkills])

  const data = useMemo<RadarDatum[]>(
    () =>
      allDefs.map(skill => {
        const pts   = skillPoints[skill.id] ?? 0
        const level = computeLevel(skill.rarity, pts)
        return {
          skillId:     skill.id,
          displayName: skill.isCustomNameable ? sportSkillName : skill.name,
          branchColor: getBranch(skill.branchId).color,
          level,
          max:         15,
          aboveZero:   level > 0,
        }
      }),
    [allDefs, skillPoints, sportSkillName],
  )

  // Recreated only when data changes — stable between renders otherwise
  const BranchTick = useMemo(() => makeBranchTick(data), [data])

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} margin={{ top: 16, right: 40, bottom: 16, left: 40 }}>
        <PolarGrid stroke="#1F1F1F" />

        {/* dataKey="skillId" so custom tick receives the skill ID in payload.value */}
        <PolarAngleAxis
          dataKey="skillId"
          tick={BranchTick as any}
        />
        <PolarRadiusAxis domain={[0, 15]} tick={false} axisLine={false} />

        {/* Background ceiling — always at max 15 */}
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
