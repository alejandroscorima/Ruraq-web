import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { ROBOT_MODEL_URL } from '../lib/model'
import VirtualJoystick from './VirtualJoystick'

type Stick = { x: number; y: number }
type Wall = 'n' | 's' | 'e' | 'w'

type MuseumDemoProps = {
  open: boolean
  onClose: () => void
}

const ROOM = { w: 22, d: 16, h: 4.6 }
const MOVE_SPEED = 2.8
const TURN_SPEED = 1.9
const BOUNDS = { x: ROOM.w / 2 - 1.1, z: ROOM.d / 2 - 1.1 }
const CHECK_RADIUS = 1.15
const ROBOT_TARGET_HEIGHT = 1.55

/** Obras de dominio público + reseña breve para mediación en checkpoint. */
const ARTWORKS = [
  {
    id: 'mona-lisa',
    arucoId: 0,
    title: 'La Gioconda',
    artist: 'Leonardo da Vinci',
    year: 'c. 1503',
    src: '/museum/mona-lisa.jpg',
    wall: 'n' as Wall,
    u: -6,
    blurb:
      'Retrato renacentista del Louvre. La sonrisa ambigua y la técnica del sfumato la convirtieron en el ícono más reconocido de la pintura occidental.',
  },
  {
    id: 'starry-night',
    arucoId: 1,
    title: 'La noche estrellada',
    artist: 'Vincent van Gogh',
    year: '1889',
    src: '/museum/starry-night.jpg',
    wall: 'n' as Wall,
    u: 0,
    blurb:
      'Cielo nocturno en remolino sobre Saint-Rémy. Van Gogh transforma la observación en emoción: el cosmos parece vivo, inquieto y luminoso.',
  },
  {
    id: 'the-scream',
    arucoId: 2,
    title: 'El grito',
    artist: 'Edvard Munch',
    year: '1893',
    src: '/museum/the-scream.jpg',
    wall: 'n' as Wall,
    u: 6,
    blurb:
      'Figura que se tapa los oídos ante un paisaje en agonía. Símbolo del expresionismo y de la ansiedad moderna frente a un mundo que “grita”.',
  },
  {
    id: 'las-meninas',
    arucoId: 3,
    title: 'Las meninas',
    artist: 'Diego Velázquez',
    year: '1656',
    src: '/museum/las-meninas.jpg',
    wall: 's' as Wall,
    u: -4,
    blurb:
      'Escena de corte en el Alcázar de Madrid. Velázquez se autorretrata pintando y pone al espectador en el lugar de los reyes reflejados.',
  },
  {
    id: 'sunflowers',
    arucoId: 4,
    title: 'Los girasoles',
    artist: 'Vincent van Gogh',
    year: '1888',
    src: '/museum/sunflowers.jpg',
    wall: 's' as Wall,
    u: 4,
    blurb:
      'Naturaleza muerta de Arlés en amarillos intensos. Los girasoles celebran la luz mediterránea y la amistad con Gauguin.',
  },
  {
    id: 'great-wave',
    arucoId: 5,
    title: 'La gran ola de Kanagawa',
    artist: 'Hokusai',
    year: 'c. 1831',
    src: '/museum/great-wave.jpg',
    wall: 'w' as Wall,
    u: -3,
    blurb:
      'Ukiyo-e con el monte Fuji al fondo. La ola amenaza a las barcas y resume la fuerza del mar frente a la permanencia del paisaje.',
  },
  {
    id: 'birth-venus',
    arucoId: 6,
    title: 'El nacimiento de Venus',
    artist: 'Sandro Botticelli',
    year: 'c. 1485',
    src: '/museum/birth-venus.jpg',
    wall: 'w' as Wall,
    u: 3,
    blurb:
      'Venus llega a Chipre sobre una concha. Ideal de belleza neoplatónica del Quattrocento florentino, entre mito y gracia.',
  },
  {
    id: 'pearl-earring',
    arucoId: 7,
    title: 'La joven de la perla',
    artist: 'Johannes Vermeer',
    year: 'c. 1665',
    src: '/museum/pearl-earring.jpg',
    wall: 'e' as Wall,
    u: -3,
    blurb:
      'Tronie con turbante y una perla que captura la luz. Intimidad, silencio y maestría en el tratamiento del color y la mirada.',
  },
  {
    id: 'wanderer',
    arucoId: 8,
    title: 'Caminante sobre el mar de niebla',
    artist: 'Caspar David Friedrich',
    year: '1818',
    src: '/museum/wanderer.jpg',
    wall: 'e' as Wall,
    u: 3,
    blurb:
      'Figura de espaldas ante un paisaje sublime. Emblema del Romanticismo: el individuo contemplando lo infinito.',
  },
]

useGLTF.preload(ROBOT_MODEL_URL)
ARTWORKS.forEach((a) => useTexture.preload(a.src))

/** Patrones tipo DICT_4X4 (borde negro + 4×4 bits) derivados del id ArUco. */
function arucoBits(id: number): boolean[][] {
  const bits: boolean[][] = Array.from({ length: 4 }, () => Array(4).fill(false))
  let x = (id * 1103515245 + 12345) >>> 0
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      x = (x * 1664525 + 1013904223) >>> 0
      bits[r][c] = (x & 1) === 1
    }
  }
  // Esquinas internas asimétricas para distinguir ids
  bits[0][0] = (id & 1) === 0
  bits[0][3] = (id & 2) !== 0
  bits[3][0] = (id & 4) !== 0
  bits[3][3] = (id & 8) === 0
  return bits
}

function makeArucoTexture(id: number): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#000'
  const cell = size / 6
  // borde
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(i * cell, 0, cell, cell)
    ctx.fillRect(i * cell, 5 * cell, cell, cell)
    ctx.fillRect(0, i * cell, cell, cell)
    ctx.fillRect(5 * cell, i * cell, cell, cell)
  }
  const bits = arucoBits(id)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (bits[r][c]) ctx.fillRect((c + 1) * cell, (r + 1) * cell, cell, cell)
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

function artPose(wall: Wall, u: number): { pos: [number, number, number]; rot: [number, number, number] } {
  const y = 2.15
  if (wall === 'n') return { pos: [u, y, -ROOM.d / 2 + 0.1], rot: [0, 0, 0] }
  if (wall === 's') return { pos: [u, y, ROOM.d / 2 - 0.1], rot: [0, Math.PI, 0] }
  if (wall === 'w') return { pos: [-ROOM.w / 2 + 0.1, y, u], rot: [0, Math.PI / 2, 0] }
  return { pos: [ROOM.w / 2 - 0.1, y, u], rot: [0, -Math.PI / 2, 0] }
}

/** Punto en el suelo frente a la obra (checkpoint de mediación). */
function checkpointXZ(wall: Wall, u: number): { x: number; z: number } {
  const standOff = 1.85
  if (wall === 'n') return { x: u, z: -ROOM.d / 2 + standOff }
  if (wall === 's') return { x: u, z: ROOM.d / 2 - standOff }
  if (wall === 'w') return { x: -ROOM.w / 2 + standOff, z: u }
  return { x: ROOM.w / 2 - standOff, z: u }
}

/** Marcador ArUco en la pared, a la derecha de la obra (altura de cámara del robot). */
function arucoPose(wall: Wall, u: number): { pos: [number, number, number]; rot: [number, number, number] } {
  const y = 1.05
  const side = 1.45
  if (wall === 'n') return { pos: [u + side, y, -ROOM.d / 2 + 0.12], rot: [0, 0, 0] }
  if (wall === 's') return { pos: [u - side, y, ROOM.d / 2 - 0.12], rot: [0, Math.PI, 0] }
  if (wall === 'w') return { pos: [-ROOM.w / 2 + 0.12, y, u + side], rot: [0, Math.PI / 2, 0] }
  return { pos: [ROOM.w / 2 - 0.12, y, u - side], rot: [0, -Math.PI / 2, 0] }
}

const CHECKPOINTS = ARTWORKS.map((a) => {
  const xz = checkpointXZ(a.wall, a.u)
  return { ...a, x: xz.x, z: xz.z }
})

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

    const box0 = new THREE.Box3().setFromObject(clone)
    const size0 = box0.getSize(new THREE.Vector3())
    const s = ROBOT_TARGET_HEIGHT / Math.max(size0.y, 0.001)
    clone.scale.setScalar(s)

    const box = new THREE.Box3().setFromObject(clone)
    const center = box.getCenter(new THREE.Vector3())
    clone.position.x -= center.x
    clone.position.z -= center.z
    clone.position.y -= box.min.y

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

function ArucoMarker({
  id,
  position,
  rotation,
}: {
  id: number
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  const map = useMemo(() => makeArucoTexture(id), [id])
  const size = 0.42

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[size + 0.08, size + 0.08, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial map={map} roughness={0.9} metalness={0} />
      </mesh>
      <Text
        position={[0, -(size / 2 + 0.12), 0.02]}
        fontSize={0.08}
        color="#5a5048"
        anchorX="center"
        anchorY="middle"
      >
        {`ArUco #${id}`}
      </Text>
    </group>
  )
}

function FloorCheckpoint({
  x,
  z,
  label,
  active,
}: {
  x: number
  z: number
  label: string
  active: boolean
}) {
  return (
    <group position={[x, 0.02, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[0.95, 1.15, 48]} />
        <meshStandardMaterial
          color={active ? '#c9a86c' : '#8a7a5c'}
          emissive={active ? '#c9a86c' : '#000000'}
          emissiveIntensity={active ? 0.35 : 0}
          roughness={0.55}
          metalness={0.2}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <circleGeometry args={[0.95, 48]} />
        <meshStandardMaterial
          color={active ? '#f3e6c8' : '#e4ddd0'}
          transparent
          opacity={0.85}
          roughness={0.95}
        />
      </mesh>
      <Text
        position={[0, 0.04, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.12}
        color={active ? '#6b5428' : '#7a7060'}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.6}
      >
        {label}
      </Text>
    </group>
  )
}

function GalleryRoom({ activeId }: { activeId: string | null }) {
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
        const marker = arucoPose(a.wall, a.u)
        const cp = checkpointXZ(a.wall, a.u)
        return (
          <group key={a.id}>
            <Suspense fallback={null}>
              <Painting
                title={a.title}
                artist={a.artist}
                src={a.src}
                position={pose.pos}
                rotation={pose.rot}
              />
            </Suspense>
            <ArucoMarker id={a.arucoId} position={marker.pos} rotation={marker.rot} />
            <FloorCheckpoint
              x={cp.x}
              z={cp.z}
              label={`#${a.arucoId}`}
              active={activeId === a.id}
            />
          </group>
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
  onCheckpoint,
  onMoved,
}: {
  keys: React.MutableRefObject<Record<string, boolean>>
  stick: React.MutableRefObject<Stick>
  onCheckpoint: (id: string | null) => void
  onMoved: () => void
}) {
  const model = useRobot()
  const group = useRef<THREE.Group>(null)
  const yaw = useRef(0)
  const pos = useRef(new THREE.Vector3(0, 0, 4.5))
  const { camera } = useThree()
  const camTarget = useRef(new THREE.Vector3())
  const camPos = useRef(new THREE.Vector3(0, 2.2, 8))
  const lastHit = useRef<string | null>(null)
  const movedOnce = useRef(false)

  useFrame((_, delta) => {
    const k = keys.current
    const turn =
      ((k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0) || 0) + stick.current.x
    const drive =
      ((k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) || 0) + stick.current.y

    if (!movedOnce.current && (Math.abs(turn) > 0.08 || Math.abs(drive) > 0.08)) {
      movedOnce.current = true
      onMoved()
    }

    yaw.current -= turn * TURN_SPEED * delta

    const forward = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
    pos.current.addScaledVector(forward, drive * MOVE_SPEED * delta)
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -BOUNDS.x, BOUNDS.x)
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -BOUNDS.z, BOUNDS.z)

    if (group.current) {
      group.current.position.copy(pos.current)
      group.current.rotation.y = yaw.current
    }

    let hit: string | null = null
    let best = CHECK_RADIUS
    for (const cp of CHECKPOINTS) {
      const d = Math.hypot(pos.current.x - cp.x, pos.current.z - cp.z)
      if (d < best) {
        best = d
        hit = cp.id
      }
    }
    if (hit !== lastHit.current) {
      lastHit.current = hit
      onCheckpoint(hit)
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
      <primitive object={model} />
    </group>
  )
}

function Scene({
  keys,
  stick,
  activeId,
  onCheckpoint,
  onMoved,
}: {
  keys: React.MutableRefObject<Record<string, boolean>>
  stick: React.MutableRefObject<Stick>
  activeId: string | null
  onCheckpoint: (id: string | null) => void
  onMoved: () => void
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
      <GalleryRoom activeId={activeId} />
      <Suspense fallback={null}>
        <RobotPlayer keys={keys} stick={stick} onCheckpoint={onCheckpoint} onMoved={onMoved} />
      </Suspense>
    </>
  )
}

export default function MuseumDemo({ open, onClose }: MuseumDemoProps) {
  const keys = useRef<Record<string, boolean>>({})
  const stick = useRef<Stick>({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [hint, setHint] = useState(true)
  const [intro, setIntro] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeArt = useMemo(
    () => (activeId ? ARTWORKS.find((a) => a.id === activeId) ?? null : null),
    [activeId],
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!open) return
    setHint(true)
    setIntro(true)
    setActiveId(null)
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
    const t = window.setTimeout(() => setHint(false), 8000)
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

  const onCheckpoint = useCallback((id: string | null) => {
    setActiveId(id)
  }, [])

  const onMoved = useCallback(() => {
    setIntro(false)
    setHint(false)
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

      {(intro || hint) && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-4 sm:top-20">
          <div className="flex w-full max-w-lg flex-col gap-2">
            {intro && (
              <div className="rounded-2xl border border-amber-800/20 bg-white/90 px-4 py-3.5 text-center shadow-lg backdrop-blur-md sm:px-5 sm:py-4">
                <p className="text-[11px] font-medium tracking-[0.2em] text-amber-800/80 uppercase">
                  Mediación cultural
                </p>
                <p className="mt-1.5 font-display text-lg text-stone-900 sm:text-xl">
                  Hola, soy RURAQ
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-stone-600 sm:text-sm">
                  Tu guía en esta sala. Acércate a los círculos del suelo junto a cada obra y te
                  contaré una breve reseña. Los marcadores ArUco en la pared son mis puntos de
                  referencia.
                </p>
              </div>
            )}
            {hint && (
              <p className="rounded-2xl border border-black/10 bg-white/80 px-4 py-2.5 text-center text-[12px] leading-relaxed text-stone-700 backdrop-blur-md sm:text-sm">
                {isMobile
                  ? 'Joystick: arriba/abajo avanza · izquierda/derecha gira al robot'
                  : 'W/S avanzar-retroceder · A/D girar al robot · Esc salir'}
              </p>
            )}
          </div>
        </div>
      )}

      {activeArt && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-4 sm:bottom-10">
          <article className="w-full max-w-md rounded-2xl border border-amber-800/25 bg-white/92 p-4 shadow-xl backdrop-blur-md sm:p-5">
            <p className="text-[10px] font-medium tracking-[0.18em] text-amber-800/70 uppercase">
              Checkpoint · ArUco #{activeArt.arucoId}
            </p>
            <h3 className="mt-1 font-display text-base text-stone-900 sm:text-lg">{activeArt.title}</h3>
            <p className="text-[12px] text-stone-500">
              {activeArt.artist} · {activeArt.year}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-stone-700 sm:text-[13px]">{activeArt.blurb}</p>
          </article>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <Canvas
          camera={{ fov: 55, near: 0.1, far: 70, position: [0, 2.2, 8] }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          shadows
        >
          <Scene
            keys={keys}
            stick={stick}
            activeId={activeId}
            onCheckpoint={onCheckpoint}
            onMoved={onMoved}
          />
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
