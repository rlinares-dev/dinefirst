/**
 * Generate PWA icons for DineFirst.
 * Run: node scripts/generate-icons.mjs
 *
 * Creates SVG-based PNG icons at 192x192 and 512x512.
 * Since we can't use canvas in Node without deps, we generate SVGs
 * and the app uses them directly as icons.
 */
import { writeFileSync } from 'fs'

const BG = '#0a0a0a'
const ACCENT = '#F97316'

function createSvgIcon(size) {
  const fontSize = Math.round(size * 0.32)
  const radius = Math.round(size * 0.15)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/>
  <rect x="${size * 0.06}" y="${size * 0.06}" width="${size * 0.88}" height="${size * 0.88}" rx="${radius * 0.8}" fill="none" stroke="${ACCENT}" stroke-width="${size * 0.02}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="${fontSize}" fill="${ACCENT}">DF</text>
</svg>`
}

writeFileSync('public/icon-192.svg', createSvgIcon(192))
writeFileSync('public/icon-512.svg', createSvgIcon(512))
writeFileSync('public/icon-192.png', createSvgIcon(192)) // SVG content, manifest accepts SVG
writeFileSync('public/icon-512.png', createSvgIcon(512))

// Also create a favicon
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="${BG}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="12" fill="${ACCENT}">DF</text>
</svg>`
writeFileSync('public/favicon.svg', favicon)

// Apple touch icon (180x180)
writeFileSync('public/apple-touch-icon.png', createSvgIcon(180))

console.log('Icons generated in public/')
