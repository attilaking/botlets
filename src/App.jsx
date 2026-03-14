import React, { useEffect, useRef, Suspense } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Sky } from '@react-three/drei'
import * as THREE from 'three'
import WorldRenderer from './world/ChunkManager'
import BotManager from './bots/BotManager'
import { TopBar, BotSidebar, ChatPanel, MissionPanel, ToastContainer, LoadingScreen, NavigatorPad } from './ui/UIComponents'
import { startMissionEngine, stopMissionEngine } from './ai/MissionEngine'
import useUIStore from './stores/uiStore'
import useBotStore from './stores/botStore'
import { WORLD_SIZE, WORLD_DEPTH } from './stores/worldStore'

function Ground() {
  return (
    <group>
      {/* Green grass — extends well beyond the pub */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[WORLD_SIZE / 2, -0.12, WORLD_DEPTH / 2]} receiveShadow>
        <planeGeometry args={[150, 150]} />
        <meshLambertMaterial color="#4caf50" />
      </mesh>
      {/* Grey footpath around pub perimeter */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[WORLD_SIZE / 2, -0.09, WORLD_DEPTH / 2]} receiveShadow>
        <planeGeometry args={[WORLD_SIZE + 6, WORLD_DEPTH + 6]} />
        <meshLambertMaterial color="#9e9e9e" />
      </mesh>
    </group>
  )
}

function Environment() {
  return (
    <>
      <Sky sunPosition={[-100, 10, -100]} turbidity={10} rayleigh={0.2} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[30, 60, 30]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={120}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-10}
      />
      <hemisphereLight skyColor="#1a1a2e" groundColor="#2c2c2c" intensity={0.3} />
      {/* Interior lighting */}
      <pointLight position={[WORLD_SIZE / 2, 5, WORLD_DEPTH / 2]} intensity={0.6} color="#ffab40" distance={50} />
      <pointLight position={[8, 4, 5]} intensity={0.5} color="#e040fb" distance={20} />
      <pointLight position={[30, 4, 5]} intensity={0.4} color="#ff8f00" distance={25} />
    </>
  )
}

// Camera controller — camera-relative nav pad movement
function CameraController({ controlsRef }) {
  const selectedBotId = useBotStore(s => s.selectedBotId)
  const bots = useBotStore(s => s.bots)
  const cameraMove = useUIStore(s => s.cameraMove)
  const cameraZoom = useUIStore(s => s.cameraZoom)
  const cameraRotate = useUIStore(s => s.cameraRotate)
  const { camera } = useThree()
  const prevSelectedRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const animStartTime = useRef(0)
  const animStartPos = useRef(new THREE.Vector3())
  const animStartTarget = useRef(new THREE.Vector3())
  const animEndPos = useRef(new THREE.Vector3())
  const animEndTarget = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    if (!controlsRef.current) return

    // Manual zoom via buttons
    if (cameraZoom !== 0) {
      const dir = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target).normalize()
      const zoomSpeed = 15 * delta * -cameraZoom
      camera.position.addScaledVector(dir, zoomSpeed)
      controlsRef.current.update()
    }

    // Manual rotate via buttons — smooth orbit
    if (cameraRotate !== 0) {
      const rotSpeed = 0.6 * delta * cameraRotate
      const target = controlsRef.current.target
      const offset = new THREE.Vector3().subVectors(camera.position, target)
      const angle = Math.atan2(offset.x, offset.z) + rotSpeed
      const radius = Math.sqrt(offset.x * offset.x + offset.z * offset.z)
      camera.position.x = target.x + Math.sin(angle) * radius
      camera.position.z = target.z + Math.cos(angle) * radius
      camera.lookAt(target)
      controlsRef.current.update()
    }

    // Camera-relative navigation pad movement
    if (cameraMove) {
      const speed = 25 * delta
      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      
      const right = new THREE.Vector3()
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

      const moveX = cameraMove.x * right.x + (-cameraMove.z) * forward.x
      const moveZ = cameraMove.x * right.z + (-cameraMove.z) * forward.z

      const target = controlsRef.current.target
      target.x += moveX * speed
      target.z += moveZ * speed
      camera.position.x += moveX * speed
      camera.position.z += moveZ * speed
      return
    }

    // Smooth camera animation to selected bot
    if (selectedBotId !== prevSelectedRef.current) {
      prevSelectedRef.current = selectedBotId
      if (selectedBotId) {
        const bot = bots.find(b => b.id === selectedBotId)
        if (bot) {
          isAnimatingRef.current = true
          animStartTime.current = state.clock.elapsedTime
          animStartPos.current.copy(camera.position)
          animStartTarget.current.copy(controlsRef.current.target)
          animEndTarget.current.set(bot.position[0], 1, bot.position[2])
          animEndPos.current.set(bot.position[0] + 10, 12, bot.position[2] + 10)
        }
      } else {
        isAnimatingRef.current = false
      }
    }

    if (isAnimatingRef.current) {
      const elapsed = state.clock.elapsedTime - animStartTime.current
      let t = Math.min(elapsed / 1.0, 1.0)
      t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      camera.position.lerpVectors(animStartPos.current, animEndPos.current, t)
      controlsRef.current.target.lerpVectors(animStartTarget.current, animEndTarget.current, t)
      if (t >= 1.0) isAnimatingRef.current = false
    }
  })

  return null
}

export default function App() {
  const setLoading = useUIStore(s => s.setLoading)
  const controlsRef = useRef()

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
      startMissionEngine()
    }, 1500)
    return () => { clearTimeout(timer); stopMissionEngine() }
  }, [])

  const cx = WORLD_SIZE / 2
  const cz = WORLD_DEPTH / 2

  return (
    <div className="app-container">
      <LoadingScreen />
      <div className="canvas-container">
        <Canvas
          shadows
          camera={{ position: [cx + 35, 45, cz + 35], fov: 50, near: 0.1, far: 400 }}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
        >
          <Suspense fallback={null}>
            <Environment />
            <Ground />
            <WorldRenderer />
            <BotManager />
          </Suspense>
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            panSpeed={1.5}
            zoomSpeed={1.2}
            minDistance={5}
            maxDistance={80}
            maxPolarAngle={Math.PI / 2.3}
            minPolarAngle={0.15}
            target={[cx, 0, cz]}
          />
          <CameraController controlsRef={controlsRef} />
        </Canvas>
      </div>
      <TopBar />
      <BotSidebar />
      <ChatPanel />
      <MissionPanel />
      <ToastContainer />
      <NavigatorPad />
    </div>
  )
}
