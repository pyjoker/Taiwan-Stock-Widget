import { join } from 'path'
import { spawn } from 'child_process'
import { is } from '@electron-toolkit/utils'
import type { StockSymbol, StockInfo } from '../../src/types/stock'

// ─── Python bridge ────────────────────────────────────────────────────────────

// Dev: project root / Prod: resources/ (via electron-builder extraResources)
const SCRIPT_PATH = is.dev
  ? join(process.cwd(), 'stock_bridge.py')
  : join(process.resourcesPath, 'stock_bridge.py')

// Project root (dev: cwd; prod: not needed since venv ships with the app)
const PROJECT_ROOT = is.dev ? process.cwd() : process.resourcesPath

// venv Python paths relative to project root
const VENV_PYTHON = process.platform === 'win32'
  ? join(PROJECT_ROOT, 'venv', 'Scripts', 'python.exe')
  : join(PROJECT_ROOT, 'venv', 'bin', 'python3')

// Python executable candidates (tried in order, first success is cached)
// venv Python is tried first so its packages (yahooquery, requests) are available
const PYTHON_CANDIDATES = process.platform === 'win32'
  ? [VENV_PYTHON, 'py', 'python', 'python3']
  : [VENV_PYTHON, 'python3', 'python']

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
        return
      }

      // Python exited non-zero: prefer the JSON error message from stdout,
      // then fall back to the last non-empty line of stderr (the actual exception).
      let message = ''
      try {
        const parsed = JSON.parse(stdout.trim()) as { error?: string }
        if (parsed?.error) message = parsed.error
      } catch {
        // stdout is not JSON (e.g. import error before try/except)
      }

      if (!message) {
        // Extract last meaningful line from stderr traceback
        const lines = stderr.split('\n').map((l) => l.trim()).filter(Boolean)
        message = lines.at(-1) ?? stderr.trim()
      }

      reject(new Error(message || `Python exited ${code}`))
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

export interface FetchResult {
  stocks: StockInfo[]
  error: string | null
}

export async function fetchStocksFromYahoo(symbols: StockSymbol[]): Promise<FetchResult> {
  if (symbols.length === 0) return { stocks: [], error: null }

  const now = Date.now()
  if (now - lastFetchAt < CACHE_TTL && cache.length > 0) {
    return { stocks: cache, error: null }
  }

  try {
    const output = await runPython([SCRIPT_PATH, 'fetch', JSON.stringify(symbols)])
    const result: StockInfo[] = JSON.parse(output)
    if (result.length > 0) {
      cache = result
      lastFetchAt = Date.now()
    }
    return { stocks: result, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[stockBridge] fetchStocksFromYahoo failed:', message)
    return {
      stocks: cache.length > 0 ? cache : [],
      error: message
    }
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
