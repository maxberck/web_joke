import type { Rect } from '../utils/barrierLines'

/**
 * Entoure la zone de clic actuelle des couloirs de bowling d'un rectangle net —
 * plus de lignes qui traversent tout l'écran à chaque nouveau couloir, juste le
 * contour de la zone réellement cliquable (celle qui rétrécit vers le pixel).
 */
export default function BarrierLinesLayer({ zone, color = '#FF2A2A' }: { zone: Rect | null; color?: string }) {
  if (!zone) return null

  return (
    <div
      className="pointer-events-none absolute z-20 box-border"
      style={{
        left: zone.x,
        top: zone.y,
        width: zone.w,
        height: zone.h,
        border: `2px solid ${color}`,
      }}
    />
  )
}
