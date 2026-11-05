import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, Resize, Text, useGLTF, useTexture } from '@react-three/drei'
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

/** Obras de dominio público (Wikimedia Commons), empaquetadas en /public/museum. */
const ARTWORKS = [
  {
    title: 'La Gioconda',
    artist: 'Leonardo da Vinci',
    src: '/museum/mona-lisa.jpg',
    wall: 'n' as const,
    u: -6,
  },
  {
    title: 'La noche estrellada',
    artist: 'Vincent van Gogh',
    src: '/museum/starry-night.jpg',
    wall: 'n' as const,
    u: 0,
  },
  {
    title: 'El grito',
    artist: 'Edvard Munch',
    src: '/museum/the-scream.jpg',
    wall: 'n' as const,
    u: 6,
  },
  {
    title: 'Las meninas',
    artist: 'Diego Velázquez',
    src: '/museum/las-meninas.jpg',
    wall: 's' as const,
    u: -4,
  },
  {
    title: 'Los girasoles',
    artist: 'Vincent van Gogh',
    src: '/museum/sunflowers.jpg',
    wall: 's' as const,
    u: 4,
  },
  {
    title: 'La gran ola de Kanagawa',
    artist: 'Hokusai',
    src: '/museum/great-wave.jpg',
    wall: 'w' as const,
    u: -3,
  },
  {
    title: 'El nacimiento de Venus',
    artist: 'Sandro Botticelli',
    src: '/museum/birth-venus.jpg',
    wall: 'w' as const,
    u: 3,
  },
  {
    title: 'La joven de la perla',
    artist: 'Johannes Vermeer',
    src: '/museum/pearl-earring.jpg',
    wall: 'e' as const,
    u: -3,
  },
  {
    title: 'Caminante sobre el mar de niebla',
    artist: 'C. D. Friedrich',
    src: '/museum/wanderer.jpg',
    wall: 'e' as const,
    u: 3,
  },
]

useGLTF.preload(ROBOT_MODEL_URL)
ARTWORKS.forEach((a) => useTexture.preload(a.src))

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
  src,
  position,
  rotation,
}: {
  title: string
  artist: string
  src: string
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  const texture = useTexture(src)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  const maxH = 1.55
  const maxW = 2.35
  const img = texture.image as { width: number; height: number } | undefined
  const aspect = img?.width && img?.height ? img.width / img.height : 1
  let h = maxH
  let w = h * aspect
  if (w > maxW) {
    w = maxW
    h = w / aspect
  }

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.04]} castShadow>
        <boxGeometry args={[w + 0.28, h + 0.28, 0.09]} />
        <meshStandardMaterial color="#5a4630" metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[w + 0.14, h + 0.14, 0.04]} />
        <meshStandardMaterial color="#d4b87a" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={texture} roughness={0.85} metalness={0.05} />
      </mesh>
      <Text
        position={[0, -(h / 2 + 0.28), 0.05]}
        fontSize={0.1}
        color="#3a342c"
        anchorX="center"
        anchorY="middle"
        maxWidth={Math.max(w, 2)}
      >
        {`${title} · ${artist}`}
      </Text>
    </group>
  )
}

function artPose(wall: 'n' | 's' | 'e' | 'w', u: number): { pos: [number, number, number]; rot: [number, number, number] } {
  const y = 2.15
  if (wall === 'n') return { pos: [u, y, -ROOM.d / 2 + 0.1], rot: [0, 0, 0] }
  if (wall === 's') return { pos: [u, y, ROOM.d / 2 - 0.1], rot: [0, Math.PI, 0] }
  if (wall === 'w') return { pos: [-ROOM.w / 2 + 0.1, y, u], rot: [0, Math.PI / 2, 0] }
  return { pos: [ROOM.w / 2 - 0.1, y, u], rot: [0, -Math.PI / 2, 0] }
}

function GalleryRoom() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color="#d8d2c6" roughness={0.92} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[7, 9]} />
        <meshStandardMaterial color="#8b5a3c" roughness={0.95} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.h, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color="#f2eee6" roughness={1} />
      </mesh>
      {[
        { pos: [0, ROOM.h / 2, -ROOM.d / 2] as const, rot: [0, 0, 0] as const, size: [ROOM.w, ROOM.h] as const },
        { pos: [0, ROOM.h / 2, ROOM.d / 2] as const, rot: [0, Math.PI, 0] as const, size: [ROOM.w, ROOM.h] as const },
        { pos: [-ROOM.w / 2, ROOM.h / 2, 0] as const, rot: [0, Math.PI / 2, 0] as const, size: [ROOM.d, ROOM.h] as const },
        { pos: [ROOM.w / 2, ROOM.h / 2, 0] as const, rot: [0, -Math.PI / 2, 0] as const, size: [ROOM.d, ROOM.h] as const },
      ].map((w, i) => (
        <mesh key={i} position={[...w.pos]} rotation={[...w.rot]} receiveShadow>
          <planeGeometry args={w.size} />
          <meshStandardMaterial color="#f4f0e8" roughness={0.9} />
        </mesh>
      ))}

      {[
        [-5, 0.35, 4],
        [5, 0.35, 4],
        [-5, 0.35, -5],
        [5, 0.35, -5],
      ].map((p, i) => (
        <mesh key={`bench-${i}`} position={p as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.7, 0.55]} />
          <meshStandardMaterial color="#6b5340" roughness={0.7} />
        </mesh>
      ))}

      {ARTWORKS.map((a) => {
        const pose = artPose(a.wall, a.u)
        return (
          <Suspense key={a.title} fallback={null}>
            <Painting
              title={a.title}
              artist={a.artist}
              src={a.src}
              position={pose.pos}
              rotation={pose.rot}
            />
          </Suspense>
        )
      })}

      <Text position={[0, 3.6, -ROOM.d / 2 + 0.12]} fontSize={0.28} color="#8a6d3b" anchorX="center">
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
      {/* bottom: asienta la base del modelo sobre el piso (y=0) */}
      <Center bottom>
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
      <color attach="background" args={['#e8e2d6']} />
      <fog attach="fog" args={['#e8e2d6', 22, 48]} />
      <ambientLight intensity={0.95} />
      <hemisphereLight args={['#fff8ee', '#c8c0b4', 0.55]} />
      <directionalLight position={[6, 10, 4]} intensity={1.15} castShadow shadow-mapSize={[1024, 1024]} />
      <spotLight position={[0, 4.2, 0]} angle={1.05} penumbra={0.55} intensity={18} color="#fff8ee" />
      <spotLight position={[-7, 3.8, -6]} angle={0.55} penumbra={0.65} intensity={10} color="#fff5e0" />
      <spotLight position={[7, 3.8, 5]} angle={0.55} penumbra={0.65} intensity={9} color="#fff0d8" />
      <pointLight position={[-6, 3.2, -7.5]} intensity={6} color="#ffe9c8" distance={10} />
      <pointLight position={[0, 3.2, -7.5]} intensity={6} color="#ffe9c8" distance={10} />
      <pointLight position={[6, 3.2, -7.5]} intensity={6} color="#ffe9c8" distance={10} />
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
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#e8e2d6]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 safe-top sm:p-4">
        <div className="pointer-events-auto rounded-full border border-black/10 bg-white/75 px-3 py-1.5 text-[10px] tracking-[0.18em] text-stone-700 uppercase backdrop-blur-md sm:text-[11px]">
          Demo museo · conduce a RURAQ
        </div>
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto rounded-full border border-black/10 bg-white/85 px-4 py-2 text-xs font-medium text-stone-800 backdrop-blur-md transition-colors hover:border-amber-700/40 hover:text-amber-800"
        >
          Cerrar
        </button>
      </div>

      {hint && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-4 sm:top-20">
          <p className="max-w-lg rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-center text-[12px] leading-relaxed text-stone-700 backdrop-blur-md sm:text-sm">
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
