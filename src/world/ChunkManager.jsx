import React, { useEffect, useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useWorldStore, { WORLD_SIZE, WORLD_DEPTH } from '../stores/worldStore'
import { Html } from '@react-three/drei'

// ==========================================
// Floor
// ==========================================
const Floor = memo(function Floor() {
  return (
    <group>
      {/* Main pub floor — dark wood */}
      <mesh position={[WORLD_SIZE / 2, -0.05, WORLD_DEPTH / 2]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WORLD_SIZE, WORLD_DEPTH]} />
        <meshLambertMaterial color="#8d6e51" />
      </mesh>
      {/* Dance floor — checkerboard-ish */}
      <mesh position={[10, -0.03, 12]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshLambertMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[10, -0.02, 12]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 5]} />
        <meshLambertMaterial color="#2c2c54" />
      </mesh>
      {/* Stage floor — raised */}
      <mesh position={[8, 0.35, 5]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 5]} />
        <meshLambertMaterial color="#1a1a1a" />
      </mesh>
      {/* Bar floor area */}
      <mesh position={[30, -0.03, 5]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 8]} />
        <meshLambertMaterial color="#6d4c3a" />
      </mesh>
      {/* Outside sidewalk */}
      <mesh position={[22, -0.06, 42]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 4]} />
        <meshLambertMaterial color="#78909c" />
      </mesh>
    </group>
  )
})

// ==========================================
// Walls
const Walls = memo(function Walls() {
  const wallH = 6
  const brickWall = '#5d3a28'
  const winY = 3.2  // window center Y
  const winH = 2.2  // window height
  const winBot = winY - winH / 2  // 2.1
  const winTop = winY + winH / 2  // 4.3

  // Helper: creates wall segments with window gaps along X axis (for back/front walls)
  function wallWithWindowsX(z, windowXs, totalStart, totalEnd, thick = 0.4, zOffset = 0) {
    const segments = []
    // Bottom strip (below windows)
    segments.push(<mesh key="bot" position={[(totalStart + totalEnd) / 2, winBot / 2, z]}><boxGeometry args={[totalEnd - totalStart, winBot, thick]} /><meshLambertMaterial color={brickWall} /></mesh>)
    // Top strip (above windows)
    const topH = wallH - winTop
    segments.push(<mesh key="top" position={[(totalStart + totalEnd) / 2, winTop + topH / 2, z]}><boxGeometry args={[totalEnd - totalStart, topH, thick]} /><meshLambertMaterial color={brickWall} /></mesh>)
    // Pillars between windows
    let prev = totalStart
    windowXs.forEach((wx, i) => {
      const pillarW = (wx - 1.1) - prev
      if (pillarW > 0.1) {
        segments.push(<mesh key={`p${i}`} position={[prev + pillarW / 2, winY, z]}><boxGeometry args={[pillarW, winH, thick]} /><meshLambertMaterial color={brickWall} /></mesh>)
      }
      prev = wx + 1.1
      // Glass pane
      segments.push(
        <group key={`w${i}`} position={[wx, winY, z + zOffset]}>
          <mesh><boxGeometry args={[2, winH - 0.2, 0.05]} /><meshBasicMaterial color="#87ceeb" transparent opacity={0.25} side={THREE.DoubleSide} /></mesh>
          <mesh><boxGeometry args={[2, 0.06, 0.06]} /><meshLambertMaterial color="#4e342e" /></mesh>
          <mesh><boxGeometry args={[0.06, winH - 0.2, 0.06]} /><meshLambertMaterial color="#4e342e" /></mesh>
        </group>
      )
    })
    // Last pillar
    const lastPillarW = totalEnd - prev
    if (lastPillarW > 0.1) {
      segments.push(<mesh key="plast" position={[prev + lastPillarW / 2, winY, z]}><boxGeometry args={[lastPillarW, winH, thick]} /><meshLambertMaterial color={brickWall} /></mesh>)
    }
    return segments
  }

  // Helper: wall with windows along Z axis (for left/right walls)
  function wallWithWindowsZ(x, windowZs, totalStart, totalEnd, thick = 0.4) {
    const segments = []
    segments.push(<mesh key="bot" position={[x, winBot / 2, (totalStart + totalEnd) / 2]}><boxGeometry args={[thick, winBot, totalEnd - totalStart]} /><meshLambertMaterial color={brickWall} /></mesh>)
    const topH = wallH - winTop
    segments.push(<mesh key="top" position={[x, winTop + topH / 2, (totalStart + totalEnd) / 2]}><boxGeometry args={[thick, topH, totalEnd - totalStart]} /><meshLambertMaterial color={brickWall} /></mesh>)
    let prev = totalStart
    windowZs.forEach((wz, i) => {
      const pillarW = (wz - 1.1) - prev
      if (pillarW > 0.1) {
        segments.push(<mesh key={`p${i}`} position={[x, winY, prev + pillarW / 2]}><boxGeometry args={[thick, winH, pillarW]} /><meshLambertMaterial color={brickWall} /></mesh>)
      }
      prev = wz + 1.1
      segments.push(
        <group key={`w${i}`} position={[x, winY, wz]}>
          <mesh><boxGeometry args={[0.05, winH - 0.2, 2]} /><meshBasicMaterial color="#87ceeb" transparent opacity={0.25} side={THREE.DoubleSide} /></mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[2, 0.06, 0.06]} /><meshLambertMaterial color="#4e342e" /></mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[0.06, winH - 0.2, 0.06]} /><meshLambertMaterial color="#4e342e" /></mesh>
        </group>
      )
    })
    const lastPillarW = totalEnd - prev
    if (lastPillarW > 0.1) {
      segments.push(<mesh key="plast" position={[x, winY, prev + lastPillarW / 2]}><boxGeometry args={[thick, winH, lastPillarW]} /><meshLambertMaterial color={brickWall} /></mesh>)
    }
    return segments
  }

  return (
    <group>
      {/* Back wall (z=0) with windows */}
      {wallWithWindowsX(0, [6, 12, 18, 24, 30, 36], 0, WORLD_SIZE)}

      {/* Front wall — left section with windows */}
      {wallWithWindowsX(40, [4, 10], 0, 18)}
      {/* Front wall — right section with windows */}
      {wallWithWindowsX(40, [32, 38], 26, WORLD_SIZE)}
      {/* Entrance beam above door */}
      <mesh position={[22, wallH - 0.5, 40]}><boxGeometry args={[8, 1, 0.5]} /><meshLambertMaterial color="#1a1a1a" /></mesh>

      {/* Left wall (x=0) with windows */}
      {wallWithWindowsZ(0, [8, 16, 24, 32], 0, WORLD_DEPTH)}

      {/* Right wall (x=WORLD_SIZE) with windows */}
      {wallWithWindowsZ(WORLD_SIZE, [8, 16, 24, 32], 0, WORLD_DEPTH)}

      {/* Kitchen divider wall */}
      <mesh position={[41, wallH / 2, 10]}><boxGeometry args={[6, wallH, 0.3]} /><meshLambertMaterial color="#2c1810" /></mesh>
      {/* Kitchen serving hatch in divider */}
      <mesh position={[39, 1.5, 10]}><boxGeometry args={[2, 1.2, 0.35]} /><meshLambertMaterial color="#5d4037" /></mesh>
    </group>
  )
})

// ==========================================
// Kitchen
// ==========================================
const Kitchen = memo(function Kitchen() {
  return (
    <group>
      {/* Kitchen counter */}
      <mesh position={[42, 0.9, 5]} castShadow><boxGeometry args={[4, 0.08, 3]} /><meshLambertMaterial color="#78909c" /></mesh>
      <mesh position={[42, 0.45, 5]}><boxGeometry args={[4, 0.9, 3]} /><meshLambertMaterial color="#455a64" /></mesh>
      {/* Oven */}
      <mesh position={[43.5, 0.6, 3]} castShadow><boxGeometry args={[1.2, 1.2, 1.2]} /><meshLambertMaterial color="#37474f" /></mesh>
      <mesh position={[43.5, 0.6, 3.61]}><boxGeometry args={[0.9, 0.9, 0.02]} /><meshLambertMaterial color="#263238" /></mesh>
      <mesh position={[43.5, 1, 3.61]}><boxGeometry args={[0.3, 0.06, 0.02]} /><meshLambertMaterial color="#f44336" emissive="#f44336" emissiveIntensity={0.3} /></mesh>
      {/* Pot on counter */}
      <mesh position={[41, 1, 5]}><cylinderGeometry args={[0.25, 0.2, 0.3, 8]} /><meshLambertMaterial color="#666" /></mesh>
      <mesh position={[41, 1.2, 5]}><cylinderGeometry args={[0.27, 0.27, 0.03, 8]} /><meshLambertMaterial color="#555" /></mesh>
      {/* Plates stack */}
      {[0, 0.04, 0.08].map((y, i) => (
        <mesh key={i} position={[42.5, 0.96 + y, 5]}><cylinderGeometry args={[0.18, 0.18, 0.03, 8]} /><meshLambertMaterial color="#fff" /></mesh>
      ))}
      {/* Food pickup counter — facing dining area */}
      <mesh position={[39, 1.1, 12]}><boxGeometry args={[2, 0.1, 1.5]} /><meshLambertMaterial color="#5d4037" /></mesh>
      <mesh position={[39, 0.55, 12]}><boxGeometry args={[2, 1, 1.5]} /><meshLambertMaterial color="#3e2723" /></mesh>
      {/* Food items on pickup counter */}
      <mesh position={[38.5, 1.2, 12]}><cylinderGeometry args={[0.15, 0.15, 0.04, 8]} /><meshLambertMaterial color="#fff" /></mesh>
      <mesh position={[38.5, 1.25, 12]}><sphereGeometry args={[0.1, 6, 6]} /><meshLambertMaterial color="#8d6e63" /></mesh>
      <mesh position={[39.5, 1.2, 12]}><cylinderGeometry args={[0.15, 0.15, 0.04, 8]} /><meshLambertMaterial color="#fff" /></mesh>
      <mesh position={[39.5, 1.25, 12]}><sphereGeometry args={[0.1, 6, 6]} /><meshLambertMaterial color="#ff8f00" /></mesh>
    </group>
  )
})

// ==========================================
// Bar
// ==========================================
const Bar = memo(function Bar() {
  return (
    <group>
      {/* Main bar counter */}
      <mesh position={[30, 1.15, 8]} castShadow><boxGeometry args={[20, 0.18, 1.2]} /><meshLambertMaterial color="#4e342e" /></mesh>
      {/* Bar front panel */}
      <mesh position={[30, 0.55, 8.4]} castShadow><boxGeometry args={[20, 1.1, 0.15]} /><meshLambertMaterial color="#3e2723" /></mesh>
      {/* Corner bar piece */}
      <mesh position={[40, 1.15, 6]} castShadow><boxGeometry args={[1.2, 0.18, 4]} /><meshLambertMaterial color="#4e342e" /></mesh>
      {/* Back shelf (bottles display) */}
      <mesh position={[30, 1.2, 2]} castShadow><boxGeometry args={[18, 1.5, 1]} /><meshLambertMaterial color="#1a1a1a" /></mesh>
      <mesh position={[30, 2.5, 1.5]}><boxGeometry args={[18, 0.08, 0.8]} /><meshLambertMaterial color="#5d4037" /></mesh>
      <mesh position={[30, 3.2, 1.5]}><boxGeometry args={[18, 0.08, 0.8]} /><meshLambertMaterial color="#5d4037" /></mesh>
      {/* Bottles (colored blocks) */}
      {[22, 24, 26, 28, 30, 32, 34, 36, 38].map((bx, i) => (
        <group key={i}>
          <mesh position={[bx, 2.2, 1.5]}><boxGeometry args={[0.2, 0.5, 0.2]} /><meshLambertMaterial color={['#c62828', '#1565c0', '#2e7d32', '#f57f17', '#6a1b9a', '#00838f', '#d84315', '#4527a0', '#ad1457'][i]} /></mesh>
          <mesh position={[bx + 0.6, 2.9, 1.5]}><boxGeometry args={[0.2, 0.5, 0.2]} /><meshLambertMaterial color={['#ef5350', '#42a5f5', '#66bb6a', '#ffee58', '#ab47bc', '#26c6da', '#ff7043', '#7e57c2', '#ec407a'][i]} /></mesh>
        </group>
      ))}
      {/* Beer taps */}
      {[25, 28, 31, 34].map((tx, i) => (
        <group key={i} position={[tx, 1.3, 4]}>
          <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.12, 0.8, 0.12]} /><meshLambertMaterial color="#ffd54f" /></mesh>
          <mesh position={[0, 0.95, 0]}><sphereGeometry args={[0.12, 6, 6]} /><meshLambertMaterial color="#ffd54f" /></mesh>
        </group>
      ))}
      {/* Bar stools */}
      {[22, 24, 26, 28, 30, 32, 34, 36, 38].map((sx, i) => (
        <group key={i} position={[sx, 0, 9.5]}>
          <mesh position={[0, 0.85, 0]}><cylinderGeometry args={[0.22, 0.22, 0.06, 8]} /><meshLambertMaterial color="#5d4037" /></mesh>
          <mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.04, 0.04, 0.85, 4]} /><meshLambertMaterial color="#37474f" /></mesh>
          <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.18, 0.18, 0.04, 6]} /><meshLambertMaterial color="#37474f" /></mesh>
        </group>
      ))}
    </group>
  )
})

// ==========================================
// Stage
// ==========================================
const Stage = memo(function Stage() {
  return (
    <group>
      {/* Stage platform */}
      <mesh position={[8, 0.3, 5]} castShadow><boxGeometry args={[12, 0.6, 5]} /><meshLambertMaterial color="#212121" /></mesh>
      {/* Stage front edge highlight */}
      <mesh position={[8, 0.3, 7.3]}><boxGeometry args={[12, 0.6, 0.15]} /><meshLambertMaterial color="#9c27b0" emissive="#7b1fa2" emissiveIntensity={0.3} /></mesh>
      {/* DJ Booth / Deck */}
      <mesh position={[8, 1.1, 4]} castShadow><boxGeometry args={[3, 0.8, 1.5]} /><meshLambertMaterial color="#1a1a1a" /></mesh>
      {/* Turntables */}
      <mesh position={[7.2, 1.55, 4]}><cylinderGeometry args={[0.35, 0.35, 0.05, 12]} /><meshLambertMaterial color="#37474f" /></mesh>
      <mesh position={[8.8, 1.55, 4]}><cylinderGeometry args={[0.35, 0.35, 0.05, 12]} /><meshLambertMaterial color="#37474f" /></mesh>
      {/* Mixer */}
      <mesh position={[8, 1.55, 4]}><boxGeometry args={[0.8, 0.08, 0.5]} /><meshLambertMaterial color="#263238" /></mesh>
      {/* Speakers — stacked */}
      <mesh position={[4, 0.5, 3.5]} castShadow><boxGeometry args={[1.5, 1, 1]} /><meshLambertMaterial color="#1a1a1a" /></mesh>
      <mesh position={[4, 1.3, 3.5]} castShadow><boxGeometry args={[1.5, 0.8, 1]} /><meshLambertMaterial color="#222" /></mesh>
      <mesh position={[4, 0.5, 3.51]}><boxGeometry args={[1.2, 0.8, 0.05]} /><meshLambertMaterial color="#37474f" /></mesh>
      <mesh position={[4, 1.3, 3.51]}><boxGeometry args={[1.0, 0.6, 0.05]} /><meshLambertMaterial color="#37474f" /></mesh>
      <mesh position={[12, 0.5, 3.5]} castShadow><boxGeometry args={[1.5, 1, 1]} /><meshLambertMaterial color="#1a1a1a" /></mesh>
      <mesh position={[12, 1.3, 3.5]} castShadow><boxGeometry args={[1.5, 0.8, 1]} /><meshLambertMaterial color="#222" /></mesh>
      <mesh position={[12, 0.5, 3.51]}><boxGeometry args={[1.2, 0.8, 0.05]} /><meshLambertMaterial color="#37474f" /></mesh>
      <mesh position={[12, 1.3, 3.51]}><boxGeometry args={[1.0, 0.6, 0.05]} /><meshLambertMaterial color="#37474f" /></mesh>
      {/* Microphone stand — center stage front */}
      <group position={[8, 0.6, 6.5]}>
        <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.02, 0.02, 1.6, 6]} /><meshLambertMaterial color="#666" /></mesh>
        <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.03, 8]} /><meshLambertMaterial color="#444" /></mesh>
        <mesh position={[0, 1.6, 0.06]} rotation={[Math.PI / 2, 0, 0]}><capsuleGeometry args={[0.06, 0.1, 8, 6]} /><meshLambertMaterial color="#333" /></mesh>
        <mesh position={[0, 1.6, 0.06]} rotation={[Math.PI / 2, 0, 0]}><capsuleGeometry args={[0.07, 0.08, 8, 6]} /><meshBasicMaterial color="#555" wireframe /></mesh>
      </group>
      {/* Stage lights (emissive colored blocks) */}
      {[[4, 5.5, 5], [8, 5.5, 5], [12, 5.5, 5]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[0.4, 0.3, 0.4]} />
          <meshLambertMaterial color={['#e53935', '#7b1fa2', '#1e88e5'][i]} emissive={['#e53935', '#7b1fa2', '#1e88e5'][i]} emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  )
})

// ==========================================
// TV Area — huge sports TV
// ==========================================
function TVArea() {
  const ballRef = useRef()
  useFrame((state) => {
    if (ballRef.current) {
      const t = state.clock.elapsedTime
      ballRef.current.position.x = Math.sin(t * 1.3) * 1.5
      ballRef.current.position.y = Math.cos(t * 1.8) * 0.8
    }
  })
  return (
    <group>
      {/* HUGE screen TV frame */}
      <mesh position={[42.2, 3.5, 22]}><boxGeometry args={[0.3, 4.5, 7]} /><meshLambertMaterial color="#111" /></mesh>
      {/* TV screen — green sports field */}
      <mesh position={[42.04, 3.5, 22]}><boxGeometry args={[0.05, 4, 6.5]} /><meshBasicMaterial color="#2e7d32" /></mesh>
      {/* Field lines */}
      <mesh position={[42.03, 3.5, 22]}><boxGeometry args={[0.02, 3.6, 0.06]} /><meshBasicMaterial color="#fff" /></mesh>
      <mesh position={[42.03, 3.5, 22]}><boxGeometry args={[0.02, 0.06, 6]} /><meshBasicMaterial color="#fff" /></mesh>
      {/* Center circle */}
      <mesh position={[42.02, 3.5, 22]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.6, 0.02, 8, 20]} /><meshBasicMaterial color="#fff" /></mesh>
      {/* Goals */}
      <mesh position={[42.03, 5, 22]}><boxGeometry args={[0.02, 0.8, 1.2]} /><meshBasicMaterial color="#fff" transparent opacity={0.5} /></mesh>
      <mesh position={[42.03, 2, 22]}><boxGeometry args={[0.02, 0.8, 1.2]} /><meshBasicMaterial color="#fff" transparent opacity={0.5} /></mesh>
      {/* Animated ball */}
      <mesh ref={ballRef} position={[42.01, 3.5, 22]}><sphereGeometry args={[0.12, 8, 8]} /><meshBasicMaterial color="#fff" /></mesh>
      {/* TV glow */}
      <pointLight position={[41, 3.5, 22]} color="#4caf50" intensity={0.5} distance={6} />
      {/* TV mount bracket */}
      <mesh position={[42.3, 1.3, 22]}><boxGeometry args={[0.2, 0.1, 2]} /><meshLambertMaterial color="#37474f" /></mesh>
      {/* Sofa — bigger L-shaped */}
      <mesh position={[38, 0.35, 22]} castShadow><boxGeometry args={[2.5, 0.5, 5]} /><meshLambertMaterial color="#5d3a2e" /></mesh>
      <mesh position={[36.8, 0.7, 22]}><boxGeometry args={[0.3, 0.5, 5]} /><meshLambertMaterial color="#4e2e22" /></mesh>
      <mesh position={[38, 0.7, 24.3]}><boxGeometry args={[2.5, 0.5, 0.3]} /><meshLambertMaterial color="#4e2e22" /></mesh>
      <mesh position={[38, 0.7, 19.7]}><boxGeometry args={[2.5, 0.5, 0.3]} /><meshLambertMaterial color="#4e2e22" /></mesh>
      {/* Coffee table */}
      <mesh position={[40, 0.45, 22]} castShadow><boxGeometry args={[1.2, 0.08, 2.5]} /><meshLambertMaterial color="#5d4037" /></mesh>
      {/* Snack bowls on table */}
      <mesh position={[40, 0.55, 21.5]}><cylinderGeometry args={[0.15, 0.12, 0.1, 8]} /><meshLambertMaterial color="#ff9800" /></mesh>
      <mesh position={[40, 0.55, 22.5]}><cylinderGeometry args={[0.15, 0.12, 0.1, 8]} /><meshLambertMaterial color="#f44336" /></mesh>
    </group>
  )
}

// ==========================================
// Fish Tank — near bar area
// ==========================================
function FishTank() {
  const fishRef1 = useRef()
  const fishRef2 = useRef()
  const fishRef3 = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (fishRef1.current) { fishRef1.current.position.x = Math.sin(t * 0.8) * 0.5; fishRef1.current.position.y = Math.sin(t * 1.2) * 0.15 + 2 }
    if (fishRef2.current) { fishRef2.current.position.x = Math.sin(t * 0.6 + 2) * 0.4; fishRef2.current.position.y = Math.sin(t * 0.9 + 1) * 0.15 + 2.2 }
    if (fishRef3.current) { fishRef3.current.position.x = Math.sin(t * 1.1 + 4) * 0.35; fishRef3.current.position.y = Math.sin(t * 0.7 + 3) * 0.1 + 1.8 }
  })
  return (
    <group position={[22, 0, 1.5]}>
      {/* Tank body — glass */}
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[2, 1.6, 1]} />
        <meshLambertMaterial color="#29b6f6" transparent opacity={0.3} />
      </mesh>
      {/* Tank frame */}
      <mesh position={[0, 1, 0]}><boxGeometry args={[2.1, 0.1, 1.1]} /><meshLambertMaterial color="#333" /></mesh>
      <mesh position={[0, 2.6, 0]}><boxGeometry args={[2.1, 0.1, 1.1]} /><meshLambertMaterial color="#333" /></mesh>
      {/* Water fill */}
      <mesh position={[0, 1.8, 0]}><boxGeometry args={[1.9, 1.4, 0.9]} /><meshBasicMaterial color="#0288d1" transparent opacity={0.25} /></mesh>
      {/* Gravel */}
      <mesh position={[0, 1.05, 0]}><boxGeometry args={[1.9, 0.1, 0.9]} /><meshLambertMaterial color="#a1887f" /></mesh>
      {/* Little plant */}
      <mesh position={[0.5, 1.4, 0]}><boxGeometry args={[0.1, 0.6, 0.1]} /><meshLambertMaterial color="#388e3c" /></mesh>
      <mesh position={[0.5, 1.8, 0]}><sphereGeometry args={[0.15, 6, 6]} /><meshLambertMaterial color="#2e7d32" /></mesh>
      <mesh position={[-0.4, 1.3, 0.1]}><boxGeometry args={[0.08, 0.4, 0.08]} /><meshLambertMaterial color="#43a047" /></mesh>
      {/* Fish! */}
      <mesh ref={fishRef1}><sphereGeometry args={[0.08, 6, 4]} /><meshBasicMaterial color="#ff6d00" /></mesh>
      <mesh ref={fishRef2}><sphereGeometry args={[0.06, 6, 4]} /><meshBasicMaterial color="#e53935" /></mesh>
      <mesh ref={fishRef3}><sphereGeometry args={[0.07, 6, 4]} /><meshBasicMaterial color="#ffd600" /></mesh>
      {/* Tank stand */}
      <mesh position={[0, 0.5, 0]}><boxGeometry args={[2, 1, 1]} /><meshLambertMaterial color="#263238" /></mesh>
    </group>
  )
}

// ==========================================
// Park Surroundings — outside the pub
// ==========================================
const ParkSurroundings = memo(function ParkSurroundings() {
  const treePositions = [
    [-6, 10], [-8, 20], [-6, 30], [-10, 15], [-10, 35],
    [WORLD_SIZE + 6, 10], [WORLD_SIZE + 8, 20], [WORLD_SIZE + 6, 30], [WORLD_SIZE + 10, 25],
    [10, -6], [22, -8], [34, -6], [15, -10],
    [10, WORLD_DEPTH + 6], [30, WORLD_DEPTH + 6], [22, WORLD_DEPTH + 10],
  ]
  const treeSizes = [1.6, 1.8, 1.5, 1.7, 1.9, 1.6, 1.8, 1.5, 1.7, 1.6, 1.9, 1.5, 1.8, 1.7, 1.6]
  const flowerColors = ['#e91e63', '#ff5722', '#ffeb3b', '#ab47bc', '#ff4081', '#ff9800']
  // Pre-computed flower positions (no Math.random!)
  const flowerOffsets = [
    [[-0.5, 0.3], [0.4, -0.5], [-0.2, 0.6], [0.6, 0.1], [-0.3, -0.4]],
    [[0.3, -0.3], [-0.6, 0.4], [0.5, 0.5], [-0.1, -0.6], [0.2, 0.3]],
    [[-0.4, -0.2], [0.3, 0.6], [0.6, -0.3], [-0.5, 0.1], [0.1, -0.5]],
    [[0.5, 0.2], [-0.3, -0.5], [0.2, 0.4], [-0.6, 0.3], [0.4, -0.2]],
    [[-0.2, 0.5], [0.6, -0.1], [-0.4, -0.3], [0.1, 0.6], [-0.5, -0.4]],
    [[0.4, 0.4], [-0.1, -0.6], [0.3, -0.2], [-0.5, 0.5], [0.2, -0.3]],
    [[-0.3, 0.1], [0.5, -0.4], [-0.6, -0.2], [0.1, 0.3], [0.4, 0.5]],
    [[0.2, -0.5], [-0.4, 0.2], [0.6, 0.3], [-0.2, -0.4], [0.3, 0.1]],
  ]
  const stemOffsets = [
    [[-0.3, 0.2], [0.4, -0.3], [0.1, 0.4]],
    [[0.3, 0.1], [-0.2, -0.4], [-0.4, 0.3]],
    [[-0.1, -0.3], [0.5, 0.2], [-0.3, -0.1]],
    [[0.2, 0.4], [-0.4, -0.2], [0.3, -0.3]],
    [[-0.2, 0.3], [0.1, -0.4], [0.4, 0.1]],
    [[0.4, -0.2], [-0.3, 0.4], [0.2, -0.1]],
    [[-0.4, -0.1], [0.3, 0.3], [-0.1, -0.4]],
    [[0.1, 0.2], [-0.5, -0.3], [0.4, 0.4]],
  ]
  return (
    <group>
      {/* Large grass ground plane — well below pub floor to avoid z-fighting */}
      <mesh position={[22, -0.5, 20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshLambertMaterial color="#4caf50" />
      </mesh>
      {/* Circular walking footpath around the pub — brown dirt */}
      <mesh position={[22, -0.45, 20]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[27, 30, 40]} />
        <meshLambertMaterial color="#9e9e9e" />
      </mesh>
      {/* Straight path from entrance to circular path */}
      <mesh position={[22, -0.44, 46]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 14]} />
        <meshLambertMaterial color="#9e9e9e" />
      </mesh>
      {/* Side path connecting left */}
      <mesh position={[-5, -0.44, 20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 3]} />
        <meshLambertMaterial color="#9e9e9e" />
      </mesh>
      {/* Side path connecting right */}
      <mesh position={[WORLD_SIZE + 5, -0.44, 20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 3]} />
        <meshLambertMaterial color="#9e9e9e" />
      </mesh>
      {/* Path going behind the pub */}
      <mesh position={[22, -0.44, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 12]} />
        <meshLambertMaterial color="#9e9e9e" />
      </mesh>
      {/* Trees — low-poly cones */}
      {treePositions.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.15, 0.25, 3, 5]} /><meshLambertMaterial color="#5d4037" /></mesh>
          <mesh position={[0, 3.8, 0]}><coneGeometry args={[treeSizes[i], 3, 6]} /><meshLambertMaterial color={i % 3 === 0 ? '#2e7d32' : i % 3 === 1 ? '#388e3c' : '#43a047'} /></mesh>
        </group>
      ))}
      {/* Flower clusters */}
      {[[-4, 8], [-4, 25], [-5, 37], [WORLD_SIZE + 4, 15], [WORLD_SIZE + 4, 30], [15, -4], [30, -4], [15, WORLD_DEPTH + 4]].map(([x, z], i) => (
        <group key={i} position={[x, 0.1, z]}>
          {flowerOffsets[i].map(([fx, fz], j) => (
            <mesh key={j} position={[fx, 0.15, fz]}>
              <sphereGeometry args={[0.12, 6, 6]} />
              <meshLambertMaterial color={flowerColors[(i + j) % flowerColors.length]} />
            </mesh>
          ))}
          {stemOffsets[i].map(([sx, sz], j) => (
            <mesh key={`s${j}`} position={[sx, 0.08, sz]}>
              <boxGeometry args={[0.03, 0.15, 0.03]} />
              <meshLambertMaterial color="#388e3c" />
            </mesh>
          ))}
        </group>
      ))}
      {/* Park benches — more of them */}
      {[[-4, 18], [-4, 32], [WORLD_SIZE + 4, 12], [WORLD_SIZE + 4, 22], [WORLD_SIZE + 4, 32], [15, -4], [30, -4]].map(([x, z], i) => (
        <group key={i} position={[x, -0.5, z]} rotation={[0, x < 0 ? Math.PI / 2 : x > 20 ? -Math.PI / 2 : 0, 0]}>
          <mesh position={[0, 0.5, 0]}><boxGeometry args={[1.8, 0.08, 0.5]} /><meshLambertMaterial color="#5d4037" /></mesh>
          <mesh position={[0, 0.7, -0.2]}><boxGeometry args={[1.8, 0.5, 0.08]} /><meshLambertMaterial color="#5d4037" /></mesh>
          <mesh position={[-0.8, 0.25, 0]}><boxGeometry args={[0.08, 0.5, 0.4]} /><meshLambertMaterial color="#37474f" /></mesh>
          <mesh position={[0.8, 0.25, 0]}><boxGeometry args={[0.08, 0.5, 0.4]} /><meshLambertMaterial color="#37474f" /></mesh>
        </group>
      ))}
      {/* Lamp posts along path */}
      {[[-6, 5], [-6, 35], [WORLD_SIZE + 6, 5], [WORLD_SIZE + 6, 35], [10, -6], [34, -6]].map(([x, z], i) => (
        <group key={`lamp${i}`} position={[x, -0.5, z]}>
          <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.06, 0.08, 3, 6]} /><meshLambertMaterial color="#37474f" /></mesh>
          <mesh position={[0, 3.2, 0]}><sphereGeometry args={[0.2, 8, 8]} /><meshLambertMaterial color="#fff9c4" emissive="#ffee58" emissiveIntensity={0.3} /></mesh>
        </group>
      ))}
      {/* Fountain in front of pub */}
      <group position={[22, -0.5, 48]}>
        <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[1.5, 1.8, 0.8, 12]} /><meshLambertMaterial color="#78909c" /></mesh>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[1.3, 1.3, 0.3, 12]} /><meshBasicMaterial color="#29b6f6" transparent opacity={0.4} /></mesh>
        <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.1, 0.15, 1, 6]} /><meshLambertMaterial color="#78909c" /></mesh>
        <mesh position={[0, 1.7, 0]}><cylinderGeometry args={[0.6, 0.7, 0.3, 10]} /><meshLambertMaterial color="#78909c" /></mesh>
        <mesh position={[0, 1.8, 0]}><cylinderGeometry args={[0.5, 0.5, 0.15, 10]} /><meshBasicMaterial color="#29b6f6" transparent opacity={0.4} /></mesh>
      </group>
    </group>
  )
})

// ==========================================
// Park Botlets — cute bots strolling on the footpath
// ==========================================
// Waypoints follow the middle of the grey footpath around the pub
const FOOTPATH_WAYPOINTS = [
  { x: 22, z: 42 },   // entrance
  { x: 22, z: 48 },   // fountain
  { x: 36, z: 48 },   // front right (along path)
  { x: 45.5, z: 42 }, // corner right front
  { x: 45.5, z: 20 }, // right side mid
  { x: 45.5, z: -1.5 }, // corner right back
  { x: 22, z: -1.5 }, // back center
  { x: -1.5, z: -1.5 }, // corner left back
  { x: -1.5, z: 20 }, // left side mid
  { x: -1.5, z: 42 }, // corner left front
  { x: 10, z: 48 },   // front left (along path)
  { x: 22, z: 42 },   // back to entrance
]

function ParkBotlets() {
  const botletRefs = [useRef(), useRef()]
  const leftArmRefs = [useRef(), useRef()]
  const rightArmRefs = [useRef(), useRef()]
  const leftLegRefs = [useRef(), useRef()]
  const rightLegRefs = [useRef(), useRef()]
  // Progress along the path (0 to total path length)
  const progressRefs = [useRef(0), useRef(0.5)] // start at different spots

  // Pre-compute total path length and segment lengths
  const segments = []
  let totalLength = 0
  for (let i = 0; i < FOOTPATH_WAYPOINTS.length - 1; i++) {
    const a = FOOTPATH_WAYPOINTS[i]
    const b = FOOTPATH_WAYPOINTS[i + 1]
    const len = Math.sqrt((b.x - a.x) ** 2 + (b.z - a.z) ** 2)
    segments.push({ a, b, len, startDist: totalLength })
    totalLength += len
  }

  const botletData = [
    { speed: 3.5, color: '#ff7043', skinColor: '#ffe0b2' },
    { speed: 2.8, color: '#42a5f5', skinColor: '#fff9c4' },
  ]

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    botletData.forEach((bot, i) => {
      if (!botletRefs[i].current) return

      // Advance along path
      progressRefs[i].current += bot.speed * delta
      if (progressRefs[i].current >= totalLength) progressRefs[i].current -= totalLength

      const dist = progressRefs[i].current
      // Find which segment we're on
      let seg = segments[0]
      for (const s of segments) {
        if (dist >= s.startDist && dist < s.startDist + s.len) { seg = s; break }
      }
      const segProgress = (dist - seg.startDist) / seg.len
      const px = seg.a.x + (seg.b.x - seg.a.x) * segProgress
      const pz = seg.a.z + (seg.b.z - seg.a.z) * segProgress

      botletRefs[i].current.position.x = px
      botletRefs[i].current.position.z = pz

      // Face movement direction
      const dx = seg.b.x - seg.a.x
      const dz = seg.b.z - seg.a.z
      botletRefs[i].current.rotation.y = Math.atan2(dx, dz)

      // Walk animation
      const swing = Math.sin(t * 5) * 0.5
      if (leftArmRefs[i].current) leftArmRefs[i].current.rotation.x = swing
      if (rightArmRefs[i].current) rightArmRefs[i].current.rotation.x = -swing
      if (leftLegRefs[i].current) leftLegRefs[i].current.rotation.x = -swing
      if (rightLegRefs[i].current) rightLegRefs[i].current.rotation.x = swing
    })
  })
  return (
    <group>
      {botletData.map((bot, i) => (
        <group key={i} ref={botletRefs[i]} position={[22, -0.5, 44]}>
          {/* Capsule body */}
          <mesh position={[0, 0.8, 0]}><capsuleGeometry args={[0.35, 0.7, 10, 14]} /><meshLambertMaterial color={bot.color} /></mesh>
          {/* Belly */}
          <mesh position={[0, 0.65, 0.33]}><sphereGeometry args={[0.22, 10, 10]} /><meshLambertMaterial color={bot.skinColor} /></mesh>
          {/* Goggle band */}
          <mesh position={[0, 1.1, 0.24]}><cylinderGeometry args={[0.37, 0.37, 0.15, 16, 1, false, -0.8, 1.6]} /><meshLambertMaterial color="#333" /></mesh>
          {/* Left eye */}
          <group position={[-0.14, 1.1, 0.32]}>
            <mesh><sphereGeometry args={[0.13, 10, 10]} /><meshLambertMaterial color="#fff" /></mesh>
            <mesh position={[0.02, 0, 0.11]}><sphereGeometry args={[0.04, 6, 6]} /><meshBasicMaterial color="#111" /></mesh>
          </group>
          {/* Right eye */}
          <group position={[0.14, 1.1, 0.32]}>
            <mesh><sphereGeometry args={[0.13, 10, 10]} /><meshLambertMaterial color="#fff" /></mesh>
            <mesh position={[-0.02, 0, 0.11]}><sphereGeometry args={[0.04, 6, 6]} /><meshBasicMaterial color="#111" /></mesh>
          </group>
          {/* Antenna */}
          <mesh position={[0, 1.55, 0]}><cylinderGeometry args={[0.015, 0.015, 0.18, 4]} /><meshLambertMaterial color="#555" /></mesh>
          <mesh position={[0, 1.67, 0]}><sphereGeometry args={[0.05, 8, 8]} /><meshLambertMaterial color={bot.color} emissive={bot.color} emissiveIntensity={0.3} /></mesh>
          {/* Arms */}
          <group ref={leftArmRefs[i]} position={[-0.4, 0.9, 0]}>
            <mesh position={[0, -0.18, 0]}><capsuleGeometry args={[0.07, 0.18, 6, 6]} /><meshLambertMaterial color={bot.skinColor} /></mesh>
          </group>
          <group ref={rightArmRefs[i]} position={[0.4, 0.9, 0]}>
            <mesh position={[0, -0.18, 0]}><capsuleGeometry args={[0.07, 0.18, 6, 6]} /><meshLambertMaterial color={bot.skinColor} /></mesh>
          </group>
          {/* Legs */}
          <group ref={leftLegRefs[i]} position={[-0.13, 0.15, 0]}>
            <mesh position={[0, -0.12, 0]}><capsuleGeometry args={[0.06, 0.1, 4, 6]} /><meshLambertMaterial color={bot.color} /></mesh>
            <mesh position={[0, -0.25, 0.03]}><sphereGeometry args={[0.08, 8, 8]} /><meshLambertMaterial color="#2c2c2c" /></mesh>
          </group>
          <group ref={rightLegRefs[i]} position={[0.13, 0.15, 0]}>
            <mesh position={[0, -0.12, 0]}><capsuleGeometry args={[0.06, 0.1, 4, 6]} /><meshLambertMaterial color={bot.color} /></mesh>
            <mesh position={[0, -0.25, 0.03]}><sphereGeometry args={[0.08, 8, 8]} /><meshLambertMaterial color="#2c2c2c" /></mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

// ==========================================
// Slot Machines
// ==========================================
const SlotMachines = memo(function SlotMachines() {
  return (
    <group>
      {[30, 31, 32, 33, 34].map((z, i) => (
        <group key={i} position={[41, 0, z]}>
          {/* Machine body */}
          <mesh position={[0.5, 1, 0.5]} castShadow><boxGeometry args={[1.2, 2, 0.8]} /><meshLambertMaterial color="#1a237e" /></mesh>
          {/* Screen */}
          <mesh position={[0.01, 1.3, 0.5]}><boxGeometry args={[0.05, 0.8, 0.5]} /><meshLambertMaterial color={['#f44336', '#4caf50', '#ff9800', '#2196f3', '#9c27b0'][i]} emissive={['#f44336', '#4caf50', '#ff9800', '#2196f3', '#9c27b0'][i]} emissiveIntensity={0.4} /></mesh>
          {/* Handle */}
          <mesh position={[-0.2, 1.5, 0.5]}><boxGeometry args={[0.1, 0.4, 0.1]} /><meshLambertMaterial color="#ffd54f" /></mesh>
          <mesh position={[-0.2, 1.75, 0.5]}><sphereGeometry args={[0.08, 6, 6]} /><meshLambertMaterial color="#f44336" /></mesh>
        </group>
      ))}
      {/* Stools */}
      {[30, 32, 34].map((z, i) => (
        <group key={i} position={[39.5, 0, z + 0.5]}>
          <mesh position={[0, 0.65, 0]}><cylinderGeometry args={[0.2, 0.2, 0.05, 8]} /><meshLambertMaterial color="#5d4037" /></mesh>
          <mesh position={[0, 0.32, 0]}><cylinderGeometry args={[0.04, 0.04, 0.65, 4]} /><meshLambertMaterial color="#37474f" /></mesh>
        </group>
      ))}
    </group>
  )
})

// ==========================================
// Pool Table
// ==========================================
const PoolTable = memo(function PoolTable() {
  return (
    <group position={[6, 0, 27]}>
      {/* Table frame */}
      <mesh position={[2, 0.95, 1.5]} castShadow><boxGeometry args={[5, 0.15, 3]} /><meshLambertMaterial color="#1b5e20" /></mesh>
      <mesh position={[2, 0.5, 1.5]}><boxGeometry args={[5.2, 0.8, 3.2]} /><meshLambertMaterial color="#5d4037" /></mesh>
      {/* Rails */}
      <mesh position={[2, 1.1, 0.05]}><boxGeometry args={[5.2, 0.15, 0.15]} /><meshLambertMaterial color="#4e342e" /></mesh>
      <mesh position={[2, 1.1, 2.95]}><boxGeometry args={[5.2, 0.15, 0.15]} /><meshLambertMaterial color="#4e342e" /></mesh>
      {/* Balls (a few) */}
      {[[1.5, 1.08, 1], [2, 1.08, 1.5], [2.5, 1.08, 1.2], [1.8, 1.08, 2]].map(([bx, by, bz], i) => (
        <mesh key={i} position={[bx, by, bz]}><sphereGeometry args={[0.06, 6, 6]} /><meshLambertMaterial color={['#f44336', '#ffeb3b', '#2196f3', '#1a1a1a'][i]} /></mesh>
      ))}
      {/* Light above */}
      <mesh position={[2, 3.5, 1.5]}><boxGeometry args={[3, 0.15, 0.8]} /><meshLambertMaterial color="#4e342e" /></mesh>
      <mesh position={[2, 3.2, 1.5]}><boxGeometry args={[0.3, 0.3, 0.3]} /><meshLambertMaterial color="#fff9c4" emissive="#fff176" emissiveIntensity={0.3} /></mesh>
    </group>
  )
})

// ==========================================
// Tables & Booths
// ==========================================
const DiningTable = memo(function DiningTable({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[1, 0.85, 0.5]} castShadow><boxGeometry args={[2, 0.08, 1.4]} /><meshLambertMaterial color="#5d4037" /></mesh>
      <mesh position={[0.3, 0.42, 0.5]}><boxGeometry args={[0.08, 0.85, 0.08]} /><meshLambertMaterial color="#3e2723" /></mesh>
      <mesh position={[1.7, 0.42, 0.5]}><boxGeometry args={[0.08, 0.85, 0.08]} /><meshLambertMaterial color="#3e2723" /></mesh>
      {/* Pint glasses */}
      <mesh position={[0.7, 0.95, 0.3]}><cylinderGeometry args={[0.06, 0.05, 0.16, 6]} /><meshLambertMaterial color="#fff9c4" transparent opacity={0.7} /></mesh>
      <mesh position={[1.3, 0.95, 0.7]}><cylinderGeometry args={[0.06, 0.05, 0.16, 6]} /><meshLambertMaterial color="#fff9c4" transparent opacity={0.7} /></mesh>
    </group>
  )
})

const Booth = memo(function Booth({ z }) {
  return (
    <group position={[1, 0, z]}>
      {/* Back */}
      <mesh position={[0.5, 0.8, 1.5]} castShadow><boxGeometry args={[0.3, 1.6, 3]} /><meshLambertMaterial color="#6d4c41" /></mesh>
      {/* Seat */}
      <mesh position={[1.5, 0.45, 1.5]} castShadow><boxGeometry args={[1.5, 0.15, 2.5]} /><meshLambertMaterial color="#4e342e" /></mesh>
      {/* Table */}
      <mesh position={[3, 0.8, 1.5]} castShadow><boxGeometry args={[1.5, 0.08, 2.5]} /><meshLambertMaterial color="#5d4037" /></mesh>
    </group>
  )
})

// ==========================================
// Outside Sign "PUBLET"
// ==========================================
const OutsideSign = memo(function OutsideSign() {
  return (
    <group position={[22, 0, 41]}>
      {/* Sign board */}
      <mesh position={[0, 5, 0.5]} castShadow><boxGeometry args={[10, 2, 0.3]} /><meshLambertMaterial color="#1a1a1a" /></mesh>
      {/* Inner sign with glow */}
      <mesh position={[0, 5, 0.66]}><boxGeometry args={[9, 1.5, 0.05]} /><meshLambertMaterial color="#b71c1c" emissive="#f44336" emissiveIntensity={0.4} /></mesh>
      {/* Sign text using Html */}
      <Html position={[0, 5, 0.75]} center transform>
        <div style={{
          fontFamily: "'Georgia', serif",
          fontSize: '52px',
          fontWeight: 900,
          color: '#ffd54f',
          textShadow: '0 0 20px #ff8f00, 0 0 40px #ff6f00',
          letterSpacing: '12px',
          userSelect: 'none',
        }}>
          PUBLET
        </div>
      </Html>
      {/* Mounting brackets */}
      <mesh position={[-4, 5.8, 0.2]}><boxGeometry args={[0.3, 0.3, 0.6]} /><meshLambertMaterial color="#37474f" /></mesh>
      <mesh position={[4, 5.8, 0.2]}><boxGeometry args={[0.3, 0.3, 0.6]} /><meshLambertMaterial color="#37474f" /></mesh>
      {/* Neon accent line under sign */}
      <mesh position={[0, 3.9, 0.5]}><boxGeometry args={[10, 0.1, 0.1]} /><meshLambertMaterial color="#ffd54f" emissive="#ff8f00" emissiveIntensity={0.6} /></mesh>
    </group>
  )
})

// ==========================================
// Decor
// ==========================================
const Decor = memo(function Decor() {
  return (
    <group>
      {/* Ceiling beams */}
      {[8, 16, 24, 32, 40].map((x, i) => (
        <mesh key={i} position={[x, 5.8, 20]}><boxGeometry args={[0.3, 0.4, 38]} /><meshLambertMaterial color="#3e2723" /></mesh>
      ))}
      {/* Pendant lights */}
      {[[14, 18], [20, 18], [26, 18], [14, 24], [20, 24], [26, 24], [14, 30], [20, 30], [26, 30]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 5.5, 0]}><boxGeometry args={[0.03, 0.6, 0.03]} /><meshLambertMaterial color="#212121" /></mesh>
          <mesh position={[0, 5.0, 0]}><cylinderGeometry args={[0.01, 0.2, 0.2, 6]} /><meshLambertMaterial color="#ff8f00" emissive="#ffab00" emissiveIntensity={0.2} /></mesh>
        </group>
      ))}
      {/* Dartboard */}
      <mesh position={[0.2, 2.5, 32]}><cylinderGeometry args={[0.5, 0.5, 0.1, 12]} /><meshLambertMaterial color="#1a1a1a" /></mesh>
      <mesh position={[0.26, 2.5, 32]}><cylinderGeometry args={[0.4, 0.4, 0.05, 12]} /><meshLambertMaterial color="#c62828" /></mesh>
      <mesh position={[0.3, 2.5, 32]}><cylinderGeometry args={[0.15, 0.15, 0.05, 12]} /><meshLambertMaterial color="#2e7d32" /></mesh>
      {/* Neon sign on wall */}
      <mesh position={[0.2, 3.5, 15]}><boxGeometry args={[0.05, 0.8, 3]} /><meshLambertMaterial color="#e91e63" emissive="#c2185b" emissiveIntensity={0.4} /></mesh>
    </group>
  )
})

// ==========================================
// Toilets
// ==========================================
const Toilets = memo(function Toilets() {
  return (
    <group>
      {/* Divider wall separating toilets from pub */}
      <mesh position={[5, 3, 34]}><boxGeometry args={[10, 6, 0.25]} /><meshLambertMaterial color="#455a64" /></mesh>
      {/* Door frame */}
      <mesh position={[3, 4.8, 34]}><boxGeometry args={[1.5, 1.4, 0.3]} /><meshLambertMaterial color="#455a64" /></mesh>
      {/* Tiled floor */}
      <mesh position={[5, 0.01, 37]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[10, 6]} /><meshLambertMaterial color="#cfd8dc" /></mesh>
      {/* WC Sign */}
      <mesh position={[3, 4.2, 33.85]}><boxGeometry args={[1, 0.5, 0.05]} /><meshBasicMaterial color="#1565c0" /></mesh>
      {/* Stall dividers */}
      <mesh position={[3, 1.5, 36]}><boxGeometry args={[0.1, 3, 2.5]} /><meshLambertMaterial color="#78909c" /></mesh>
      <mesh position={[5, 1.5, 36]}><boxGeometry args={[0.1, 3, 2.5]} /><meshLambertMaterial color="#78909c" /></mesh>
      {/* Stall doors */}
      <mesh position={[3, 1.3, 34.8]}><boxGeometry args={[0.08, 2.2, 1.4]} /><meshLambertMaterial color="#8d6e63" /></mesh>
      <mesh position={[5, 1.3, 34.8]}><boxGeometry args={[0.08, 2.2, 1.4]} /><meshLambertMaterial color="#8d6e63" /></mesh>
      {/* Toilets */}
      {[2, 4].map((x, i) => (
        <group key={i} position={[x, 0, 37.5]}>
          <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.6, 0.5, 0.8]} /><meshLambertMaterial color="#eceff1" /></mesh>
          <mesh position={[0, 0.7, -0.15]}><boxGeometry args={[0.5, 0.6, 0.3]} /><meshLambertMaterial color="#eceff1" /></mesh>
          <mesh position={[0, 0.68, 0.1]}><boxGeometry args={[0.5, 0.04, 0.5]} /><meshLambertMaterial color="#cfd8dc" /></mesh>
        </group>
      ))}
      {/* Sink counter against right side */}
      <mesh position={[8, 0.9, 36]}><boxGeometry args={[2, 0.08, 1]} /><meshLambertMaterial color="#eceff1" /></mesh>
      <mesh position={[8, 0.45, 36]}><boxGeometry args={[2, 0.9, 1]} /><meshLambertMaterial color="#78909c" /></mesh>
      {/* Sink basins */}
      {[7.4, 8.6].map((sx, i) => (
        <mesh key={i} position={[sx, 0.92, 36]}><cylinderGeometry args={[0.2, 0.15, 0.08, 8]} /><meshLambertMaterial color="#b0bec5" /></mesh>
      ))}
      {/* Taps */}
      {[7.4, 8.6].map((sx, i) => (
        <mesh key={`t${i}`} position={[sx, 1.1, 35.7]}><boxGeometry args={[0.06, 0.15, 0.06]} /><meshLambertMaterial color="#bdbdbd" /></mesh>
      ))}
      {/* Mirror above sinks */}
      <mesh position={[8, 2.2, 35.45]}><boxGeometry args={[2.2, 1.5, 0.05]} /><meshBasicMaterial color="#90caf9" transparent opacity={0.4} /></mesh>
      <mesh position={[8, 2.2, 35.43]}><boxGeometry args={[2.3, 1.6, 0.03]} /><meshLambertMaterial color="#37474f" /></mesh>
      {/* Hand dryer */}
      <mesh position={[9.3, 1.5, 35.5]}><boxGeometry args={[0.3, 0.4, 0.25]} /><meshLambertMaterial color="#e0e0e0" /></mesh>
    </group>
  )
})

// ==========================================
// School — "Schollet"
// ==========================================
const School = memo(function School() {
  const schoolX = -18  // left of pub in the park
  const schoolZ = 15
  const sW = 16  // width
  const sD = 14  // depth
  const sH = 5   // height
  const brick = '#b71c1c'
  const trim = '#d32f2f'
  return (
    <group position={[schoolX, -0.5, schoolZ]}>
      {/* Floor */}
      <mesh position={[sW / 2, 0.01, sD / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[sW, sD]} />
        <meshLambertMaterial color="#e0e0e0" />
      </mesh>
      {/* Walls — back */}
      <mesh position={[sW / 2, sH / 2, 0]}><boxGeometry args={[sW, sH, 0.3]} /><meshLambertMaterial color={brick} /></mesh>
      {/* Front wall — left section */}
      <mesh position={[3, sH / 2, sD]}><boxGeometry args={[6, sH, 0.3]} /><meshLambertMaterial color={brick} /></mesh>
      {/* Front wall — right section */}
      <mesh position={[13, sH / 2, sD]}><boxGeometry args={[6, sH, 0.3]} /><meshLambertMaterial color={brick} /></mesh>
      {/* Above door */}
      <mesh position={[sW / 2, sH - 0.5, sD]}><boxGeometry args={[4, 1, 0.3]} /><meshLambertMaterial color={brick} /></mesh>
      {/* Left wall */}
      <mesh position={[0, sH / 2, sD / 2]}><boxGeometry args={[0.3, sH, sD]} /><meshLambertMaterial color={brick} /></mesh>
      {/* Right wall */}
      <mesh position={[sW, sH / 2, sD / 2]}><boxGeometry args={[0.3, sH, sD]} /><meshLambertMaterial color={brick} /></mesh>
      {/* Roof */}
      {/* No roof — classroom visible from above */}

      {/* Windows — back wall */}
      {[3, 8, 13].map((wx, i) => (
        <group key={`bw${i}`} position={[wx, 2.8, 0]}>
          <mesh><boxGeometry args={[1.8, 1.8, 0.05]} /><meshBasicMaterial color="#87ceeb" transparent opacity={0.3} side={THREE.DoubleSide} /></mesh>
          <mesh><boxGeometry args={[1.8, 0.05, 0.06]} /><meshLambertMaterial color={trim} /></mesh>
          <mesh><boxGeometry args={[0.05, 1.8, 0.06]} /><meshLambertMaterial color={trim} /></mesh>
        </group>
      ))}
      {/* Windows — left wall */}
      {[4, 10].map((wz, i) => (
        <group key={`lw${i}`} position={[0, 2.8, wz]}>
          <mesh><boxGeometry args={[0.05, 1.8, 1.8]} /><meshBasicMaterial color="#87ceeb" transparent opacity={0.3} side={THREE.DoubleSide} /></mesh>
        </group>
      ))}

      {/* === SCHOLLET SIGN === */}
      <mesh position={[sW / 2, sH + 1.5, sD + 0.3]}><boxGeometry args={[10, 2, 0.2]} /><meshLambertMaterial color="#1b5e20" /></mesh>
      <Html position={[sW / 2, sH + 1.5, sD + 0.45]} center transform>
        <div style={{
          fontFamily: "'Georgia', serif",
          fontSize: '40px',
          fontWeight: 900,
          color: '#ffd54f',
          textShadow: '0 0 15px #ff8f00',
          letterSpacing: '8px',
          userSelect: 'none',
        }}>
          SCHOOLET
        </div>
      </Html>

      {/* === Classroom interior === */}
      {/* Chalkboard on back wall */}
      <mesh position={[sW / 2, 2.8, 0.2]}><boxGeometry args={[6, 2.5, 0.08]} /><meshLambertMaterial color="#2e7d32" /></mesh>
      <mesh position={[sW / 2, 2.8, 0.18]}><boxGeometry args={[6.2, 2.7, 0.03]} /><meshLambertMaterial color="#5d4037" /></mesh>
      {/* Chalk tray */}
      <mesh position={[sW / 2, 1.5, 0.3]}><boxGeometry args={[4, 0.08, 0.15]} /><meshLambertMaterial color="#5d4037" /></mesh>

      {/* Teacher's desk */}
      <mesh position={[sW / 2, 0.75, 2.5]}><boxGeometry args={[3, 0.08, 1.5]} /><meshLambertMaterial color="#5d4037" /></mesh>
      <mesh position={[sW / 2, 0.38, 2.5]}><boxGeometry args={[3, 0.7, 1.5]} /><meshLambertMaterial color="#4e342e" /></mesh>
      {/* Teacher's chair */}
      <mesh position={[sW / 2, 0.45, 3.5]}><boxGeometry args={[0.6, 0.06, 0.6]} /><meshLambertMaterial color="#37474f" /></mesh>
      <mesh position={[sW / 2, 0.75, 3.8]}><boxGeometry args={[0.6, 0.5, 0.06]} /><meshLambertMaterial color="#37474f" /></mesh>

      {/* Student desks — 3 rows of 4 */}
      {[5.5, 7.5, 9.5].map((dz, ri) =>
        [3, 6, 9, 12].map((dx, ci) => (
          <group key={`d${ri}${ci}`} position={[dx, 0, dz]}>
            <mesh position={[0, 0.6, 0]}><boxGeometry args={[1.6, 0.06, 0.8]} /><meshLambertMaterial color="#8d6e63" /></mesh>
            <mesh position={[-0.7, 0.3, 0]}><boxGeometry args={[0.06, 0.6, 0.06]} /><meshLambertMaterial color="#616161" /></mesh>
            <mesh position={[0.7, 0.3, 0]}><boxGeometry args={[0.06, 0.6, 0.06]} /><meshLambertMaterial color="#616161" /></mesh>
            {/* Chair */}
            <mesh position={[0, 0.35, 0.7]}><boxGeometry args={[0.5, 0.05, 0.5]} /><meshLambertMaterial color="#ff8f00" /></mesh>
            <mesh position={[0, 0.55, 0.95]}><boxGeometry args={[0.5, 0.35, 0.05]} /><meshLambertMaterial color="#ff8f00" /></mesh>
          </group>
        ))
      )}

      {/* Clock on wall */}
      <mesh position={[2, 4, 0.2]}><cylinderGeometry args={[0.35, 0.35, 0.05, 12]} rotation={[Math.PI / 2, 0, 0]} /><meshLambertMaterial color="#fff" /></mesh>
      <mesh position={[2, 4, 0.25]}><cylinderGeometry args={[0.37, 0.37, 0.03, 12]} rotation={[Math.PI / 2, 0, 0]} /><meshLambertMaterial color="#333" /></mesh>

      {/* === Playground outside === */}
      {/* Slide */}
      <group position={[sW + 3, 0, 4]}>
        <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.06, 0.06, 2.4, 6]} /><meshLambertMaterial color="#1565c0" /></mesh>
        <mesh position={[1, 1.2, 0]}><cylinderGeometry args={[0.06, 0.06, 2.4, 6]} /><meshLambertMaterial color="#1565c0" /></mesh>
        <mesh position={[0.5, 2.4, 0]}><boxGeometry args={[1.2, 0.08, 1]} /><meshLambertMaterial color="#1565c0" /></mesh>
        <mesh position={[0.5, 1.2, 1.5]} rotation={[0.5, 0, 0]}><boxGeometry args={[0.8, 0.05, 2.5]} /><meshLambertMaterial color="#fdd835" /></mesh>
      </group>
      {/* Monkey bars */}
      <group position={[sW + 3, 0, 9]}>
        <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.04, 0.04, 3, 6]} /><meshLambertMaterial color="#e53935" /></mesh>
        <mesh position={[3, 1.5, 0]}><cylinderGeometry args={[0.04, 0.04, 3, 6]} /><meshLambertMaterial color="#e53935" /></mesh>
        {[0.5, 1, 1.5, 2, 2.5].map((bx, i) => (
          <mesh key={i} position={[bx, 3, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 3, 6]} /><meshLambertMaterial color="#ff8f00" /></mesh>
        ))}
      </group>

      {/* Connecting footpath to circular path */}
      <mesh position={[sW / 2, 0.06, sD + 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 8]} />
        <meshLambertMaterial color="#9e9e9e" />
      </mesh>
    </group>
  )
})

// ==========================================
// Motorbike Parking — in front of pub, right of entrance
// ==========================================
const Motorbikes = memo(function Motorbikes() {
  const bikeColors = ['#d32f2f', '#212121', '#1565c0', '#ff6f00']
  return (
    <group position={[32, -0.5, 43]}>
      {/* Parking surface */}
      <mesh position={[2, 0.02, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 3]} />
        <meshLambertMaterial color="#616161" />
      </mesh>
      {/* Parking lines */}
      {[0, 2.2, 4.4, 6.6].map((ox, i) => (
        <mesh key={`line${i}`} position={[ox, 0.03, 1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 2.5]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
      ))}
      {/* Motorbikes */}
      {bikeColors.map((color, i) => (
        <group key={i} position={[i * 2.2 + 1, 0, 1]} rotation={[0, Math.PI * 0.15 * (i % 2 === 0 ? 1 : -1), 0]}>
          {/* Frame / body */}
          <mesh position={[0, 0.55, 0]}><boxGeometry args={[0.3, 0.35, 1.2]} /><meshLambertMaterial color={color} /></mesh>
          {/* Tank */}
          <mesh position={[0, 0.75, -0.1]}><boxGeometry args={[0.35, 0.2, 0.5]} /><meshLambertMaterial color={color} /></mesh>
          {/* Seat */}
          <mesh position={[0, 0.72, 0.3]}><boxGeometry args={[0.28, 0.08, 0.5]} /><meshLambertMaterial color="#1a1a1a" /></mesh>
          {/* Front wheel */}
          <mesh position={[0, 0.28, -0.5]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.28, 0.28, 0.08, 10]} /><meshLambertMaterial color="#333" /></mesh>
          <mesh position={[0, 0.28, -0.5]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.18, 0.18, 0.09, 8]} /><meshLambertMaterial color="#666" /></mesh>
          {/* Rear wheel */}
          <mesh position={[0, 0.28, 0.5]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.28, 0.28, 0.1, 10]} /><meshLambertMaterial color="#333" /></mesh>
          <mesh position={[0, 0.28, 0.5]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.18, 0.18, 0.11, 8]} /><meshLambertMaterial color="#666" /></mesh>
          {/* Front forks */}
          <mesh position={[0, 0.55, -0.45]} rotation={[0.2, 0, 0]}><boxGeometry args={[0.06, 0.5, 0.06]} /><meshLambertMaterial color="#9e9e9e" /></mesh>
          {/* Handlebars */}
          <mesh position={[0, 0.85, -0.5]}><boxGeometry args={[0.5, 0.04, 0.04]} /><meshLambertMaterial color="#9e9e9e" /></mesh>
          {/* Headlight */}
          <mesh position={[0, 0.65, -0.62]}><sphereGeometry args={[0.07, 6, 6]} /><meshLambertMaterial color="#fff9c4" emissive="#ffee58" emissiveIntensity={0.1} /></mesh>
          {/* Exhaust */}
          <mesh position={[0.15, 0.35, 0.4]}><cylinderGeometry args={[0.035, 0.04, 0.5, 6]} rotation={[Math.PI / 2, 0, 0]} /><meshLambertMaterial color="#757575" /></mesh>
          {/* Mirror */}
          <mesh position={[-0.25, 0.9, -0.5]}><sphereGeometry args={[0.03, 4, 4]} /><meshBasicMaterial color="#90caf9" /></mesh>
          <mesh position={[0.25, 0.9, -0.5]}><sphereGeometry args={[0.03, 4, 4]} /><meshBasicMaterial color="#90caf9" /></mesh>
        </group>
      ))}
      {/* "PARKING" sign */}
      <mesh position={[-1, 1.5, 0]}><cylinderGeometry args={[0.04, 0.04, 3, 4]} /><meshLambertMaterial color="#37474f" /></mesh>
      <mesh position={[-1, 2.8, 0]}><boxGeometry args={[1.2, 0.6, 0.05]} /><meshLambertMaterial color="#1565c0" /></mesh>
    </group>
  )
})

// ==========================================
// Main Pub Renderer
// ==========================================
export default function WorldRenderer() {
  const generateWorld = useWorldStore(s => s.generateWorld)
  useEffect(() => { generateWorld() }, [])

  return (
    <group>
      <ParkSurroundings />
      <ParkBotlets />
      <Floor />
      <Walls />
      <Bar />
      <Kitchen />
      <Stage />
      <TVArea />
      <SlotMachines />
      <PoolTable />
      <FishTank />
      <Toilets />
      <Decor />
      <Motorbikes />
      <OutsideSign />
      {/* Dining tables */}
      {[[18, 18], [24, 18], [18, 24], [24, 24], [18, 30], [24, 30]].map(([x, z], i) => (
        <DiningTable key={i} x={x} z={z} />
      ))}
      {/* Booths */}
      <Booth z={17} />
      <Booth z={23} />
    </group>
  )
}
