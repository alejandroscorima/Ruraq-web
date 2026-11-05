import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Center,
  ContactShadows,
  Environment,
  OrbitControls,
  Resize,
  useGLTF,
} from '@react-three/drei'
import * as THREE from 'three'
import { useViewerActive } from '../hooks/useViewerActive'
import { useViewerQuality, type ViewerQualitySettings } from '../hooks/useViewerQuality'
import { ROBOT_MODEL_URL } from '../lib/model'

const ViewerPostEffects = lazy(() => import('./ViewerPostEffects'))

const MODEL_URL = ROBOT_MODEL_URL
const AUTO_ROTATE_SPEED = 0.42
const DRAG_SENSITIVITY = 0.007
const RESUME_DELAY_MS = 2000

type TurntableRefs = {
  yaw: React.MutableRefObject<number>
  dragging: React.MutableRefObject<boolean>
  lastX: React.MutableRefObject<number>
  autoPaused: React.MutableRefObject<boolean>
}

function useRobotModel() {
  const { scene } = useGLTF(MODEL_URL)

  return useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        // Conservar materiales/colores del GLB (Fusion → Blender).
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

function TurntableModel({ refs }: { refs: TurntableRefs }) {
  const model = useRobotModel()
  const turntableRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!refs.dragging.current && !refs.autoPaused.current) {
      refs.yaw.current += delta * AUTO_ROTATE_SPEED
    }
    if (turntableRef.current) {
      turntableRef.current.rotation.y = refs.yaw.current
    }
  })

  // Blender exporta +Y Up: sin rotación -90° (esa era para STL/Z-up).
  return (
    <Center>
      <Resize>
        <group scale={2.9}>
          <group ref={turntableRef}>
            <primitive object={model} />
          </group>
        </group>
      </Resize>
    </Center>
  )
}

function MuseumLighting({ flickerLights }: { flickerLights: boolean }) {
  const spotRef = useRef<THREE.SpotLight>(null)
  const rimRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (!flickerLights) return
    const t = clock.elapsedTime
    if (rimRef.current) {
      rimRef.current.intensity = 9 + Math.sin(t * 2.2) * 1.2
    }
    if (spotRef.current) {
      spotRef.current.intensity = 11 + Math.sin(t * 1.4 + 1) * 0.8
    }
  })

  return (
    <>
      <ambientLight intensity={0.22} />
      <spotLight
        ref={spotRef}
        position={[0, 4.2, 1.2]}
        angle={0.42}
        penumbra={0.75}
        intensity={11}
        distance={18}
        color="#fff6ea"
      />
      <pointLight
        position={[-2.4, 2.2, 2.2]}
        intensity={4.5}
        distance={7}
        decay={2}
        color="#6a8fd4"
      />
      <pointLight
        ref={rimRef}
        position={[1.6, 1.4, 1.8]}
        intensity={9}
        distance={5}
        decay={1.6}
        color="#fff8ee"
      />
    </>
  )
}

function SceneContent({
  refs,
  quality,
  onReady,
}: {
  refs: TurntableRefs
  quality: ViewerQualitySettings
  onReady: () => void
}) {
  useLayoutEffect(() => {
    onReady()
  }, [onReady])

  return (
    <>
      <MuseumLighting flickerLights={quality.flickerLights} />
      <TurntableModel refs={refs} />
      <ContactShadows
        position={[0, -1.45, 0]}
        opacity={0.7}
        scale={14}
        blur={quality.contactShadowBlur}
        far={5}
        resolution={quality.contactShadowResolution}
        color="#000000"
      />
      {quality.environment && (
        <Environment
          preset="studio"
          resolution={quality.environmentResolution}
          environmentIntensity={0.5}
        />
      )}
    </>
  )
}

function PointerTurntable({
  refs,
  onDraggingChange,
}: {
  refs: TurntableRefs
  onDraggingChange: (dragging: boolean) => void
}) {
  const { gl } = useThree()
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const armed = useRef(false)

  const clearResumeTimer = useCallback(() => {
    if (resumeTimer.current) {
      clearTimeout(resumeTimer.current)
      resumeTimer.current = null
    }
  }, [])

  const pauseAutoRotate = useCallback(() => {
    refs.autoPaused.current = true
    clearResumeTimer()
  }, [clearResumeTimer, refs])

  const scheduleResume = useCallback(() => {
    clearResumeTimer()
    resumeTimer.current = setTimeout(() => {
      refs.autoPaused.current = false
    }, RESUME_DELAY_MS)
  }, [clearResumeTimer, refs])

  useEffect(() => {
    const canvas = gl.domElement

    const onPointerDown = (event: PointerEvent) => {
      start.current = { x: event.clientX, y: event.clientY }
      armed.current = false
      refs.lastX.current = event.clientX
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!start.current) return
      const dx = event.clientX - start.current.x
      const dy = event.clientY - start.current.y
      // Solo girar si el gesto es claramente horizontal → deja pasar el scroll vertical
      if (!armed.current) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.15) {
          start.current = null
          return
        }
        if (Math.abs(dx) < 8) return
        armed.current = true
        refs.dragging.current = true
        onDraggingChange(true)
        pauseAutoRotate()
      }
      const deltaX = event.clientX - refs.lastX.current
      refs.lastX.current = event.clientX
      refs.yaw.current += deltaX * DRAG_SENSITIVITY
    }

    const onPointerUp = () => {
      start.current = null
      if (!refs.dragging.current) return
      refs.dragging.current = false
      armed.current = false
      onDraggingChange(false)
      scheduleResume()
    }

    canvas.style.touchAction = 'pan-y'
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      clearResumeTimer()
    }
  }, [gl, refs, onDraggingChange, pauseAutoRotate, scheduleResume, clearResumeTimer])

  return null
}

function LoaderFallback() {
  return (
    <mesh>
      <boxGeometry args={[1.1, 2.1, 1.1]} />
      <meshStandardMaterial color="#3a4048" wireframe transparent opacity={0.22} />
    </mesh>
  )
}

function Preloader({
  show,
  loaded,
  onHidden,
}: {
  show: boolean
  loaded: boolean
  onHidden: () => void
}) {
  if (!show) return null

  return (
    <div
      className={`viewer-preloader ${loaded ? 'viewer-preloader--hide' : ''}`}
      onTransitionEnd={(event) => {
        if (loaded && event.propertyName === 'opacity') onHidden()
      }}
    >
      <div className="viewer-preloader__rings" aria-hidden="true">
        <span className="viewer-preloader__ring viewer-preloader__ring--outer" />
        <span className="viewer-preloader__ring viewer-preloader__ring--middle" />
        <span className="viewer-preloader__ring viewer-preloader__ring--inner" />
      </div>
      <p className="viewer-preloader__text">Espera mientras carga el modelo…</p>
    </div>
  )
}

type RobotViewerProps = {
  className?: string
  fillScreen?: boolean
}

export default function RobotViewer({ className = '', fillScreen = true }: RobotViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const quality = useViewerQuality()
  const isActive = useViewerActive(containerRef)
  const [loaded, setLoaded] = useState(false)
  const [showPreloader, setShowPreloader] = useState(true)
  const [dragging, setDragging] = useState(false)

  const refs: TurntableRefs = {
    yaw: useRef(0),
    dragging: useRef(false),
    lastX: useRef(0),
    autoPaused: useRef(false),
  }

  const handleReady = useCallback(() => setLoaded(true), [])
  const handleDraggingChange = useCallback((value: boolean) => setDragging(value), [])

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${fillScreen ? 'min-h-full' : ''} ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: `
            radial-gradient(ellipse 72% 58% at 50% 40%, rgba(201,168,108,0.12), transparent 72%),
            radial-gradient(ellipse 40% 30% at 80% 20%, rgba(106,143,212,0.08), transparent 60%),
            linear-gradient(180deg, transparent 50%, rgba(8,10,12,0.65) 100%)
          `,
          boxShadow: quality.bloom ? undefined : 'inset 0 0 120px rgba(0,0,0,0.45)',
        }}
      />

      <Preloader
        show={showPreloader}
        loaded={loaded}
        onHidden={() => setShowPreloader(false)}
      />

      <Canvas
        className={dragging ? 'cursor-grabbing' : 'cursor-grab'}
        frameloop={isActive ? 'always' : 'never'}
        performance={{ min: 0.6, max: 1, debounce: 200 }}
        camera={{ position: [2.1, 0.85, 2.4], fov: 30 }}
        dpr={[1, quality.maxDpr]}
        gl={{
          antialias: quality.antialias,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.12,
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
        }}
      >
        <Suspense fallback={<LoaderFallback />}>
          <SceneContent refs={refs} quality={quality} onReady={handleReady} />
        </Suspense>
        <PointerTurntable refs={refs} onDraggingChange={handleDraggingChange} />
        <OrbitControls
          makeDefault
          enableRotate={false}
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.06}
          minDistance={1.35}
          maxDistance={5.2}
          target={[0, 0.08, 0]}
        />
        {quality.bloom && (
          <Suspense fallback={null}>
            <ViewerPostEffects multisampling={quality.effectMultisampling} />
          </Suspense>
        )}
      </Canvas>
    </div>
  )
}

useGLTF.preload(MODEL_URL)
