import { z } from 'zod'

// ============================================
// Schemas de validación Zod para todos los formularios
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s'-]+$/, 'Solo letras, espacios y guiones'),
  email: z.string().email('Email inválido'),
  phone: z
    .string()
    .regex(/^\+?[0-9\s()-]{9,15}$/, 'Formato de teléfono inválido')
    .or(z.literal('')),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
  role: z.enum(['comensal', 'restaurante']),
})

export const reservationSchema = z.object({
  restaurantId: z.string().min(1, 'Restaurante requerido'),
  tableId: z.string().min(1, 'Mesa requerida'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  partySize: z.number().int().min(1, 'Mínimo 1 persona').max(20, 'Máximo 20 personas'),
  specialRequests: z.string().max(500, 'Máximo 500 caracteres').default(''),
  whatsappConsent: z.boolean().default(false),
})

export const restaurantSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  city: z.string().min(1, 'Ciudad requerida'),
  address: z.string().max(200, 'Máximo 200 caracteres').default(''),
  cuisineType: z.string().max(50, 'Máximo 50 caracteres').default(''),
  capacity: z.number().int().min(1).max(1000).default(20),
  description: z.string().max(1000, 'Máximo 1000 caracteres').default(''),
  phone: z.string().max(20).default(''),
  openingHours: z.string().max(100).default(''),
})

export const tableSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(50, 'Máximo 50 caracteres'),
  capacity: z.number().int().min(1, 'Mínimo 1 persona').max(20, 'Máximo 20 personas'),
  location: z.string().max(50, 'Máximo 50 caracteres').default(''),
  status: z.enum(['free', 'occupied', 'en_route', 'reserved', 'inactive']).default('free'),
})

export const orderItemSchema = z.object({
  menuItemId: z.string().min(1, 'Item requerido'),
  name: z.string().min(1),
  price: z.number().min(0),
  quantity: z.number().int().min(1, 'Mínimo 1 unidad').max(50, 'Máximo 50 unidades'),
  notes: z.string().max(200, 'Máximo 200 caracteres').default(''),
})

export const orderSchema = z.object({
  sessionId: z.string().min(1, 'Sesión requerida'),
  tableId: z.string().min(1, 'Mesa requerida'),
  restaurantId: z.string().min(1, 'Restaurante requerido'),
  items: z.array(orderItemSchema).min(1, 'Al menos un item requerido'),
  notes: z.string().max(500, 'Máximo 500 caracteres').default(''),
})

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').default(''),
  price: z.number().min(0, 'Precio inválido').max(9999, 'Precio demasiado alto'),
  category: z.enum(['entrantes', 'principales', 'postres', 'bebidas']),
  isAvailable: z.boolean().default(true),
})

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating mínimo 1').max(5, 'Rating máximo 5'),
  comment: z
    .string()
    .min(10, 'Mínimo 10 caracteres para tu reseña')
    .max(1000, 'Máximo 1000 caracteres'),
})

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  phone: z
    .string()
    .regex(/^\+?[0-9\s()-]{9,15}$/, 'Formato de teléfono inválido')
    .or(z.literal('')),
})

// ============================================
// Helper para extraer errores de Zod
// ============================================

export function getZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  error.errors.forEach((err) => {
    if (err.path.length > 0) {
      errors[err.path[0] as string] = err.message
    }
  })
  return errors
}

export function validateField(
  schema: z.ZodObject<z.ZodRawShape>,
  field: string,
  value: unknown
): string | null {
  const fieldSchema = schema.shape[field]
  if (!fieldSchema) return null
  const result = fieldSchema.safeParse(value)
  if (!result.success) {
    return result.error.errors[0]?.message ?? 'Valor inválido'
  }
  return null
}
