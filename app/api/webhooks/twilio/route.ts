import { NextResponse } from "next/server";

// GET needed for static export compatibility (Capacitor mobile build)
export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "twilio" });
}

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Webhook de Twilio. Aquí se gestionarán callbacks de WhatsApp/SMS relacionados con reservas."
    },
    { status: 200 }
  );
}
