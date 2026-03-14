import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const NM = join(process.cwd(), 'node_modules')

// Build map of ALL package dirs (including deeply nested)
function buildPackageMap() {
  const map = {}
  function scan(nmDir, depth) {
    if (depth > 4 || !existsSync(nmDir)) return
    try {
      for (const entry of readdirSync(nmDir)) {
        if (entry.startsWith('.')) continue
        const full = join(nmDir, entry)
        try { if (!statSync(full).isDirectory()) continue } catch { continue }
        if (entry.startsWith('@')) {
          try {
            for (const sub of readdirSync(full)) {
              const subPath = join(full, sub)
              try { if (!statSync(subPath).isDirectory()) continue } catch { continue }
              const name = `${entry}/${sub}`
              if (!map[name] && existsSync(join(subPath, 'package.json'))) map[name] = subPath
              scan(join(subPath, 'node_modules'), depth + 1)
            }
          } catch {}
        } else {
          if (!map[entry] && existsSync(join(full, 'package.json'))) map[entry] = full
          scan(join(full, 'node_modules'), depth + 1)
        }
      }
    } catch {}
  }
  scan(NM, 0)
  return map
}

function findJsEntry(dir, depth = 0) {
  if (depth > 2 || !existsSync(dir)) return null
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue
      const full = join(dir, entry)
      try {
        const stat = statSync(full)
        if (stat.isFile() && entry.endsWith('.js') && !entry.endsWith('.min.js')) return full
        if (stat.isDirectory() && depth < 2) {
          const found = findJsEntry(full, depth + 1)
          if (found) return found
        }
      } catch {}
    }
  } catch {}
  return null
}

// Check if a package has a valid (existing) entry file
function hasValidEntry(pkgDir) {
  try {
    const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
    for (const field of [pkg.module, pkg.main]) {
      if (!field || !field.includes('.')) continue
      if (existsSync(join(pkgDir, field))) return true
    }
    return false
  } catch { return false }
}

function fixBrokenExports() {
  let packageMap = null
  const VIRTUAL = '\0fix:'

  return {
    name: 'fix-broken-exports',
    enforce: 'pre',

    buildStart() {
      packageMap = buildPackageMap()
    },

    resolveId(id) {
      if (!packageMap) return null
      if (id.startsWith('.') || id.startsWith('/') || id.startsWith('\0') || id.startsWith('node:')) return null
      // ONLY handle bare package names — skip subpath imports like 'zustand/middleware'
      if (id.includes('/') && !id.startsWith('@')) return null
      if (id.startsWith('@') && id.split('/').length > 2) return null

      const pkgDir = packageMap[id]
      if (!pkgDir) return null

      // Only intercept if the package has BROKEN entries
      if (hasValidEntry(pkgDir)) return null

      // Try to resolve manually
      try {
        const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
        for (const field of [pkg.module, pkg.main]) {
          if (!field) continue
          const resolved = join(pkgDir, field)
          if (existsSync(resolved + '.js')) return resolved + '.js'
          if (existsSync(join(resolved, 'index.js'))) return join(resolved, 'index.js')
        }
      } catch {}

      // Last resort: find any JS file
      const found = findJsEntry(pkgDir)
      if (found) return VIRTUAL + id + ':' + found
      return null
    },

    load(id) {
      if (!id.startsWith(VIRTUAL)) return null
      const filePath = id.split(':').slice(2).join(':')
      try { return readFileSync(filePath, 'utf8') }
      catch { return 'export default {}' }
    }
  }
}

export default defineConfig({
  plugins: [fixBrokenExports(), react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
})
