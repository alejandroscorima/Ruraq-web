import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  Center,
  ContactShadows,
  Environment,
  OrbitControls,
  Resize,
  useGLTF,
} from '@react-three/drei'
import * as THREE from 'three'

const MODEL_URL = '/models/ruraq.glb?v=stl1'

function RobotModel() {
  const { scene } = useGLTF(MODEL_URL)

  const model = useMemo(() => {
    const clone = scene.clone(true)
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#3a4048'),
      metalness: 0.55,
      roughness: 0.35,
      envMapIntensity: 0.85,
      flatShading: false,
      side: THREE.DoubleSide,
    })
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.material = material
        // Recalculate normals for clean lighting from STL
        if (mesh.geometry && !mesh.geometry.getAttribute('normal')) {
          mesh.geometry.computeVertexNormals()
        } else if (mesh.geometry) {
          mesh.geometry.computeVertexNormals()
        }
      }
    })
    return clone
  }, [scene])

  // Fusion/STL usa Z-up; Three.js usa Y-up → rotar -90° en X para dejarlo de pie
  return (
    <Center>
      <Resize max={2.9}>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <primitive object={model} />
        </group>
      </Resize>
    </Center>
  )
}

function LoaderFallback() {
  return (
    <mesh>
      <boxGeometry args={[1.1, 2.1, 1.1]} />
      <meshStandardMaterial color="#3a4048" wireframe transparent opacity={0.35} />
    </mesh>
  )
}

type RobotViewerProps = {
  className?: string
}

export default function RobotViewer({ className = '' }: RobotViewerProps) {
  return (
    <div className={`relative h-full w-full ${className}`}>
      <Canvas
        camera={{ position: [1.2, 0.6, 1.55], fov: 32 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 7, 4]} intensity={1.45} />
        <directionalLight position={[-4, 2, -3]} intensity={0.35} color="#9eb6ff" />
        <spotLight position={[0, 6, 2]} intensity={0.5} angle={0.45} penumbra={0.8} />
        <Suspense fallback={<LoaderFallback />}>
          <RobotModel />
          <ContactShadows
            position={[0, -1.45, 0]}
            opacity={0.5}
            scale={10}
            blur={2.8}
            far={4}
          />
          <Environment preset="warehouse" environmentIntensity={0.3} />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.55}
          minDistance={1.1}
          maxDistance={5.5}
          minPolarAngle={0.45}
          maxPolarAngle={Math.PI / 1.85}
          target={[0, 0.1, 0]}
        />
      </Canvas>
    </div>
  )
}

useGLTF.preload(MODEL_URL)
