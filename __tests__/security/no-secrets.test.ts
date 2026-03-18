/**
 * Security test: ensures no secrets, API keys, or tokens are
 * hardcoded in tracked source files.
 *
 * Runs as part of `npm test` — must pass before any push/deploy.
 */
import { execSync } from 'child_process'

// Patterns that indicate a leaked secret (regex + label)
const SECRET_PATTERNS: [RegExp, string][] = [
  // Generic API keys
  [/sk-or-v1-[a-zA-Z0-9]{48,}/, 'OpenRouter API key'],
  [/sk-[a-zA-Z0-9]{32,}/, 'Generic secret key (sk-...)'],

  // Supabase service role key (JWT with "service_role")
  [/eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]*c2VydmljZV9yb2xl[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+/, 'Supabase service_role JWT'],

  // VAPID private keys (base64url, typically 43 chars)
  [/VAPID_PRIVATE_KEY\s*[:=]\s*['"][A-Za-z0-9_-]{40,}['"]/, 'VAPID private key hardcoded'],

  // AWS-style keys
  [/AKIA[0-9A-Z]{16}/, 'AWS Access Key'],
  [/aws_secret_access_key\s*[:=]\s*['"][^'"]{20,}['"]/, 'AWS Secret Key'],

  // Private keys (PEM)
  [/-----BEGIN (RSA |EC )?PRIVATE KEY-----/, 'PEM private key'],

  // Generic "password = actual_value" (not a variable reference or placeholder)
  [/(?:password|secret|token)\s*[:=]\s*['"][^'"]{8,}['"](?!.*\{\{)(?!.*process\.env)(?!.*placeholder)/i, 'Hardcoded password/secret/token'],
]

// Files & directories to skip (gitignored, test fixtures, etc.)
const IGNORE_GLOBS = [
  '.env',
  '.env.*',
  'node_modules',
  '.next',
  '.git',
  '__tests__/security', // don't flag our own patterns
  '*.lock',
  'tsconfig.tsbuildinfo',
]

// These files are known to contain demo/mock credentials (not real secrets)
const ALLOWLISTED_FILES = new Set([
  'app/(auth)/login/page.tsx',       // demo account hints in UI
  'app/(auth)/register/page.tsx',    // demo hints
  'CLAUDE.md',                       // documentation of demo accounts
  'lib/mock-data.ts',                // mock data with fake passwords
  'app/dashboard/equipo/page.tsx',   // demo camarero docs
  'scripts/seed-supabase.mjs',       // seed script with demo passwords
  'scripts/seed-remaining.mjs',      // seed script with demo passwords
  'prisma/seed.cjs',                 // seed script
  'prisma/seed.ts',                  // seed script
])

function getTrackedFiles(): string[] {
  const output = execSync('git ls-files --cached', {
    encoding: 'utf-8',
    cwd: process.cwd(),
  })
  return output.trim().split('\n').filter(Boolean)
}

function shouldSkipFile(filePath: string): boolean {
  // Skip binary / non-text extensions
  const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.svg', '.mp3', '.wav', '.pdf']
  if (binaryExts.some((ext) => filePath.endsWith(ext))) return true

  // Skip ignored globs
  for (const glob of IGNORE_GLOBS) {
    if (filePath.includes(glob.replace('*', ''))) return true
  }

  return false
}

describe('Security — No secrets in tracked files', () => {
  let trackedFiles: string[]

  beforeAll(() => {
    trackedFiles = getTrackedFiles()
  })

  test('.env.local is NOT tracked by git', () => {
    expect(trackedFiles).not.toContain('.env.local')
  })

  test('.env.local is listed in .gitignore', () => {
    const gitignore = execSync('cat .gitignore', { encoding: 'utf-8', cwd: process.cwd() })
    // Check that .env.local or .env* is in .gitignore
    const hasEnvIgnore = gitignore.includes('.env.local') || gitignore.includes('.env*') || gitignore.includes('.env.')
    expect(hasEnvIgnore).toBe(true)
  })

  test('no secrets or API keys in tracked source files', () => {
    const violations: string[] = []

    for (const file of trackedFiles) {
      if (shouldSkipFile(file)) continue
      if (ALLOWLISTED_FILES.has(file)) continue

      let content: string
      try {
        content = execSync(`git show HEAD:${file}`, { encoding: 'utf-8', cwd: process.cwd() })
      } catch {
        // File might be staged but not committed yet — read from working tree
        try {
          content = require('fs').readFileSync(file, 'utf-8')
        } catch {
          continue
        }
      }

      for (const [pattern, label] of SECRET_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${file}: ${label}`)
        }
      }
    }

    expect(violations).toEqual([])
  })

  test('no .env files (except .env.example) are tracked', () => {
    const envFiles = trackedFiles.filter(
      (f) => f.match(/^\.env(\..+)?$/) && f !== '.env.example'
    )
    expect(envFiles).toEqual([])
  })

  test('SUPABASE_SERVICE_ROLE_KEY is never used client-side', () => {
    const clientFiles = trackedFiles.filter(
      (f) => (f.startsWith('components/') || f.startsWith('app/')) &&
             (f.endsWith('.tsx') || f.endsWith('.ts')) &&
             !f.includes('/api/')  // API routes are server-side
    )

    const violations: string[] = []
    for (const file of clientFiles) {
      let content: string
      try {
        content = execSync(`git show HEAD:${file}`, { encoding: 'utf-8', cwd: process.cwd() })
      } catch {
        try { content = require('fs').readFileSync(file, 'utf-8') } catch { continue }
      }

      if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        violations.push(file)
      }
    }

    expect(violations).toEqual([])
  })
})
