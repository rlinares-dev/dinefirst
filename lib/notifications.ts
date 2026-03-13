/**
 * ─── Sistema de Notificaciones DineFirst ─────────────────────────────────────
 *
 * Este módulo gestiona las notificaciones por WhatsApp cuando se crea una reserva.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * MODO TEST (activo por defecto):
 *   - Simula el envío de WhatsApp con console.log
 *   - Muestra un toast visual en la UI al comensal
 *   - Envía un webhook a n8n (si N8N_WEBHOOK_URL está configurado)
 *   - Para probar con tu móvil: configura n8n con Twilio sandbox
 *
 * MODO PRODUCCIÓN (comentado, listo para activar):
 *   - Envía WhatsApp real via Twilio API
 *   - Requiere: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
 *   - Requiere: plantillas aprobadas por Meta
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * LEGAL (España/UE — RGPD + LSSI):
 *   - Confirmaciones de reserva = comunicación transaccional (Art. 6.1.b RGPD)
 *   - NO necesita consentimiento extra si es estrictamente transaccional
 *   - PERO: el checkbox de consentimiento WhatsApp se incluye por buenas prácticas
 *   - NUNCA enviar ofertas/marketing por este canal sin consentimiento explícito
 *   - El restaurante (B2B) recibe notificaciones bajo la relación contractual SaaS
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { Reservation, Restaurant } from '@/types/database'

// ─── Configuración ───────────────────────────────────────────────────────────

/** Cambiar a 'production' cuando Twilio esté configurado */
const NOTIFICATION_MODE: 'test' | 'production' = 'test'

/**
 * URL del webhook de n8n para pruebas
 * Configura esto con tu instancia de n8n:
 * 1. Crea un workflow en n8n con un nodo "Webhook" como trigger
 * 2. Copia la URL del webhook aquí
 * 3. En n8n, añade un nodo "Twilio" → Send WhatsApp (sandbox)
 *
 * Para pruebas con Twilio Sandbox:
 * 1. Ve a https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
 * 2. Escanea el QR con tu móvil para unirte al sandbox
 * 3. Usa el número sandbox como TWILIO_WHATSAPP_NUMBER
 */
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ''

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface NotificationPayload {
  type: 'reservation_created' | 'reservation_confirmed' | 'reservation_cancelled'
  reservation: {
    id: string
    confirmationCode: string
    restaurantName: string
    userName: string
    userPhone: string
    date: string
    time: string
    partySize: number
    specialRequests: string
  }
  restaurant: {
    name: string
    phone: string
    address: string
  }
  timestamp: string
}

interface NotificationResult {
  success: boolean
  mode: 'test' | 'production'
  sentTo: string[]
  errors?: string[]
}

// ─── Funciones de formato ────────────────────────────────────────────────────

function formatReservationMessage(payload: NotificationPayload, target: 'comensal' | 'restaurante'): string {
  const { reservation, restaurant } = payload

  if (target === 'comensal') {
    return [
      `🎉 *Reserva solicitada en ${restaurant.name}*`,
      '',
      `📅 Fecha: ${reservation.date}`,
      `🕐 Hora: ${reservation.time}`,
      `👥 Personas: ${reservation.partySize}`,
      `📋 Código: ${reservation.confirmationCode}`,
      '',
      `📍 ${restaurant.address}`,
      reservation.specialRequests ? `💬 Nota: ${reservation.specialRequests}` : '',
      '',
      `El restaurante confirmará tu reserva en breve.`,
      '',
      `— DineFirst`,
    ].filter(Boolean).join('\n')
  }

  return [
    `🔔 *Nueva reserva en ${restaurant.name}*`,
    '',
    `👤 ${reservation.userName}`,
    `📞 ${reservation.userPhone}`,
    `📅 ${reservation.date} a las ${reservation.time}`,
    `👥 ${reservation.partySize} personas`,
    `📋 Código: ${reservation.confirmationCode}`,
    reservation.specialRequests ? `💬 Petición: ${reservation.specialRequests}` : '',
    '',
    `Gestiona esta reserva desde tu panel DineFirst.`,
  ].filter(Boolean).join('\n')
}

function buildPayload(reservation: Reservation, restaurant: Restaurant): NotificationPayload {
  return {
    type: 'reservation_created',
    reservation: {
      id: reservation.id,
      confirmationCode: reservation.confirmationCode,
      restaurantName: restaurant.name,
      userName: reservation.userName,
      userPhone: reservation.userPhone,
      date: reservation.date,
      time: reservation.time,
      partySize: reservation.partySize,
      specialRequests: reservation.specialRequests,
    },
    restaurant: {
      name: restaurant.name,
      phone: restaurant.phone,
      address: restaurant.address,
    },
    timestamp: new Date().toISOString(),
  }
}

// ─── MODO TEST ───────────────────────────────────────────────────────────────

async function sendTestNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const sentTo: string[] = []
  const errors: string[] = []

  // 1. Log en consola (siempre)
  console.log('━━━ DineFirst Notification (TEST MODE) ━━━')
  console.log('📱 WhatsApp al comensal:')
  console.log(formatReservationMessage(payload, 'comensal'))
  console.log('')
  console.log('📱 WhatsApp al restaurante:')
  console.log(formatReservationMessage(payload, 'restaurante'))
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  sentTo.push('console')

  // 2. Enviar a n8n webhook (si está configurado)
  if (N8N_WEBHOOK_URL) {
    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          // Mensajes formateados para que n8n los envíe directamente
          messages: {
            comensal: formatReservationMessage(payload, 'comensal'),
            restaurante: formatReservationMessage(payload, 'restaurante'),
          },
        }),
      })
      if (res.ok) {
        sentTo.push('n8n-webhook')
        console.log('✅ Webhook n8n enviado correctamente')
      } else {
        errors.push(`n8n webhook failed: ${res.status}`)
        console.warn('⚠️ Webhook n8n falló:', res.status)
      }
    } catch (err) {
      errors.push(`n8n webhook error: ${err}`)
      console.warn('⚠️ Error enviando webhook n8n:', err)
    }
  }

  return { success: true, mode: 'test', sentTo, errors: errors.length > 0 ? errors : undefined }
}

// ─── MODO PRODUCCIÓN (comentado — descomentar cuando Twilio esté listo) ─────
//
// Para activar:
// 1. Instalar: npm install twilio
// 2. Configurar variables de entorno en .env.local:
//    TWILIO_ACCOUNT_SID=ACxxxxxxxxx
//    TWILIO_AUTH_TOKEN=xxxxxxxxx
//    TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
// 3. Cambiar NOTIFICATION_MODE a 'production'
// 4. Aprobar plantillas en Meta WhatsApp Business
//
// ─────────────────────────────────────────────────────────────────────────────
//
// import twilio from 'twilio'
//
// const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID!
// const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!
// const TWILIO_WA = process.env.TWILIO_WHATSAPP_NUMBER! // 'whatsapp:+14155238886'
//
// async function sendProductionNotification(payload: NotificationPayload): Promise<NotificationResult> {
//   const client = twilio(TWILIO_SID, TWILIO_TOKEN)
//   const sentTo: string[] = []
//   const errors: string[] = []
//
//   // Enviar al comensal
//   if (payload.reservation.userPhone) {
//     try {
//       await client.messages.create({
//         from: TWILIO_WA,
//         to: `whatsapp:${payload.reservation.userPhone}`,
//         body: formatReservationMessage(payload, 'comensal'),
//       })
//       sentTo.push(payload.reservation.userPhone)
//     } catch (err: unknown) {
//       const msg = err instanceof Error ? err.message : String(err)
//       errors.push(`Comensal WhatsApp failed: ${msg}`)
//     }
//   }
//
//   // Enviar al restaurante
//   if (payload.restaurant.phone) {
//     try {
//       await client.messages.create({
//         from: TWILIO_WA,
//         to: `whatsapp:${payload.restaurant.phone}`,
//         body: formatReservationMessage(payload, 'restaurante'),
//       })
//       sentTo.push(payload.restaurant.phone)
//     } catch (err: unknown) {
//       const msg = err instanceof Error ? err.message : String(err)
//       errors.push(`Restaurant WhatsApp failed: ${msg}`)
//     }
//   }
//
//   // Backup: también enviar a n8n para que quede registro
//   if (N8N_WEBHOOK_URL) {
//     try {
//       await fetch(N8N_WEBHOOK_URL, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ ...payload, deliveryStatus: { sentTo, errors } }),
//       })
//     } catch {
//       // No bloquear si n8n falla
//     }
//   }
//
//   return {
//     success: errors.length === 0,
//     mode: 'production',
//     sentTo,
//     errors: errors.length > 0 ? errors : undefined,
//   }
// }

// ─── API Pública ─────────────────────────────────────────────────────────────

/**
 * Envía notificaciones de nueva reserva por WhatsApp.
 * En modo test: log en consola + webhook n8n.
 * En modo producción: Twilio WhatsApp API real.
 */
export async function notifyReservationCreated(
  reservation: Reservation,
  restaurant: Restaurant
): Promise<NotificationResult> {
  const payload = buildPayload(reservation, restaurant)

  if (NOTIFICATION_MODE === 'test') {
    return sendTestNotification(payload)
  }

  // Producción: descomentar cuando esté listo
  // return sendProductionNotification(payload)

  // Fallback mientras no esté activado
  return sendTestNotification(payload)
}

/**
 * Verifica si las notificaciones están configuradas correctamente.
 * Útil para mostrar estado en el dashboard.
 */
export function getNotificationStatus(): {
  mode: 'test' | 'production'
  n8nConfigured: boolean
  twilioConfigured: boolean
} {
  return {
    mode: NOTIFICATION_MODE,
    n8nConfigured: !!N8N_WEBHOOK_URL,
    twilioConfigured: !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER
    ),
  }
}
