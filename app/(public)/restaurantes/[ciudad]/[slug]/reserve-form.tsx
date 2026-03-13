"use client";

import { useState } from "react";

interface ReserveFormProps {
  restaurantId: string;
  slots: {
    label: string;
    value: string; // tableId|timeSlotId
  }[];
}

export default function ReserveForm({ restaurantId, slots }: ReserveFormProps) {
  const [selected, setSelected] = useState(slots[0]?.value ?? "");
  const [partySize, setPartySize] = useState(2);
  const [specialRequests, setSpecialRequests] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    const [tableId, timeSlotId] = selected.split("|");

    try {
      setStatus("loading");
      setMessage("");

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          tableId,
          timeSlotId,
          partySize,
          specialRequests: specialRequests.trim() || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo crear la reserva.");
      }

      const data = await res.json();
      setStatus("success");
      setMessage(
        `Reserva creada. Código de confirmación: ${data.reservation.confirmationCode}`
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Ha ocurrido un error inesperado."
      );
    }
  }

  return (
    <aside className="card space-y-4">
      <h2 className="text-base font-semibold text-foreground">
        Reserva en tiempo real
      </h2>
      {slots.length === 0 ? (
        <p className="text-sm text-foreground-subtle">
          No hay horarios disponibles en este momento.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label
              htmlFor="slot"
              className="text-xs font-medium text-foreground-subtle"
            >
              Mesa y horario
            </label>
            <select
              id="slot"
              className="w-full rounded-md border border-border-subtle bg-background-soft px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-soft"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              aria-label="Selecciona mesa y horario"
            >
              {slots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="partySize"
              className="text-xs font-medium text-foreground-subtle"
            >
              Número de comensales
            </label>
            <input
              id="partySize"
              type="number"
              min={1}
              max={12}
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              className="w-full rounded-md border border-border-subtle bg-background-soft px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-soft"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="specialRequests"
              className="text-xs font-medium text-foreground-subtle"
            >
              Peticiones especiales (opcional)
            </label>
            <textarea
              id="specialRequests"
              rows={3}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="w-full resize-none rounded-md border border-border-subtle bg-background-soft px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-soft"
              placeholder="Alergias, celebración, etc."
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Creando reserva..." : "Confirmar reserva"}
          </button>

          {message && (
            <p
              className={`text-xs ${
                status === "success"
                  ? "text-success-soft"
                  : "text-accent-soft"
              }`}
              aria-live="polite"
            >
              {message}
            </p>
          )}
        </form>
      )}
      <p className="text-[11px] text-foreground-subtle">
        No se realiza ningún cobro ahora. El restaurante confirmará la reserva y
        se te notificará por los canales configurados.
      </p>
    </aside>
  );
}

