/**
 * DineFirst — Email Service (Resend)
 *
 * Handles all transactional emails:
 * - Confirmación de reserva
 * - Cancelación de reserva
 * - Bienvenida (nuevo usuario)
 * - Recordatorio de reserva (24h antes)
 *
 * En dev sin RESEND_API_KEY, los emails se loguean en consola.
 */

import { Resend } from 'resend'

// ── Config ───────────────────────────────────────────────────────────

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'DineFirst <noreply@dinefirst.com>'

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export function isEmailConfigured(): boolean {
  return !!resend
}

// ── Types ────────────────────────────────────────────────────────────

export interface ReservationEmailData {
  userName: string
  userEmail: string
  restaurantName: string
  date: string        // YYYY-MM-DD
  time: string        // HH:MM
  partySize: number
  confirmationCode: string
  specialRequests?: string
}

export interface WelcomeEmailData {
  userName: string
  userEmail: string
  role: 'comensal' | 'restaurante'
}

export interface CancellationEmailData {
  userName: string
  userEmail: string
  restaurantName: string
  date: string
  time: string
  confirmationCode: string
}

export interface ReminderEmailData {
  userName: string
  userEmail: string
  restaurantName: string
  date: string
  time: string
  partySize: number
  confirmationCode: string
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ── Email Templates (HTML) ───────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,system-ui,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <span style="display:inline-block;background:#F97316;color:#fff;font-weight:800;font-size:18px;padding:8px 16px;border-radius:12px;">DF</span>
    <span style="color:#F97316;font-weight:700;font-size:20px;margin-left:8px;vertical-align:middle;">DineFirst</span>
  </div>
  <div style="background:#1a1a1a;border:1px solid #333;border-radius:16px;padding:32px;color:#F9FAFB;">
    ${content}
  </div>
  <div style="text-align:center;margin-top:24px;color:#6b7280;font-size:12px;">
    <p>© ${new Date().getFullYear()} DineFirst · Gestión inteligente de restaurantes</p>
    <p style="margin-top:4px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dinefirst.com'}" style="color:#F97316;text-decoration:none;">dinefirst.com</a>
    </p>
  </div>
</div>
</body>
</html>`
}

function reservationConfirmationHtml(data: ReservationEmailData): string {
  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#F97316;">Reserva confirmada ✓</h1>
    <p style="margin:0 0 24px;color:#9CA3AF;font-size:14px;">¡Hola ${data.userName}! Tu reserva está lista.</p>

    <div style="background:#0a0a0a;border-radius:12px;padding:20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;color:#F9FAFB;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#9CA3AF;">Restaurante</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;">${data.restaurantName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9CA3AF;">Fecha</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;">${formatDate(data.date)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9CA3AF;">Hora</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;">${data.time}h</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9CA3AF;">Comensales</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;">${data.partySize} personas</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9CA3AF;border-top:1px solid #333;padding-top:16px;">Código</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;font-size:18px;color:#F97316;border-top:1px solid #333;padding-top:16px;">${data.confirmationCode}</td>
        </tr>
      </table>
    </div>
    ${data.specialRequests ? `<p style="margin:0 0 16px;color:#9CA3AF;font-size:13px;font-style:italic;">Nota: "${data.specialRequests}"</p>` : ''}
    <p style="margin:0;color:#9CA3AF;font-size:13px;">Presenta tu código de confirmación al llegar. Si necesitas modificar o cancelar tu reserva, hazlo desde tu perfil en la app.</p>
  `)
}

function cancellationHtml(data: CancellationEmailData): string {
  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#EF4444;">Reserva cancelada</h1>
    <p style="margin:0 0 24px;color:#9CA3AF;font-size:14px;">Hola ${data.userName}, tu reserva ha sido cancelada.</p>

    <div style="background:#0a0a0a;border-radius:12px;padding:20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;color:#F9FAFB;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#9CA3AF;">Restaurante</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;">${data.restaurantName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9CA3AF;">Fecha</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;text-decoration:line-through;color:#EF4444;">${formatDate(data.date)} · ${data.time}h</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9CA3AF;">Código</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#6b7280;">${data.confirmationCode}</td>
        </tr>
      </table>
    </div>
    <p style="margin:0;color:#9CA3AF;font-size:13px;">Puedes hacer una nueva reserva cuando quieras desde la app. ¡Te esperamos!</p>
  `)
}

function welcomeHtml(data: WelcomeEmailData): string {
  const isRestaurant = data.role === 'restaurante'
  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#F97316;">¡Bienvenido a DineFirst!</h1>
    <p style="margin:0 0 24px;color:#9CA3AF;font-size:14px;">Hola ${data.userName}, tu cuenta ha sido creada con éxito.</p>

    <div style="background:#0a0a0a;border-radius:12px;padding:20px;margin-bottom:20px;">
      ${isRestaurant ? `
        <h3 style="margin:0 0 12px;font-size:16px;color:#F9FAFB;">Próximos pasos:</h3>
        <ol style="margin:0;padding-left:20px;color:#9CA3AF;font-size:14px;line-height:1.8;">
          <li>Configura tu perfil de restaurante</li>
          <li>Añade tus mesas y carta</li>
          <li>Gestiona reservas desde tu dashboard</li>
          <li>Activa el TPV para gestionar pedidos en sala</li>
        </ol>
      ` : `
        <h3 style="margin:0 0 12px;font-size:16px;color:#F9FAFB;">¿Qué puedes hacer?</h3>
        <ul style="margin:0;padding-left:20px;color:#9CA3AF;font-size:14px;line-height:1.8;">
          <li>Buscar restaurantes por ciudad y cocina</li>
          <li>Reservar mesa en tiempo real</li>
          <li>Ver la carta y precios antes de ir</li>
          <li>Dejar reseñas verificadas</li>
        </ul>
      `}
    </div>
    <div style="text-align:center;margin-top:24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dinefirst.com'}${isRestaurant ? '/dashboard' : '/app'}"
         style="display:inline-block;background:#F97316;color:#fff;font-weight:600;font-size:14px;padding:12px 32px;border-radius:999px;text-decoration:none;">
        ${isRestaurant ? 'Ir al dashboard' : 'Explorar restaurantes'}
      </a>
    </div>
  `)
}

function reminderHtml(data: ReminderEmailData): string {
  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#F97316;">Recordatorio de reserva 🔔</h1>
    <p style="margin:0 0 24px;color:#9CA3AF;font-size:14px;">¡Hola ${data.userName}! Tu reserva es <strong style="color:#F9FAFB;">mañana</strong>.</p>

    <div style="background:#0a0a0a;border-radius:12px;padding:20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;color:#F9FAFB;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#9CA3AF;">Restaurante</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;">${data.restaurantName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9CA3AF;">Fecha</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;">${formatDate(data.date)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9CA3AF;">Hora</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;">${data.time}h</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9CA3AF;">Comensales</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;">${data.partySize} personas</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9CA3AF;border-top:1px solid #333;padding-top:16px;">Código</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;font-size:18px;color:#F97316;border-top:1px solid #333;padding-top:16px;">${data.confirmationCode}</td>
        </tr>
      </table>
    </div>
    <p style="margin:0;color:#9CA3AF;font-size:13px;">Si necesitas cancelar, hazlo con al menos 2 horas de antelación desde tu perfil.</p>
  `)
}

// ── Send Functions ───────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.log(`[EMAIL] (dev mode) To: ${to} | Subject: ${subject}`)
    console.log(`[EMAIL] HTML length: ${html.length} chars`)
    return { success: true, id: 'dev-' + Date.now() }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[EMAIL] Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[EMAIL] Exception:', msg)
    return { success: false, error: msg }
  }
}

// ── Public API ───────────────────────────────────────────────────────

export async function sendReservationConfirmation(data: ReservationEmailData) {
  return sendEmail(
    data.userEmail,
    `Reserva confirmada en ${data.restaurantName} — ${formatDate(data.date)}`,
    reservationConfirmationHtml(data),
  )
}

export async function sendReservationCancellation(data: CancellationEmailData) {
  return sendEmail(
    data.userEmail,
    `Reserva cancelada en ${data.restaurantName}`,
    cancellationHtml(data),
  )
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  return sendEmail(
    data.userEmail,
    '¡Bienvenido a DineFirst! 🍽️',
    welcomeHtml(data),
  )
}

export async function sendReservationReminder(data: ReminderEmailData) {
  return sendEmail(
    data.userEmail,
    `Recordatorio: Reserva mañana en ${data.restaurantName}`,
    reminderHtml(data),
  )
}
