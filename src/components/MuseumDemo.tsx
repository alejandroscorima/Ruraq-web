import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, ContactShadows, Resize, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { ROBOT_MODEL_URL } from '../lib/model'
import VirtualJoystick from './VirtualJoystick'

type Stick = { x: number; y: number }

type MuseumDemoProps = {
  open: boolean
  onClose: () => void
}

const ROOM = { w: 18, d: 14, h: 4.2 }
const SPEED = 3.2
const LOOK_SENS = 0.0022
const BOUNDS = { x: ROOM.w / 2 - 0.7, z: ROOM.d / 2 - 0.7 }

function useRobot() {
  const { scene } = useGLTF(ROBOT_MODEL_URL)
  return useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const mat of mats) {
          if (!mat) continue
          mat.side = THREE.DoubleSide
          mat.needsUpdate = true
        }
      }
    })
    return clone
  }, [scene])
}

function GalleryRoom() {
  const wall = '#2a3038'
  const trim = '#c9a86c'
  const floor = '#1a1e24'
  const ceiling = '#12161c'

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color={floor} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.h, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color={ceiling} roughness={1} />
      </mesh>
      {/* Walls */}
      {[
        { pos: [0, ROOM.h / 2, -ROOM.d / 2] as const, rot: [0, 0, 0] as const, size: [ROOM.w, ROOM.h] as const },
        { pos: [0, ROOM.h / 2, ROOM.d / 2] as const, rot: [0, Math.PI, 0] as const, size: [ROOM.w, ROOM.h] as const },
        { pos: [-ROOM.w / 2, ROOM.h / 2, 0] as const, rot: [0, Math.PI / 2, 0] as const, size: [ROOM.d, ROOM.h] as const },
        { pos: [ROOM.w / 2, ROOM.h / 2, 0] as const, rot: [0, -Math.PI / 2, 0] as const, size: [ROOM.d, ROOM.h] as const },
      ].map((w, i) => (
        <mesh key={i} position={[...w.pos]} rotation={[...w.rot]} receiveShadow>
          <planeGeometry args={w.size} />
          <meshStandardMaterial color={wall} roughness={0.9} />
        </mesh>
      ))}

      {/* Brass baseboard strip */}
      {[
        { pos: [0, 0.08, -ROOM.d / 2 + 0.02], size: [ROOM.w, 0.16] as const, rot: [0, 0, 0] as const },
        { pos: [0, 0.08, ROOM.d / 2 - 0.02], size: [ROOM.w, 0.16] as const, rot: [0, Math.PI, 0] as const },
      ].map((b, i) => (
        <mesh key={`trim-${i}`} position={b.pos as [number, number, number]} rotation={b.rot}>
          <planeGeometry args={b.size} />
          <meshStandardMaterial color={trim} metalness={0.55} roughness={0.35} />
        </mesh>
      ))}

      {/* “Paintings” */}
      {[
        { x: -4.5, z: -ROOM.d / 2 + 0.06, color: '#5a4632' },
        { x: 0, z: -ROOM.d / 2 + 0.06, color: '#3d4a5c' },
        { x: 4.5, z: -ROOM.d / 2 + 0.06, color: '#4a3a42' },
        { x: -ROOM.w / 2 + 0.06, z: -2.5, color: '#46524a', rot: Math.PI / 2 },
        { x: ROOM.w / 2 - 0.06, z: 2.2, color: '#524640', rot: -Math.PI / 2 },
      ].map((p, i) => (
        <group key={`art-${i}`} position={[p.x, 2.1, p.z]} rotation={[0, p.rot ?? 0, 0]}>
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[2.2, 1.5, 0.06]} />
            <meshStandardMaterial color="#1c1814" metalness={0.3} roughness={0.5} />
          </mesh>
          <mesh>
            <planeGeometry args={[1.9, 1.25]} />
            <meshStandardMaterial color={p.color} roughness={0.75} />
          </mesh>
        </group>
      ))}

      {/* Pedestal */}
      <mesh position={[0, 0.35, -1.2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.85, 0.95, 0.7, 48]} />
        <meshStandardMaterial color="#d8d2c6" roughness={0.45} metalness={0.1} />
      </mesh>
    </group>
  )
}

function RobotOnPedestal() {
  const model = useRobot()
  return (
    <group position={[0, 0.72, -1.2]}>
      <Center>
        <Resize>
          <group scale={2.15}>
            <primitive object={model} />
          </group>
        </Resize>
      </Center>
      <ContactShadows position={[0, -0.01, 0]} opacity={0.55} scale={6} blur={2.2} far={3} />
    </group>
  )
}

function WalkController({
  keys,
  stick,
  lookDelta,
}: {
  keys: React.MutableRefObject<Record<string, boolean>>
  stick: React.MutableRefObject<Stick>
  lookDelta: React.MutableRefObject<{ dx: number; dy: number }>
}) {
  const { camera } = useThree()
  const yaw = useRef(0)
  const pitch = useRef(-0.12)
  const pos = useRef(new THREE.Vector3(0, 1.55, 5.5))
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    yaw.current -= lookDelta.current.dx * LOOK_SENS
    pitch.current -= lookDelta.current.dy * LOOK_SENS
    pitch.current = THREE.MathUtils.clamp(pitch.current, -1.2, 1.2)
    lookDelta.current.dx = 0
    lookDelta.current.dy = 0

    const k = keys.current
    let mx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0)
    let mz = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0)
    mx += stick.current.x
    mz += stick.current.y

    forward.current.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
    right.current.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current))

    const move = new THREE.Vector3()
    move.addScaledVector(forward.current, mz)
    move.addScaledVector(right.current, mx)
    if (move.lengthSq() > 1) move.normalize()
    pos.current.addScaledVector(move, SPEED * delta)
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -BOUNDS.x, BOUNDS.x)
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -BOUNDS.z, BOUNDS.z)
    pos.current.y = 1.55

    camera.position.copy(pos.current)
    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw.current
    camera.rotation.x = pitch.current
  })

  return null
}

function Scene({
  keys,
  stick,
  lookDelta,
}: {
  keys: React.MutableRefObject<Record<string, boolean>>
  stick: React.MutableRefObject<Stick>
  lookDelta: React.MutableRefObject<{ dx: number; dy: number }>
}) {
  return (
    <>
      <color attach="background" args={['#0c1016']} />
      <fog attach="fog" args={['#0c1016', 10, 26]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 8, 2]} intensity={0.55} castShadow />
      <spotLight position={[0, 3.8, -1.2]} angle={0.55} penumbra={0.6} intensity={18} color="#fff4e4" castShadow />
      <spotLight position={[-5, 3.6, -5]} angle={0.4} penumbra={0.7} intensity={6} color="#a8b8d8" />
      <spotLight position={[5, 3.6, 3]} angle={0.4} penumbra={0.7} intensity={5} color="#d8c8a8" />
      <GalleryRoom />
      <Suspense fallback={null}>
        <RobotOnPedestal />
      </Suspense>
      <WalkController keys={keys} stick={stick} lookDelta={lookDelta} />
    </>
  )
}

export default function MuseumDemo({ open, onClose }: MuseumDemoProps) {
  const keys = useRef<Record<string, boolean>>({})
  const stick = useRef<Stick>({ x: 0, y: 0 })
  const lookDelta = useRef({ dx: 0, dy: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [hint, setHint] = useState(true)
  const looking = useRef(false)
  const lastLook = useRef({ x: 0, y: 0 })
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose()
      keys.current[e.code] = e.type === 'keydown'
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    const t = window.setTimeout(() => setHint(false), 5000)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.clearTimeout(t)
      keys.current = {}
    }
  }, [open, onClose])

  const onStick = useCallback((s: Stick) => {
    stick.current = s
  }, [])

  useEffect(() => {
    if (!open) return
    const el = stageRef.current
    if (!el) return

    const onDown = (e: PointerEvent) => {
      // En móvil: mirar con el dedo en la mitad derecha (fuera del joystick)
      if (isMobile && e.clientX < window.innerWidth * 0.42) return
      looking.current = true
      lastLook.current = { x: e.clientX, y: e.clientY }
      el.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!looking.current) return
      lookDelta.current.dx += e.clientX - lastLook.current.x
      lookDelta.current.dy += e.clientY - lastLook.current.y
      lastLook.current = { x: e.clientX, y: e.clientY }
    }
    const onUp = () => {
      looking.current = false
    }

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
  }, [open, isMobile])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 safe-top sm:p-4">
        <div className="pointer-events-auto rounded-full border border-line/80 bg-ink/70 px-3 py-1.5 text-[10px] tracking-[0.18em] text-muted uppercase backdrop-blur-md sm:text-[11px]">
          Demo sala · RURAQ
        </div>
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto rounded-full border border-line bg-ink/80 px-4 py-2 text-xs font-medium text-fog backdrop-blur-md transition-colors hover:border-brass hover:text-brass"
        >
          Cerrar
        </button>
      </div>

      {hint && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-4 sm:top-20">
          <p className="max-w-md rounded-2xl border border-line/70 bg-ink/75 px-4 py-3 text-center text-[12px] leading-relaxed text-fog/90 backdrop-blur-md sm:text-sm">
            {isMobile
              ? 'Joystick izquierdo para caminar · desliza a la derecha para mirar'
              : 'WASD o flechas para caminar · arrastra para mirar · Esc para salir'}
          </p>
        </div>
      )}

      <div ref={stageRef} className="relative min-h-0 flex-1 touch-none">
        <Canvas
          camera={{ fov: 60, near: 0.1, far: 60, position: [0, 1.55, 5.5] }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          shadows
        >
          <Scene keys={keys} stick={stick} lookDelta={lookDelta} />
        </Canvas>

        {isMobile && (
          <div className="pointer-events-auto absolute bottom-6 left-4 z-20 safe-bottom sm:bottom-8 sm:left-6">
            <VirtualJoystick onChange={onStick} />
          </div>
        )}
      </div>
    </div>
  )
}

