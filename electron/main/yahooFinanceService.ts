import { join } from 'path'
import { spawn } from 'child_process'
import { is } from '@electron-toolkit/utils'
import type { StockSymbol, StockInfo } from '../../src/types/stock'

// ─── Python bridge ────────────────────────────────────────────────────────────

// Dev: project root / Prod: resources/ (via electron-builder extraResources)
const SCRIPT_PATH = is.dev
  ? join(process.cwd(), 'stock_bridge.py')
  : join(process.resourcesPath, 'stock_bridge.py')

// Python executable candidates (tried in order, first success is cached)
const PYTHON_CANDIDATES = process.platform === 'win32'
  ? ['py', 'python', 'python3']
  : ['python3', 'python']

let resolvedPythonCmd: string | null = null

function spawnPython(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { env: process.env })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim())
      } else {
        reject(new Error(`[stockBridge] Python exited ${code}: ${stderr.trim()}`))
      }
    })
  })
}

function runPython(args: string[]): Promise<string> {
  if (resolvedPythonCmd) return spawnPython(resolvedPythonCmd, args)

  return new Promise((resolve, reject) => {
    function tryNext(i: number): void {
      if (i >= PYTHON_CANDIDATES.length) {
        reject(new Error('[stockBridge] Python not found. Install Python 3 and run: pip install yahooquery'))
        return
      }
      spawnPython(PYTHON_CANDIDATES[i], args)
        .then((out) => {
          resolvedPythonCmd = PYTHON_CANDIDATES[i]
          resolve(out)
        })
        .catch((err: NodeJS.ErrnoException) => {
          if (err.code === 'ENOENT') {
            tryNext(i + 1) // executable not found, try next candidate
          } else {
            reject(err)
          }
        })
    }
    tryNext(0)
  })
}

// ─── Cache ────────────────────────────────────────────────────────────────────

let cache: StockInfo[] = []
let lastFetchAt = 0
const CACHE_TTL = 15_000 // 15 s — avoid hammering Yahoo between UI refreshes

const marketCache = new Map<string, 'tse' | 'otc'>()

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchStocksFromYahoo(symbols: StockSymbol[]): Promise<StockInfo[]> {
  if (symbols.length === 0) return []

  const now = Date.now()
  if (now - lastFetchAt < CACHE_TTL && cache.length > 0) {
    return cache
  }

  try {
    const output = await runPython([SCRIPT_PATH, 'fetch', JSON.stringify(symbols)])
    const result: StockInfo[] = JSON.parse(output)
    if (result.length > 0) {
      cache = result
      lastFetchAt = Date.now()
    }
    return result
  } catch (err) {
    console.error('[stockBridge] fetchStocksFromYahoo failed:', err)
    return cache.length > 0 ? cache : [] // return stale cache on transient failures
  }
}

export async function autoDetectMarket(code: string): Promise<'tse' | 'otc' | null> {
  if (marketCache.has(code)) return marketCache.get(code)!

  try {
    const output = await runPython([SCRIPT_PATH, 'detect', code])
    const result: 'tse' | 'otc' | null = JSON.parse(output)
    if (result) marketCache.set(code, result)
    return result
  } catch (err) {
    console.error('[stockBridge] autoDetectMarket failed:', err)
    return null
  }
}
