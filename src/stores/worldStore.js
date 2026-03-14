import { create } from 'zustand'
import { RESTAURANT_LOCATIONS } from '../utils/constants'

// Pub interior: 44x44 blocks, outdoor area extends to z=65
export const WORLD_SIZE = 44
export const WORLD_DEPTH = 44
export const OUTDOOR_DEPTH = 65

const useWorldStore = create((set, get) => ({
  generated: false,
  collisionMap: new Set(),
  locations: RESTAURANT_LOCATIONS,

  generateWorld: () => {
    if (get().generated) return
    const collisionMap = new Set()

    // Perimeter walls (interior pub + outdoor sides)
    for (let x = 0; x < WORLD_SIZE; x++) {
      collisionMap.add(`${x},0`)
    }
    // Side walls extend into outdoor area
    for (let z = 0; z < OUTDOOR_DEPTH; z++) {
      collisionMap.add(`0,${z}`)
      collisionMap.add(`${WORLD_SIZE - 1},${z}`)
    }
    // Front wall with wide entrance gap (z=40) — bots can walk outside
    for (let x = 0; x < WORLD_SIZE; x++) {
      if (x < 17 || x > 27) collisionMap.add(`${x},40`)
    }

    // Outdoor collisions — toilet building walls
    for (let x = 2; x <= 8; x++) {
      collisionMap.add(`${x},48`)
      collisionMap.add(`${x},53`)
    }
    for (let z = 48; z <= 53; z++) {
      collisionMap.add(`2,${z}`)
      collisionMap.add(`8,${z}`)
    }
    // Toilet door gap
    collisionMap.delete('5,48')
    collisionMap.delete('6,48')

    // Pond edge (east side, near tables area)
    for (let x = 30; x <= 38; x++) {
      for (let z = 50; z <= 56; z++) {
        collisionMap.add(`${x},${z}`)
      }
    }

    // Bar counter TOP surface only (customers can't cross, bartender is behind it)
    // Bar runs along z=8, from x=20 to x=40
    for (let x = 20; x <= 40; x++) {
      collisionMap.add(`${x},8`)
    }
    // Bar corner piece going down
    collisionMap.add(`40,7`)
    collisionMap.add(`40,6`)
    collisionMap.add(`40,5`)

    // Stage — raised area, edges are collision to prevent audience walking on
    // Stage is at z=2-6, x=2-14. Only the EDGE is collision, DJ walks inside
    for (let x = 2; x <= 14; x++) {
      collisionMap.add(`${x},2`) // back edge
    }
    for (let z = 2; z <= 7; z++) {
      collisionMap.add(`2,${z}`) // left edge
      collisionMap.add(`14,${z}`) // right edge
    }
    // Front edge of stage (z=7) — with gap for DJ to enter at x=8
    for (let x = 2; x <= 14; x++) {
      if (x !== 8 && x !== 9) collisionMap.add(`${x},7`)
    }

    // Tables (just the table surface, chairs around are walkable)
    const tables = [[18, 18], [24, 18], [18, 24], [24, 24], [18, 30], [24, 30]]
    tables.forEach(([tx, tz]) => {
      collisionMap.add(`${tx},${tz}`)
      collisionMap.add(`${tx + 1},${tz}`)
    })

    // Booths — back wall only
    for (let z = 17; z <= 20; z++) collisionMap.add(`2,${z}`)
    for (let z = 23; z <= 26; z++) collisionMap.add(`2,${z}`)

    // Pool table
    for (let x = 6; x <= 10; x++) {
      collisionMap.add(`${x},28`)
      collisionMap.add(`${x},29`)
    }

    // Slot machines (the machines themselves)
    for (let z = 30; z <= 34; z++) {
      collisionMap.add(`41,${z}`)
      collisionMap.add(`42,${z}`)
    }

    // Kitchen wall (back-right corner)
    for (let x = 38; x <= 43; x++) collisionMap.add(`${x},10`)
    // Kitchen door gap
    collisionMap.delete('39,10')
    collisionMap.delete('40,10')

    // Toilet divider wall (z=34, x=0 to x=10, door gap at x=3)
    for (let x = 0; x <= 10; x++) {
      if (x !== 3) collisionMap.add(`${x},34`)
    }

    // Sofa / TV area furniture
    for (let z = 20; z <= 24; z++) {
      collisionMap.add(`38,${z}`)  // sofa body
    }
    collisionMap.add(`40,22`)  // coffee table

    // Food pickup counter
    collisionMap.add(`38,12`)
    collisionMap.add(`39,12`)

    // Fish tank
    collisionMap.add(`21,1`)
    collisionMap.add(`22,1`)
    collisionMap.add(`23,1`)

    set({ collisionMap, generated: true })
  },

  isWalkable: (worldX, worldZ) => {
    const x = Math.floor(worldX)
    const z = Math.floor(worldZ)
    if (x < 1 || x >= WORLD_SIZE - 1) return false
    if (z < 1 || z >= OUTDOOR_DEPTH) return false
    return !get().collisionMap.has(`${x},${z}`)
  },

  getHeightAt: () => 0,

  findLocation: (name) => {
    const key = name.toLowerCase().replace(/\s/g, '_')
    return RESTAURANT_LOCATIONS[key] || null
  },
}))

export default useWorldStore
