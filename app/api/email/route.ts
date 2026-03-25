import { NextRequest, NextResponse } from 'next/server'
import {
  sendReservationConfirmation,
  sendReservationCancellation,
  sendWelcomeEmail,
  sendReservationReminder,
  isEmailConfigured,
  type ReservationEmailData,
  type CancellationEmailData,
  type WelcomeEmailData,
  type ReminderEmailData,
} from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body as {
      type: 'reservation_confirmation' | 'reservation_cancellation' | 'welcome' | 'reminder'
      data: ReservationEmailData | CancellationEmailData | WelcomeEmailData | ReminderEmailData
    }

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 })
    }

    let result: { success: boolean; id?: string; error?: string }

    switch (type) {
      case 'reservation_confirmation':
        result = await sendReservationConfirmation(data as ReservationEmailData)
        break
      case 'reservation_cancellation':
        result = await sendReservationCancellation(data as CancellationEmailData)
        break
      case 'welcome':
        result = await sendWelcomeEmail(data as WelcomeEmailData)
        break
      case 'reminder':
        result = await sendReservationReminder(data as ReminderEmailData)
        break
      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      configured: isEmailConfigured(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET handler for static export compatibility
export async function GET() {
  return NextResponse.json({
    service: 'email',
    configured: isEmailConfigured(),
    types: ['reservation_confirmation', 'reservation_cancellation', 'welcome', 'reminder'],
  })
}
