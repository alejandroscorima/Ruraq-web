import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, Resize, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { ROBOT_MODEL_URL } from '../lib/model'
import VirtualJoystick from './VirtualJoystick'

type Stick = { x: number; y: number }

type MuseumDemoProps = {
  open: boolean
  onClose: () => void
}

const ROOM = { w: 22, d: 16, h: 4.6 }
const MOVE_SPEED = 2.8
const TURN_SPEED = 1.9
const BOUNDS = { x: ROOM.w / 2 - 1.1, z: ROOM.d / 2 - 1.1 }

/** Obras estilizadas (no reproducciones): color + título para ambientar la sala. */
const ARTWORKS = [
  { title: 'La Gioconda', artist: 'Leonardo', color: '#6b4e2e', wall: 'n' as const, u: -6 },
  { title: 'La noche estrellada', artist: 'Van Gogh', color: '#1e3a6e', wall: 'n' as const, u: 0 },
  { title: 'El grito', artist: 'Munch', color: '#7a3b2e', wall: 'n' as const, u: 6 },
  { title: 'Guernica', artist: 'Picasso', color: '#3a3a3a', wall: 's' as const, u: -4 },
  { title: 'Las meninas', artist: 'Velázquez', color: '#4a5540', wall: 's' as const, u: 4 },
  { title: 'La gran ola', artist: 'Hokusai', color: '#2a4a6a', wall: 'w' as const, u: -3 },
  { title: 'Nacimiento de Venus', artist: 'Botticelli', color: '#8a6a50', wall: 'w' as const, u: 3 },
  { title: 'Persistencia memoria', artist: 'Dalí', color: '#5a6a3a', wall: 'e' as const, u: -3 },
  { title: 'American Gothic', artist: 'Wood', color: '#4a3a2a', wall: 'e' as const, u: 3 },
]

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

function Painting({
  title,
  artist,
  color,
  position,
  rotation,
}: {
  title: string
  artist: string
  color: string
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.03]} castShadow>
        <boxGeometry args={[2.4, 1.7, 0.08]} />
        <meshStandardMaterial color="#1a1510" metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.05, 0.01]}>
        <planeGeometry args={[2.05, 1.35]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Marco interior brass */}
      <mesh position={[0, 0.05, 0]}>
        <planeGeometry args={[2.15, 1.45]} />
        <meshStandardMaterial color="#c9a86c" metalness={0.5} roughness={0.4} transparent opacity={0.25} />
      </mesh>
      <Text
        position={[0, -1.05, 0.05]}
        fontSize={0.11}
        color="#ece9e2"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.2}
      >
        {`${title} · ${artist}`}
      </Text>
    </group>
  )
}

function artPose(wall: 'n' | 's' | 'e' | 'w', u: number): { pos: [number, number, number]; rot: [number, number, number] } {
  const y = 2.25
  if (wall === 'n') return { pos: [u, y, -ROOM.d / 2 + 0.08], rot: [0, 0, 0] }
  if (wall === 's') return { pos: [u, y, ROOM.d / 2 - 0.08], rot: [0, Math.PI, 0] }
  if (wall === 'w') return { pos: [-ROOM.w / 2 + 0.08, y, u], rot: [0, Math.PI / 2, 0] }
  return { pos: [ROOM.w / 2 - 0.08, y, u], rot: [0, -Math.PI / 2, 0] }
}

function GalleryRoom() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color="#1c2128" roughness={0.88} />
      </mesh>
      {/* Alfombra central */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[6, 8]} />
        <meshStandardMaterial color="#3a2a22" roughness={0.95} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.h, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color="#10141a" roughness={1} />
      </mesh>
      {[
        { pos: [0, ROOM.h / 2, -ROOM.d / 2] as const, rot: [0, 0, 0] as const, size: [ROOM.w, ROOM.h] as const },
        { pos: [0, ROOM.h / 2, ROOM.d / 2] as const, rot: [0, Math.PI, 0] as const, size: [ROOM.w, ROOM.h] as const },
        { pos: [-ROOM.w / 2, ROOM.h / 2, 0] as const, rot: [0, Math.PI / 2, 0] as const, size: [ROOM.d, ROOM.h] as const },
        { pos: [ROOM.w / 2, ROOM.h / 2, 0] as const, rot: [0, -Math.PI / 2, 0] as const, size: [ROOM.d, ROOM.h] as const },
      ].map((w, i) => (
        <mesh key={i} position={[...w.pos]} rotation={[...w.rot]} receiveShadow>
          <planeGeometry args={w.size} />
          <meshStandardMaterial color="#2e343c" roughness={0.92} />
        </mesh>
      ))}

      {/* Bancas / pedestales decorativos (obstáculos blandos visuales) */}
      {[
        [-5, 0.35, 4],
        [5, 0.35, 4],
        [-5, 0.35, -5],
        [5, 0.35, -5],
      ].map((p, i) => (
        <mesh key={`bench-${i}`} position={p as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.7, 0.55]} />
          <meshStandardMaterial color="#2a241c" roughness={0.7} />
        </mesh>
      ))}

      {ARTWORKS.map((a) => {
        const pose = artPose(a.wall, a.u)
        return (
          <Painting
            key={a.title}
            title={a.title}
            artist={a.artist}
            color={a.color}
            position={pose.pos}
            rotation={pose.rot}
          />
        )
      })}

      <Text position={[0, 3.6, -ROOM.d / 2 + 0.12]} fontSize={0.28} color="#c9a86c" anchorX="center">
        Sala RURAQ · Mediación cultural
      </Text>
    </group>
  )
}

function RobotPlayer({
  keys,
  stick,
}: {
  keys: React.MutableRefObject<Record<string, boolean>>
  stick: React.MutableRefObject<Stick>
}) {
  const model = useRobot()
  const group = useRef<THREE.Group>(null)
  const yaw = useRef(0)
  const pos = useRef(new THREE.Vector3(0, 0, 4.5))
  const { camera } = useThree()
  const camTarget = useRef(new THREE.Vector3())
  const camPos = useRef(new THREE.Vector3(0, 2.2, 8))

  useFrame((_, delta) => {
    const k = keys.current
    // A/D o stick.x → girar robot; W/S o stick.y → avanzar/retroceder
    const turn =
      ((k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0) || 0) + stick.current.x
    const drive =
      ((k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) || 0) + stick.current.y

    yaw.current -= turn * TURN_SPEED * delta

    const forward = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
    pos.current.addScaledVector(forward, drive * MOVE_SPEED * delta)
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -BOUNDS.x, BOUNDS.x)
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -BOUNDS.z, BOUNDS.z)

    if (group.current) {
      group.current.position.copy(pos.current)
      group.current.rotation.y = yaw.current
    }

    // Cámara tercera persona detrás del robot
    const back = new THREE.Vector3(Math.sin(yaw.current), 0, Math.cos(yaw.current))
    const desired = pos.current.clone().add(back.multiplyScalar(4.2)).add(new THREE.Vector3(0, 2.1, 0))
    camPos.current.lerp(desired, 1 - Math.exp(-4 * delta))
    camTarget.current.lerp(
      pos.current.clone().add(new THREE.Vector3(0, 1.1, 0)).add(forward.clone().multiplyScalar(1.2)),
      1 - Math.exp(-5 * delta),
    )
    camera.position.copy(camPos.current)
    camera.lookAt(camTarget.current)
  })

  return (
    <group ref={group} position={[0, 0, 4.5]}>
      <Center>
        <Resize>
          <group scale={1.35}>
            <primitive object={model} />
          </group>
        </Resize>
      </Center>
    </group>
  )
}

function Scene({
  keys,
  stick,
}: {
  keys: React.MutableRefObject<Record<string, boolean>>
  stick: React.MutableRefObject<Stick>
}) {
  return (
    <>
      <color attach="background" args={['#0a0e14']} />
      <fog attach="fog" args={['#0a0e14', 12, 32]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[6, 10, 4]} intensity={0.65} castShadow />
      <spotLight position={[0, 4.2, 0]} angle={0.85} penumbra={0.5} intensity={12} color="#fff6e8" />
      <spotLight position={[-7, 3.8, -6]} angle={0.45} penumbra={0.7} intensity={7} color="#a8b8d8" />
      <spotLight position={[7, 3.8, 5]} angle={0.45} penumbra={0.7} intensity={6} color="#d8c8a8" />
      <GalleryRoom />
      <Suspense fallback={null}>
        <RobotPlayer keys={keys} stick={stick} />
      </Suspense>
    </>
  )
}

export default function MuseumDemo({ open, onClose }: MuseumDemoProps) {
  const keys = useRef<Record<string, boolean>>({})
  const stick = useRef<Stick>({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [hint, setHint] = useState(true)

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
      // Evitar scroll con flechas/espacio
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    const t = window.setTimeout(() => setHint(false), 6000)
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 safe-top sm:p-4">
        <div className="pointer-events-auto rounded-full border border-line/80 bg-ink/70 px-3 py-1.5 text-[10px] tracking-[0.18em] text-muted uppercase backdrop-blur-md sm:text-[11px]">
          Demo museo · conduce a RURAQ
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
          <p className="max-w-lg rounded-2xl border border-line/70 bg-ink/75 px-4 py-3 text-center text-[12px] leading-relaxed text-fog/90 backdrop-blur-md sm:text-sm">
            {isMobile
              ? 'Joystick: arriba/abajo avanza · izquierda/derecha gira al robot'
              : 'W/S avanzar-retroceder · A/D girar al robot · Esc salir'}
          </p>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <Canvas
          camera={{ fov: 55, near: 0.1, far: 70, position: [0, 2.2, 8] }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          shadows
        >
          <Scene keys={keys} stick={stick} />
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
