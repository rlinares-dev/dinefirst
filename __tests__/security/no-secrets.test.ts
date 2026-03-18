/**
 * Security test: ensures no secrets, API keys, or tokens are
 * hardcoded in tracked source files.
 *
 * Runs as part of `npm test` — must pass before any push/deploy.
 */
import { execSync } from 'child_process'

// ── HIGH-severity patterns: NEVER allowed in any file ──────────────────────
const CRITICAL_PATTERNS: [RegExp, string][] = [
  // OpenRouter API key
  [/sk-or-v1-[a-zA-Z0-9]{48,}/, 'OpenRouter API key'],
  // Generic long secret key
  [/sk-[a-zA-Z0-9]{32,}/, 'Generic secret key (sk-...)'],
  // Supabase service role JWT (base64-encoded "service_role")
  [/eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]*c2VydmljZV9yb2xl[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+/, 'Supabase service_role JWT'],
  // VAPID private key assigned to a literal value
  [/VAPID_PRIVATE_KEY\s*[:=]\s*['"][A-Za-z0-9_-]{40,}['"]/, 'VAPID private key hardcoded'],
  // AWS-style keys
  [/AKIA[0-9A-Z]{16}/, 'AWS Access Key'],
  [/aws_secret_access_key\s*[:=]\s*['"][^'"]{20,}['"]/, 'AWS Secret Key'],
  // PEM private keys
  [/-----BEGIN (RSA |EC )?PRIVATE KEY-----/, 'PEM private key'],
]

// ── LOW-severity patterns: allowed in demo/seed files ──────────────────────
const DEMO_PATTERNS: [RegExp, string][] = [
  [/(?:password|secret|token)\s*[:=]\s*['"][^'"]{8,}['"](?!.*\{\{)(?!.*process\.env)(?!.*placeholder)/i, 'Hardcoded password/secret/token'],
]

// Files that may contain demo passwords (password123, etc.) — NOT real keys
const DEMO_ALLOWLISTED_FILES = new Set([
  'app/(auth)/login/page.tsx',
  'app/(auth)/register/page.tsx',
  'CLAUDE.md',
  'lib/mock-data.ts',
  'app/dashboard/equipo/page.tsx',
  'scripts/seed-supabase.mjs',
  'scripts/seed-remaining.mjs',
  'prisma/seed.cjs',
  'prisma/seed.ts',
])

// Files & directories to skip entirely
const IGNORE_GLOBS = [
  '.env',
  '.env.*',
  'node_modules',
  '.next',
  '.git',
  '__tests__/security',
  '*.lock',
  'tsconfig.tsbuildinfo',
]

function getTrackedFiles(): string[] {
  const output = execSync('git ls-files --cached', {
    encoding: 'utf-8',
    cwd: process.cwd(),
  })
  return output.trim().split('\n').filter(Boolean)
}

function shouldSkipFile(filePath: string): boolean {
  const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.svg', '.mp3', '.wav', '.pdf']
  if (binaryExts.some((ext) => filePath.endsWith(ext))) return true
  for (const glob of IGNORE_GLOBS) {
    if (filePath.includes(glob.replace('*', ''))) return true
  }
  return false
}

function readFileContent(file: string): string | null {
  try {
    return execSync(`git show HEAD:${file}`, { encoding: 'utf-8', cwd: process.cwd() })
  } catch {
    try {
      return require('fs').readFileSync(file, 'utf-8')
    } catch {
      return null
    }
  }
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
    const hasEnvIgnore = gitignore.includes('.env.local') || gitignore.includes('.env*') || gitignore.includes('.env.')
    expect(hasEnvIgnore).toBe(true)
  })

  test('no real API keys or tokens in ANY tracked file', () => {
    const violations: string[] = []

    for (const file of trackedFiles) {
      if (shouldSkipFile(file)) continue

      const content = readFileContent(file)
      if (!content) continue

      // Critical patterns are NEVER allowed — no exceptions
      for (const [pattern, label] of CRITICAL_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${file}: ${label}`)
        }
      }
    }

    expect(violations).toEqual([])
  })

  test('no hardcoded passwords in non-demo files', () => {
    const violations: string[] = []

    for (const file of trackedFiles) {
      if (shouldSkipFile(file)) continue
      if (DEMO_ALLOWLISTED_FILES.has(file)) continue

      const content = readFileContent(file)
      if (!content) continue

      for (const [pattern, label] of DEMO_PATTERNS) {
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
             !f.includes('/api/')
    )

    const violations: string[] = []
    for (const file of clientFiles) {
      const content = readFileContent(file)
      if (!content) continue

      if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        violations.push(file)
      }
    }

    expect(violations).toEqual([])
  })
})
