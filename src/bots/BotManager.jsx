import React, { useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import useBotStore from '../stores/botStore'
import useWorldStore, { WORLD_SIZE, WORLD_DEPTH, OUTDOOR_DEPTH } from '../stores/worldStore'

const BOUNDARY_MARGIN = 1

const BotCharacter = memo(function BotCharacter({ bot }) {
  const groupRef = useRef()
  const bodyRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
  const walkTimeRef = useRef(0)
  const stuckCountRef = useRef(0)
  const detourFailsRef = useRef(0)
  const talkIndicatorRef = useRef()

  // Jump state
  const jumpRef = useRef({ active: false, velocity: 0, height: 0 })
  
  // Detour state — when blocked, walk a detour direction temporarily
  const detourRef = useRef({ active: false, dirX: 0, dirZ: 0, stepsLeft: 0, originalTarget: null })
  // Movement timeout — give up if can't reach target in time
  const moveTimerRef = useRef(0)
  const lastTargetRef = useRef(null)
  const closestDistRef = useRef(Infinity)

  const updateBotPosition = useBotStore(s => s.updateBotPosition)
  const setBotRotation = useBotStore(s => s.setBotRotation)
  const setBotTarget = useBotStore(s => s.setBotTarget)
  const stopBot = useBotStore(s => s.stopBot)
  const selectBot = useBotStore(s => s.selectBot)
  const selectedBotId = useBotStore(s => s.selectedBotId)
  const isWalkable = useWorldStore(s => s.isWalkable)
  const getHeightAt = useWorldStore(s => s.getHeightAt)

  const isSelected = selectedBotId === bot.id

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const pos = bot.position
    const target = bot.targetPosition
    const jump = jumpRef.current
    const detour = detourRef.current

    // Jump physics
    if (jump.active) {
      jump.velocity -= 20 * delta
      jump.height += jump.velocity * delta
      if (jump.height <= 0) {
        jump.height = 0
        jump.active = false
        jump.velocity = 0
      }
    }

    // Animate talking indicator
    if (talkIndicatorRef.current) {
      talkIndicatorRef.current.rotation.y += delta * 3
    }

    if (target && bot.isMoving && bot.state !== 'talking') {
      // Track movement time — reset when target changes
      if (lastTargetRef.current !== target) {
        lastTargetRef.current = target
        moveTimerRef.current = 0
        closestDistRef.current = Infinity
        stuckCountRef.current = 0
        detourFailsRef.current = 0
        detour.active = false
      }
      moveTimerRef.current += delta

      // Give up after 4 seconds of trying to reach any target
      if (moveTimerRef.current > 4) {
        stopBot(bot.id)
        stuckCountRef.current = 0
        detourFailsRef.current = 0
        detour.active = false
        moveTimerRef.current = 0
        return
      }

      const speed = bot.moveSpeed * delta

      let moveX, moveZ

      if (detour.active && detour.stepsLeft > 0) {
        // Follow detour direction
        moveX = detour.dirX * speed
        moveZ = detour.dirZ * speed
        detour.stepsLeft--
        if (detour.stepsLeft <= 0) {
          detour.active = false
        }
      } else {
        // Move toward target
        const dx = target[0] - pos[0]
        const dz = target[2] - pos[2]
        const dist = Math.sqrt(dx * dx + dz * dz)

        // Track closest distance for progress detection
        if (dist < closestDistRef.current) {
          closestDistRef.current = dist
        }

        if (dist < 0.8) {
          stopBot(bot.id)
          stuckCountRef.current = 0
          detourFailsRef.current = 0
          detour.active = false
          moveTimerRef.current = 0
          groupRef.current.position.set(pos[0], pos[1] + jump.height, pos[2])
          groupRef.current.rotation.y = bot.rotation
          return
        }

        moveX = (dx / dist) * speed
        moveZ = (dz / dist) * speed
      }

      const nx = Math.max(BOUNDARY_MARGIN, Math.min(WORLD_SIZE - BOUNDARY_MARGIN, pos[0] + moveX))
      const nz = Math.max(BOUNDARY_MARGIN, Math.min(OUTDOOR_DEPTH - BOUNDARY_MARGIN, pos[2] + moveZ))

      if (isWalkable(nx, nz)) {
        const ny = getHeightAt(nx, nz) + 1
        setBotRotation(bot.id, Math.atan2(moveX, moveZ))
        updateBotPosition(bot.id, [nx, ny, nz])
        stuckCountRef.current = 0
      } else {
        stuckCountRef.current++

        // SCAN 360° for a clear direction
        if (stuckCountRef.current > 1) {
          const baseAngle = Math.atan2(moveZ, moveX)
          let foundClear = false
          
          // Progressive scan: try further out on each failure
          const scanRadius = speed * (6 + detourFailsRef.current * 4)
          
          // Try 24 directions around 360° 
          for (let i = 1; i <= 24; i++) {
            const angle = baseAngle + (Math.PI / 12) * i * (i % 2 === 0 ? 1 : -1)
            const testX = pos[0] + Math.cos(angle) * scanRadius
            const testZ = pos[2] + Math.sin(angle) * scanRadius
            const clampedX = Math.max(BOUNDARY_MARGIN, Math.min(WORLD_SIZE - BOUNDARY_MARGIN, testX))
            const clampedZ = Math.max(BOUNDARY_MARGIN, Math.min(OUTDOOR_DEPTH - BOUNDARY_MARGIN, testZ))

            if (isWalkable(clampedX, clampedZ)) {
              detour.active = true
              detour.dirX = Math.cos(angle)
              detour.dirZ = Math.sin(angle)
              detour.stepsLeft = 20 + detourFailsRef.current * 5
              stuckCountRef.current = 0
              foundClear = true
              break
            }
          }

          if (!foundClear) {
            detourFailsRef.current++
          }

          // If stuck too long or too many failed detours, teleport and give up
          if (!foundClear || stuckCountRef.current > 5 || detourFailsRef.current > 3) {
            stuckCountRef.current = 0
            detourFailsRef.current = 0
            detour.active = false
            const newTarget = findNearbyWalkable(pos[0], pos[2])
            if (newTarget) {
              updateBotPosition(bot.id, [newTarget.x, 1, newTarget.z])
            }
            stopBot(bot.id)
          }
        }
      }

      // Walk animation
      walkTimeRef.current += delta * 8
      const swing = Math.sin(walkTimeRef.current) * 0.6
      if (leftArmRef.current) leftArmRef.current.rotation.x = swing
      if (rightArmRef.current) rightArmRef.current.rotation.x = -swing
      if (leftLegRef.current) leftLegRef.current.rotation.x = -swing
      if (rightLegRef.current) rightLegRef.current.rotation.x = swing
    } else {
      // Idle bob
      walkTimeRef.current += delta * 1.5
      const bob = Math.sin(walkTimeRef.current) * 0.03
      if (bodyRef.current) bodyRef.current.position.y = bob
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.9
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.9
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.9
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.9

      // Talking animation — bob more energetically
      if (bot.state === 'talking') {
        const talkBob = Math.sin(walkTimeRef.current * 4) * 0.05
        if (bodyRef.current) bodyRef.current.position.y = talkBob
      }
    }

    groupRef.current.position.set(pos[0], pos[1] + jump.height, pos[2])
    groupRef.current.rotation.y = bot.rotation
  })

  function findNearbyWalkable(x, z) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const range = 5 + attempt * 2
      const testX = x + (Math.random() - 0.5) * range
      const testZ = z + (Math.random() - 0.5) * range
      const cx = Math.max(BOUNDARY_MARGIN, Math.min(WORLD_SIZE - BOUNDARY_MARGIN, testX))
      const cz = Math.max(BOUNDARY_MARGIN, Math.min(WORLD_DEPTH - BOUNDARY_MARGIN, testZ))
      if (isWalkable(cx, cz)) return { x: cx, z: cz }
    }
    return null
  }

  const handleClick = (e) => {
    e.stopPropagation()
    selectBot(bot.id)
  }

  return (
    <group ref={groupRef} onClick={handleClick} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'default'}>
      <group ref={bodyRef}>
        {/* Selection ring */}
        {isSelected && (
          <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.7, 0.9, 24]} />
            <meshBasicMaterial color="#7c5cfc" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Beacon — soft glowing pillar */}
        <group>
          <mesh position={[0, 5.5, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 7, 8]} />
            <meshBasicMaterial color={bot.color} transparent opacity={0.4} />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshLambertMaterial color={bot.color} emissive={bot.color} emissiveIntensity={0.6} />
          </mesh>
        </group>

        {/* === MINION BODY — pill/capsule shape === */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <capsuleGeometry args={[0.4, 0.8, 12, 16]} />
          <meshLambertMaterial color={bot.color} />
        </mesh>

        {/* === OVERALLS — blue lower body === */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <capsuleGeometry args={[0.41, 0.15, 12, 16]} />
          <meshLambertMaterial color="#1565c0" />
        </mesh>
        {/* Overall front pocket */}
        <mesh position={[0, 0.55, 0.38]}>
          <boxGeometry args={[0.22, 0.18, 0.02]} />
          <meshLambertMaterial color="#0d47a1" />
        </mesh>
        {/* Straps */}
        <mesh position={[-0.15, 0.9, 0.35]} rotation={[0.3, 0, 0.15]}>
          <boxGeometry args={[0.06, 0.5, 0.02]} />
          <meshLambertMaterial color="#1565c0" />
        </mesh>
        <mesh position={[0.15, 0.9, 0.35]} rotation={[0.3, 0, -0.15]}>
          <boxGeometry args={[0.06, 0.5, 0.02]} />
          <meshLambertMaterial color="#1565c0" />
        </mesh>

        {/* === GOGGLE STRAP — silver band around head === */}
        <mesh position={[0, 1.15, 0]}>
          <torusGeometry args={[0.38, 0.03, 8, 24]} />
          <meshLambertMaterial color="#888" />
        </mesh>

        {/* === FACE — big googly eyes with goggles === */}
        {/* Left eye — goggle rim */}
        <group position={[-0.15, 1.15, 0.3]}>
          <mesh><cylinderGeometry args={[0.16, 0.16, 0.08, 16]} /><meshLambertMaterial color="#777" /></mesh>
          {/* Eyeball */}
          <mesh position={[0, 0, 0.04]}><sphereGeometry args={[0.14, 14, 14]} /><meshLambertMaterial color="#fff" /></mesh>
          {/* Pupil — looking slightly right-up */}
          <mesh position={[0.04, 0.03, 0.13]}><sphereGeometry args={[0.055, 8, 8]} /><meshBasicMaterial color="#111" /></mesh>
          {/* Pupil highlight */}
          <mesh position={[0.06, 0.05, 0.145]}><sphereGeometry args={[0.02, 6, 6]} /><meshBasicMaterial color="#fff" /></mesh>
        </group>

        {/* Right eye — slightly bigger goggle */}
        <group position={[0.15, 1.18, 0.3]}>
          <mesh><cylinderGeometry args={[0.18, 0.18, 0.08, 16]} /><meshLambertMaterial color="#777" /></mesh>
          {/* Eyeball */}
          <mesh position={[0, 0, 0.04]}><sphereGeometry args={[0.16, 14, 14]} /><meshLambertMaterial color="#fff" /></mesh>
          {/* Pupil — looking slightly left-down for comedic asymmetry */}
          <mesh position={[-0.04, -0.02, 0.145]}><sphereGeometry args={[0.06, 8, 8]} /><meshBasicMaterial color="#111" /></mesh>
          {/* Pupil highlight */}
          <mesh position={[-0.02, 0.01, 0.165]}><sphereGeometry args={[0.02, 6, 6]} /><meshBasicMaterial color="#fff" /></mesh>
        </group>

        {/* Mouth — cute smile / open when talking */}
        <mesh position={[0, 0.92, 0.41]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.06, 0.015, 8, 12, Math.PI]} />
          <meshBasicMaterial color={bot.isTalking ? '#ff6b6b' : '#444'} />
        </mesh>
        {bot.isTalking && (
          <mesh position={[0, 0.9, 0.4]}>
            <sphereGeometry args={[0.06, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshBasicMaterial color="#e53935" />
          </mesh>
        )}

        {/* Blush cheeks */}
        <mesh position={[-0.28, 1.02, 0.3]} rotation={[0, 0.4, 0]}>
          <circleGeometry args={[0.06, 10]} />
          <meshBasicMaterial color="#ffaaaa" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.28, 1.02, 0.3]} rotation={[0, -0.4, 0]}>
          <circleGeometry args={[0.06, 10]} />
          <meshBasicMaterial color="#ffaaaa" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>

        {/* === HAIR SPROUT on top === */}
        <mesh position={[0, 1.65, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 6]} />
          <meshLambertMaterial color="#333" />
        </mesh>
        <mesh position={[-0.04, 1.63, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.012, 0.012, 0.15, 6]} />
          <meshLambertMaterial color="#333" />
        </mesh>
        <mesh position={[0.04, 1.62, 0]} rotation={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.012, 0.012, 0.12, 6]} />
          <meshLambertMaterial color="#333" />
        </mesh>

        {/* === TALKING INDICATOR === */}
        {bot.state === 'talking' && (
          <group>
            <Html position={[0.5, 2.4, 0]} center distanceFactor={15}>
              <div style={{ fontSize: '20px', animation: 'pulse 0.6s ease-in-out infinite', userSelect: 'none' }}>💬</div>
            </Html>
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.6, 0.8, 16]} />
              <meshBasicMaterial color="#ffd54f" transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )}

        {/* === ARMS — tiny stubby capsules === */}
        <group ref={leftArmRef} position={[-0.45, 0.95, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.2, 8, 8]} />
            <meshLambertMaterial color={bot.color} />
          </mesh>
          {/* Mitten hand */}
          <mesh position={[0, -0.38, 0]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshLambertMaterial color={bot.skinColor} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.45, 0.95, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.2, 8, 8]} />
            <meshLambertMaterial color={bot.color} />
          </mesh>
          {/* Mitten hand */}
          <mesh position={[0, -0.38, 0]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshLambertMaterial color={bot.skinColor} />
          </mesh>
        </group>

        {/* === LEGS — short stubby with round shoes === */}
        <group ref={leftLegRef} position={[-0.15, 0.15, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.1, 6, 8]} />
            <meshLambertMaterial color="#1565c0" />
          </mesh>
          {/* Round shoe */}
          <mesh position={[0, -0.28, 0.04]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshLambertMaterial color="#2c2c2c" />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.15, 0.15, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.1, 6, 8]} />
            <meshLambertMaterial color="#1565c0" />
          </mesh>
          {/* Round shoe */}
          <mesh position={[0, -0.28, 0.04]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshLambertMaterial color="#2c2c2c" />
          </mesh>
        </group>

        {/* Name label */}
        <Html position={[0, 2.2, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 600, whiteSpace: 'nowrap', userSelect: 'none', backdropFilter: 'blur(4px)' }}>
            {bot.emoji} {bot.name}
          </div>
        </Html>

        {/* Talking indicator — bouncing dots */}
        {bot.isTalking && (
          <group ref={talkIndicatorRef} position={[0, 2.5, 0]}>
            <mesh position={[0.18, 0, 0]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshBasicMaterial color="#fff" />
            </mesh>
            <mesh position={[-0.09, 0, 0.15]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshBasicMaterial color="#ddd" />
            </mesh>
            <mesh position={[-0.09, 0, -0.15]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshBasicMaterial color="#bbb" />
            </mesh>
          </group>
        )}
      </group>
    </group>
  )
})

export default function BotManager() {
  const bots = useBotStore(s => s.bots)
  return (
    <group>
      {bots.map(bot => <BotCharacter key={bot.id} bot={bot} />)}
    </group>
  )
}
