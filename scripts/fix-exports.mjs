#!/usr/bin/env node
// Fix packages with broken exports/missing entry files that break Vite 5 on Vercel
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootNmDir = join(__dirname, '..', 'node_modules')

let fixed = 0

function fixPackageEntry(pkgDir, pkgName) {
  const pkgPath = join(pkgDir, 'package.json')
  try {
    const raw = readFileSync(pkgPath, 'utf8')
    const pkg = JSON.parse(raw)

    // Check if module/main entry files actually exist
    const entries = [pkg.module, pkg.main].filter(Boolean)
    for (const entry of entries) {
      // Skip entries without file extensions (Node resolves them automatically)
      if (!entry.includes('.')) continue
      const entryPath = join(pkgDir, entry)
      if (!existsSync(entryPath)) {
        console.log(`  ${pkgName}: entry "${entry}" missing at ${entryPath}`)
        
        // Try to find ANY .js files in the package
        const jsFiles = findJsFiles(pkgDir)
        if (jsFiles.length > 0) {
          // Create the missing file as a re-export of the first found JS file
          const dir = dirname(entryPath)
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
          
          // Find the best candidate (prefer src/index.js, index.js, etc.)
          let bestFile = jsFiles.find(f => f.endsWith('src/index.js'))
            || jsFiles.find(f => f.endsWith('/index.js') && !f.includes('node_modules'))
            || jsFiles.find(f => f.endsWith('.js') && !f.includes('node_modules'))
            || jsFiles[0]
          
          const relativePath = './' + bestFile.replace(pkgDir + '/', '')
          console.log(`  ${pkgName}: creating "${entry}" re-exporting from "${relativePath}"`)
          writeFileSync(entryPath, `export * from '${relativePath}';\n`)
          fixed++
        }
      }
    }
    
    // Also fix broken exports fields
    if (pkg.exports) {
      const exportsStr = JSON.stringify(pkg.exports)
      if (exportsStr === '{}') {
        delete pkg.exports
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
        console.log(`  Fixed: ${pkgName} (removed empty exports)`)
        fixed++
      }
    }
  } catch (e) {
    // skip
  }
}

function findJsFiles(dir, depth = 0) {
  if (depth > 2) return []
  const results = []
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue
      const full = join(dir, entry)
      try {
        const stat = statSync(full)
        if (stat.isFile() && entry.endsWith('.js')) results.push(full)
        if (stat.isDirectory()) results.push(...findJsFiles(full, depth + 1))
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return results
}

function scanNodeModules(nmDir, depth = 0) {
  if (depth > 4) return
  try {
    for (const entry of readdirSync(nmDir)) {
      if (entry.startsWith('.')) continue
      const fullPath = join(nmDir, entry)
      try { if (!statSync(fullPath).isDirectory()) continue } catch { continue }

      if (entry.startsWith('@')) {
        try {
          for (const sub of readdirSync(fullPath)) {
            const subPath = join(fullPath, sub)
            try { if (!statSync(subPath).isDirectory()) continue } catch { continue }
            fixPackageEntry(subPath, `${entry}/${sub}`)
            const nested = join(subPath, 'node_modules')
            if (existsSync(nested)) scanNodeModules(nested, depth + 1)
          }
        } catch { /* skip */ }
        continue
      }

      fixPackageEntry(fullPath, entry)
      const nested = join(fullPath, 'node_modules')
      if (existsSync(nested)) scanNodeModules(nested, depth + 1)
    }
  } catch { /* skip */ }
}

console.log('Scanning node_modules for broken packages...')
scanNodeModules(rootNmDir)
console.log(`Done. Fixed ${fixed} package(s).`)
