import { useState, useCallback } from 'react'
import {
  EGO_AXIS_INFO,
  EGO_QUADRANT_INFO,
  getQuadrantKey,
} from '../lib/egoTest'

// ─── SVG layout constants ─────────────────────────────────────────────────────
// Total viewBox: 360×360
// Inner plot area: x ∈ [40, 320], y ∈ [40, 320]  (280×280 usable)
// position.x ∈ [-1,1] → svgX = 40 + (position.x + 1) * 140
// position.y ∈ [-1,1] → svgY = 320 - (position.y + 1) * 140   (y inverted: freedom = top)

const VW      = 360
const AREA_L  = 40    // left edge of inner area
const AREA_R  = 320   // right edge
const AREA_T  = 40    // top edge
const AREA_B  = 320   // bottom edge
const CX      = (AREA_L + AREA_R) / 2   // 180
const CY      = (AREA_T + AREA_B) / 2   // 180

const NEON    = '#00E5FF'
const LINE    = '#1F1F1F'
const DIM     = '#7A7A7A'
const PANEL   = '#0A0A0A'

function toSvgX(x: number) { return AREA_L + (x + 1) * 140 }
function toSvgY(y: number) { return AREA_B - (y + 1) * 140 }
function fromSvgX(sx: number) { return Math.max(-1, Math.min(1, (sx - AREA_L) / 140 - 1)) }
function fromSvgY(sy: number) { return Math.max(-1, Math.min(1, (AREA_B - sy) / 140 - 1)) }

// ─── Arrow head helper ────────────────────────────────────────────────────────
function ArrowHead({ x, y, dir }: { x: number; y: number; dir: 'up' | 'down' | 'left' | 'right' }) {
  const S = 5
  const points =
    dir === 'up'    ? `${x},${y} ${x - S},${y + S * 1.6} ${x + S},${y + S * 1.6}` :
    dir === 'down'  ? `${x},${y} ${x - S},${y - S * 1.6} ${x + S},${y - S * 1.6}` :
    dir === 'left'  ? `${x},${y} ${x + S * 1.6},${y - S} ${x + S * 1.6},${y + S}` :
                     `${x},${y} ${x - S * 1.6},${y - S} ${x - S * 1.6},${y + S}`
  return <polygon points={points} fill={DIM} />
}

// ─── Info tooltip wrapper ─────────────────────────────────────────────────────
// Rendered in HTML (absolute-positioned div overlaid on the SVG container)

type TooltipPos = 'top' | 'bottom' | 'left' | 'right'

function InfoIcon({
  text,
  pos,
  style,
}: {
  text:  string
  pos:   TooltipPos
  style: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)

  const tooltipClass = [
    'absolute z-50 bg-panel border border-line font-mono text-[10px] text-dim leading-relaxed p-3 max-w-[220px] pointer-events-none',
    pos === 'top'    && 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    pos === 'bottom' && 'top-full mt-2 left-1/2 -translate-x-1/2',
    pos === 'left'   && 'right-full mr-2 top-1/2 -translate-y-1/2',
    pos === 'right'  && 'left-full ml-2 top-1/2 -translate-y-1/2',
  ].filter(Boolean).join(' ')

  return (
    <div
      className="absolute"
      style={style}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(v => !v)}
    >
      <span
        className="cursor-help inline-flex items-center justify-center w-4 h-4 border border-dim text-dim font-mono text-[9px] leading-none hover:border-neon hover:text-neon transition-colors select-none"
        tabIndex={0}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        role="button"
        aria-label="Info"
      >
        i
      </span>
      {open && (
        <div className={tooltipClass} style={{ whiteSpace: 'pre-wrap' }}>
          {text}
        </div>
      )}
    </div>
  )
}

// ─── Pulse animation (injected once) ─────────────────────────────────────────
const PULSE_CSS = `
@keyframes egoPulse {
  0%   { stroke-opacity: 0.6; r: 10; }
  100% { stroke-opacity: 0;   r: 18; }
}
.ego-pulse-ring {
  animation: egoPulse 1.4s ease-out infinite;
}
`

// ─── Main component ───────────────────────────────────────────────────────────

interface EgoQuadrantGraphicProps {
  position:    { x: number; y: number } | null
  interactive: boolean
  onChange?:   (pos: { x: number; y: number }) => void
  pulseDot?:   boolean
}

export default function EgoQuadrantGraphic({
  position,
  interactive,
  onChange,
  pulseDot = false,
}: EgoQuadrantGraphicProps) {
  // Quadrant label for current position
  const quadrantLabel = position ? EGO_QUADRANT_INFO[getQuadrantKey(position)].name : null

  const handleClick = useCallback((e: React.MouseEvent<SVGRectElement>) => {
    if (!interactive || !onChange) return
    const svg  = (e.currentTarget as SVGElement).closest('svg')!
    const rect = svg.getBoundingClientRect()
    const sx   = (e.clientX - rect.left) * (VW / rect.width)
    const sy   = (e.clientY - rect.top)  * (VW / rect.height)
    // Only respond to clicks inside the inner plot area
    if (sx < AREA_L || sx > AREA_R || sy < AREA_T || sy > AREA_B) return
    onChange({ x: fromSvgX(sx), y: fromSvgY(sy) })
  }, [interactive, onChange])

  const dotX = position ? toSvgX(position.x) : null
  const dotY = position ? toSvgY(position.y) : null

  return (
    <>
      {/* Pulse keyframes — injected into <head> once */}
      <style>{PULSE_CSS}</style>

      {/*
        Outer wrapper: position:relative so absolutely-positioned
        InfoIcon tooltips anchor correctly.
        Width matches SVG's 100% — tooltips are placed via pixel offsets
        derived from the SVG layout.
      */}
      <div className="relative w-full select-none" style={{ maxWidth: VW }}>

        {/* ── Axis label strip: FREEDOM (top) ─────────────────────────── */}
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span className="label text-neon text-[10px] tracking-widest">FREEDOM</span>
          <InfoIcon text={EGO_AXIS_INFO.freedom} pos="bottom" style={{ position: 'relative' }} />
        </div>

        {/* ── Middle row: WHOLISTIC | SVG | INDIVIDUALISTIC ───────────── */}
        <div className="flex items-center gap-1.5">

          {/* Left axis label */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span
              className="label text-neon text-[10px] tracking-widest"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >WHOLISTIC</span>
            <InfoIcon text={EGO_AXIS_INFO.wholistic} pos="right" style={{ position: 'relative' }} />
          </div>

          {/* SVG */}
          <div className="relative flex-1">
            <svg
              viewBox={`0 0 ${VW} ${VW}`}
              className="w-full border border-line"
              style={{ background: PANEL, display: 'block' }}
            >
              {/* ── Quadrant dim labels ─────────────────────────────── */}
              <text x={AREA_L + 8} y={AREA_T + 16} fontSize={8} fill={LINE} fontFamily="monospace" letterSpacing={1}>
                WHOLISTIC
              </text>
              <text x={AREA_L + 8} y={AREA_T + 26} fontSize={8} fill={LINE} fontFamily="monospace" letterSpacing={1}>
                + FREEDOM
              </text>

              <text x={AREA_R - 8} y={AREA_T + 16} fontSize={8} fill={LINE} fontFamily="monospace" letterSpacing={1} textAnchor="end">
                INDIVIDUALISTIC
              </text>
              <text x={AREA_R - 8} y={AREA_T + 26} fontSize={8} fill={LINE} fontFamily="monospace" letterSpacing={1} textAnchor="end">
                + FREEDOM
              </text>

              <text x={AREA_L + 8} y={AREA_B - 10} fontSize={8} fill={LINE} fontFamily="monospace" letterSpacing={1}>
                WHOLISTIC
              </text>
              <text x={AREA_L + 8} y={AREA_B - 2} fontSize={8} fill={LINE} fontFamily="monospace" letterSpacing={1}>
                + RESTRICTIVE
              </text>

              <text x={AREA_R - 8} y={AREA_B - 10} fontSize={8} fill={LINE} fontFamily="monospace" letterSpacing={1} textAnchor="end">
                INDIVIDUALISTIC
              </text>
              <text x={AREA_R - 8} y={AREA_B - 2} fontSize={8} fill={LINE} fontFamily="monospace" letterSpacing={1} textAnchor="end">
                + RESTRICTIVE
              </text>

              {/* ── Centre grid ─────────────────────────────────────── */}
              <line x1={CX} y1={AREA_T} x2={CX} y2={AREA_B} stroke={LINE} strokeWidth={1} />
              <line x1={AREA_L} y1={CY} x2={AREA_R} y2={CY} stroke={LINE} strokeWidth={1} />

              {/* ── Axis arrows ─────────────────────────────────────── */}
              {/* Vertical (Y) */}
              <line x1={CX} y1={AREA_T + 2} x2={CX} y2={AREA_B - 2} stroke={DIM} strokeWidth={1} />
              <ArrowHead x={CX} y={AREA_T + 2}  dir="up"   />
              <ArrowHead x={CX} y={AREA_B - 2}  dir="down" />

              {/* Horizontal (X) */}
              <line x1={AREA_L + 2} y1={CY} x2={AREA_R - 2} y2={CY} stroke={DIM} strokeWidth={1} />
              <ArrowHead x={AREA_L + 2} y={CY}  dir="left"  />
              <ArrowHead x={AREA_R - 2} y={CY}  dir="right" />

              {/* ── Interactive click target ─────────────────────────── */}
              {interactive && (
                <rect
                  x={AREA_L} y={AREA_T}
                  width={AREA_R - AREA_L} height={AREA_B - AREA_T}
                  fill="transparent"
                  className="cursor-crosshair"
                  onClick={handleClick}
                />
              )}

              {/* ── User dot ─────────────────────────────────────────── */}
              {dotX != null && dotY != null && (
                <>
                  {/* Faint crosshair */}
                  <line x1={dotX} y1={AREA_T} x2={dotX} y2={AREA_B} stroke={NEON} strokeWidth={0.5} strokeOpacity={0.2} />
                  <line x1={AREA_L} y1={dotY} x2={AREA_R} y2={dotY} stroke={NEON} strokeWidth={0.5} strokeOpacity={0.2} />

                  {/* Pulse ring (visible only when pulseDot=true) */}
                  {pulseDot && (
                    <circle
                      cx={dotX} cy={dotY} r={10}
                      fill="none"
                      stroke={NEON}
                      strokeWidth={1.5}
                      className="ego-pulse-ring"
                    />
                  )}

                  {/* Solid dot */}
                  <circle cx={dotX} cy={dotY} r={6}   fill={NEON} />
                  <circle cx={dotX} cy={dotY} r={2.5} fill="#000" />
                </>
              )}
            </svg>
          </div>

          {/* Right axis label */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span
              className="label text-neon text-[10px] tracking-widest"
              style={{ writingMode: 'vertical-rl' }}
            >INDIVIDUALISTIC</span>
            <InfoIcon text={EGO_AXIS_INFO.individualistic} pos="left" style={{ position: 'relative' }} />
          </div>

        </div>

        {/* ── Axis label strip: RESTRICTION (bottom) ──────────────────── */}
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <span className="label text-neon text-[10px] tracking-widest">RESTRICTION</span>
          <InfoIcon text={EGO_AXIS_INFO.restriction} pos="top" style={{ position: 'relative' }} />
        </div>

        {/* ── Coordinates + quadrant label ────────────────────────────── */}
        {position && (
          <div className="flex items-center justify-between mt-2 px-0.5">
            <span className="label text-dim text-[10px] tabular-nums">
              x {position.x.toFixed(2)} · y {position.y.toFixed(2)}
            </span>
            {quadrantLabel && (
              <span className="label text-dim text-[10px]">{quadrantLabel}</span>
            )}
          </div>
        )}

      </div>
    </>
  )
}
