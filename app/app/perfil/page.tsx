'use client'

import { useEffect, useState } from 'react'
import { getUser, setUser, clearUser, getReservationsForUser } from '@/lib/data'
import type { User, Reservation } from '@/types/database'

export default function AppProfilePage() {
  const [user, setCurrentUser] = useState<User | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')

  useEffect(() => {
    const u = getUser()
    if (u) {
      setCurrentUser(u)
      setForm({ name: u.name, email: u.email, phone: u.phone ?? '' })
      setReservations(getReservationsForUser(u.id))
    }
  }, [])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const updated: User = { ...user, name: form.name, email: form.email, phone: form.phone }
    setUser(updated)
    setCurrentUser(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleLogout() {
    clearUser()
    window.location.href = '/'
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-foreground-subtle mb-4">Necesitas iniciar sesión para ver tu perfil.</p>
          <a href="/login" className="btn-primary">Iniciar sesión</a>
        </div>
      </main>
    )
  }

  const upcoming = reservations.filter((r) => r.date >= new Date().toISOString().slice(0, 10) && r.status !== 'cancelled').length
  const total = reservations.length

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* User card */}
        <div className="card flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/20 text-lg font-bold text-accent">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">{user.name}</h1>
            <p className="text-sm text-foreground-subtle">{user.email}</p>
            <div className="mt-2 flex gap-3 text-xs text-foreground-subtle">
              <span>{upcoming} reservas próximas</span>
              <span>·</span>
              <span>{total} reservas totales</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <a href="/app/reservas" className="btn-secondary text-xs py-1.5">Mis reservas</a>
            <button onClick={handleLogout} className="text-xs text-red-400/60 hover:text-red-400 transition">
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle">
          {[
            { id: 'profile' as const, label: 'Datos personales' },
            { id: 'security' as const, label: 'Seguridad' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-foreground-subtle hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="card">
            {saved && (
              <div className="mb-5 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-xs text-success">
                ✅ Perfil actualizado correctamente.
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full rounded-md border border-border-subtle bg-background-elevated px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full rounded-md border border-border-subtle bg-background-elevated px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+34 600 000 000"
                  className="w-full rounded-md border border-border-subtle bg-background-elevated px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                  Rol
                </label>
                <div className="rounded-md border border-border-subtle bg-background px-3 py-2.5 text-sm text-foreground-subtle capitalize">
                  {user.role} · <span className="text-xs">Miembro desde {new Date(user.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full py-3">
                Guardar cambios
              </button>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="card space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Cambiar contraseña</h3>
              <p className="text-xs text-foreground-subtle">La integración con Supabase Auth estará disponible en la Fase 1 del roadmap.</p>
            </div>
            <div className="space-y-3">
              {['Contraseña actual', 'Nueva contraseña', 'Confirmar nueva contraseña'].map((label) => (
                <div key={label}>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-subtle">{label}</label>
                  <input
                    type="password"
                    disabled
                    placeholder="••••••••"
                    className="w-full rounded-md border border-border-subtle bg-background-elevated px-3 py-2.5 text-sm text-foreground-subtle opacity-40 cursor-not-allowed outline-none"
                  />
                </div>
              ))}
            </div>
            <button disabled className="btn-secondary w-full opacity-40 cursor-not-allowed">
              Cambiar contraseña (próximamente)
            </button>

            <div className="border-t border-border-subtle pt-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Conectar con Google</h3>
              <p className="text-xs text-foreground-subtle mb-3">Accede de forma rápida con tu cuenta de Google.</p>
              <button disabled className="btn-secondary opacity-40 cursor-not-allowed text-xs">
                🔒 OAuth disponible en Fase 1
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
