import { useCallback, useEffect, useRef, useState } from 'react'

type Stick = { x: number; y: number }

type VirtualJoystickProps = {
  onChange: (stick: Stick) => void
  className?: string
}

/**
 * Joystick táctil (móvil): emite vector normalizado (-1…1) en X/Y.
 * Y positivo = adelante.
 */
export default function VirtualJoystick({ onChange, className = '' }: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const active = useRef(false)
  const origin = useRef({ x: 0, y: 0 })

  const radius = 48

  const emit = useCallback(
    (dx: number, dy: number) => {
      const len = Math.hypot(dx, dy) || 1
      const clamped = Math.min(len, radius)
      const nx = (dx / len) * clamped
      const ny = (dy / len) * clamped
      setKnob({ x: nx, y: ny })
      onChange({ x: nx / radius, y: -ny / radius })
    },
    [onChange],
  )

  const end = useCallback(() => {
    active.current = false
    setKnob({ x: 0, y: 0 })
    onChange({ x: 0, y: 0 })
  }, [onChange])

  useEffect(() => {
    const el = baseRef.current
    if (!el) return

    const onDown = (e: PointerEvent) => {
      e.preventDefault()
      el.setPointerCapture(e.pointerId)
      active.current = true
      const rect = el.getBoundingClientRect()
      origin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      emit(e.clientX - origin.current.x, e.clientY - origin.current.y)
    }

    const onMove = (e: PointerEvent) => {
      if (!active.current) return
      emit(e.clientX - origin.current.x, e.clientY - origin.current.y)
    }

    const onUp = () => end()

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [emit, end])

  return (
    <div
      ref={baseRef}
      className={`relative h-[112px] w-[112px] touch-none select-none rounded-full border border-white/20 bg-black/35 backdrop-blur-sm ${className}`}
      style={{ boxShadow: 'inset 0 0 24px rgba(0,0,0,0.35)' }}
      aria-label="Joystick de movimiento"
    >
      <div
        className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brass/50 bg-fog/90"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  )
}
