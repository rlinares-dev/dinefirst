import { NextResponse } from "next/server";

// GET needed for static export compatibility (Capacitor mobile build)
export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "stripe" });
}

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Webhook de Stripe. Aquí se validará la firma y se actualizará el estado de la suscripción del restaurante."
    },
    { status: 200 }
  );
}
