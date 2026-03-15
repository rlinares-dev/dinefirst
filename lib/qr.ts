/**
 * QR code data utilities for table identification.
 * QR codes encode a simple string: "df-{restaurantId}-{tableId}"
 */

export function generateTableQRData(tableId: string, restaurantId: string): string {
  return `df-${restaurantId}-${tableId}`
}

export function parseQRCode(code: string): { tableId: string; restaurantId: string } | null {
  if (!code.startsWith('df-')) return null
  const parts = code.split('-')
  // Format: df-{restaurantId}-{tableId}
  if (parts.length < 3) return null
  // restaurantId may contain hyphens, tableId is the last segment
  const restaurantId = parts.slice(1, -1).join('-')
  const tableId = parts[parts.length - 1]
  if (!restaurantId || !tableId) return null
  return { restaurantId, tableId }
}
