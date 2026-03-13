import { createNoise2D } from 'simplex-noise'

// Create a seeded noise function
const noise2D = createNoise2D()

// Multi-octave noise for more natural terrain
export function fbm(x, z, octaves = 4, lacunarity = 2.0, gain = 0.5) {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, z * frequency)
    maxValue += amplitude
    amplitude *= gain
    frequency *= lacunarity
  }

  return value / maxValue
}

// Get terrain height at world position
export function getTerrainHeight(worldX, worldZ) {
  const scale = 0.02
  const height = fbm(worldX * scale, worldZ * scale, 4)
  // Map from [-1, 1] to [0, 3] — mostly flat with gentle hills
  return Math.floor(Math.max(0, (height + 1) * 1.5))
}

// Determine if position should have a path
export function isPath(worldX, worldZ) {
  // Create grid-like paths every 8 blocks
  const pathWidth = 2
  const gridSpacing = 16
  const modX = ((worldX % gridSpacing) + gridSpacing) % gridSpacing
  const modZ = ((worldZ % gridSpacing) + gridSpacing) % gridSpacing
  return modX < pathWidth || modZ < pathWidth
}

// Determine if a position should have a tree
export function shouldPlaceTree(worldX, worldZ) {
  const n = noise2D(worldX * 0.3, worldZ * 0.3)
  return n > 0.6 && !isPath(worldX, worldZ)
}

// Determine if a position should have a flower
export function shouldPlaceFlower(worldX, worldZ) {
  const n = noise2D(worldX * 0.5 + 100, worldZ * 0.5 + 100)
  return n > 0.7 && !isPath(worldX, worldZ)
}

// Determine building placement in a chunk
export function getBuildingForChunk(chunkX, chunkZ) {
  const n = noise2D(chunkX * 0.7 + 500, chunkZ * 0.7 + 500)
  if (n > 0.2) {
    // Building index based on noise
    const idx = Math.abs(Math.floor(noise2D(chunkX * 1.3 + 200, chunkZ * 1.3 + 200) * 100)) % 8
    return idx
  }
  return -1
}
