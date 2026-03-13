import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateConfirmationCode } from '@/lib/data'

const reservationSchema = z.object({
  restaurantId: z.string(),
  tableId: z.string(),
  partySize: z.number().int().min(1).max(12),
  date: z.string(),
  time: z.string(),
  specialRequests: z.string().max(500).optional(),
})

// GET needed for static export compatibility (Capacitor mobile build)
export async function GET() {
  return NextResponse.json({ reservations: [] })
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const payload = reservationSchema.parse(json)
    const confirmationCode = generateConfirmationCode()

    return NextResponse.json(
      {
        reservation: {
          id: Date.now().toString(36),
          ...payload,
          status: 'pending',
          confirmationCode,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos de reserva inválidos.', details: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'No se pudo crear la reserva.' }, { status: 500 })
  }
}
