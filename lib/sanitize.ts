/**
 * Utilidades de sanitización para prevenir XSS y limpiar inputs.
 */

/**
 * Elimina tags HTML peligrosos del input.
 * Permite texto plano sin ningún markup HTML.
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Limpia un string de caracteres de control y normaliza espacios.
 */
export function sanitizeText(input: string): string {
  return input
    // Eliminar caracteres de control (excepto newline y tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalizar múltiples espacios
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Sanitiza un objeto completo — limpia todos los valores string.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj }
  for (const key in sanitized) {
    const value = sanitized[key]
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeText(value)
    }
  }
  return sanitized
}

/**
 * Valida que una URL sea segura (https o http, no javascript:, data:, etc.)
 */
export function isSecureUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Sanitiza un slug para URLs.
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
