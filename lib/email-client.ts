/**
 * Client-side email helper.
 * Calls /api/email to send transactional emails.
 * Non-blocking: fires and forgets, logs errors.
 */

import type { ReservationEmailData, CancellationEmailData, WelcomeEmailData, ReminderEmailData } from '@/lib/email'

type EmailType = 'reservation_confirmation' | 'reservation_cancellation' | 'welcome' | 'reminder'
type EmailData = ReservationEmailData | CancellationEmailData | WelcomeEmailData | ReminderEmailData

async function sendEmailRequest(type: EmailType, data: EmailData): Promise<boolean> {
  try {
    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data }),
    })
    if (!res.ok) {
      const err = await res.json()
      console.warn(`[email-client] ${type} failed:`, err.error)
      return false
    }
    return true
  } catch (err) {
    console.warn(`[email-client] ${type} error:`, err)
    return false
  }
}

/** Send reservation confirmation email (non-blocking) */
export function emailReservationConfirmation(data: ReservationEmailData): void {
  sendEmailRequest('reservation_confirmation', data)
}

/** Send reservation cancellation email (non-blocking) */
export function emailReservationCancellation(data: CancellationEmailData): void {
  sendEmailRequest('reservation_cancellation', data)
}

/** Send welcome email (non-blocking) */
export function emailWelcome(data: WelcomeEmailData): void {
  sendEmailRequest('welcome', data)
}

/** Send reservation reminder email (non-blocking) */
export function emailReservationReminder(data: ReminderEmailData): void {
  sendEmailRequest('reminder', data)
}
