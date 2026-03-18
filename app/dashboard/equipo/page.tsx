'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getCamarerosForRestaurant,
  createCamarero,
  deleteCamarero,
  isUsernameTaken,
  getTablesForRestaurant,
  rotateWaiterAssignments,
  getRotationState,
} from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/env'
import {
  sbGetCamarerosForRestaurant,
  sbIsUsernameTaken,
  sbGetTablesForRestaurant,
  sbRotateWaiterAssignments,
  sbGetRotationState,
} from '@/lib/supabase-data'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import type { User, Table, WaiterRotationState } from '@/types/database'
import { useToast } from '@/components/ui/toast'
import { PageTransition } from '@/components/ui/page-transition'
import clsx from 'clsx'

export default function EquipoPage() {
  const { restaurantId } = useRestaurant()
  const [camareros, setCamareros] = useState<User[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [rotationState, setRotationState] = useState<WaiterRotationState | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [rotating, setRotating] = useState(false)
  const { success, info } = useToast()

  const loadData = useCallback(async () => {
    if (!restaurantId) return
    const sb = isSupabaseConfigured()

    const [cams, tbls, state] = await Promise.all([
      sb ? sbGetCamarerosForRestaurant(restaurantId) : getCamarerosForRestaurant(restaurantId),
      sb ? sbGetTablesForRestaurant(restaurantId) : getTablesForRestaurant(restaurantId),
      sb ? sbGetRotationState(restaurantId) : getRotationState(restaurantId),
    ])

    setCamareros(cams)
    setTables(tbls.filter((t) => t.status !== 'inactive'))
    setRotationState(state)
  }, [restaurantId])

  useEffect(() => { loadData() }, [loadData])

  // Build map: waiterId -> assigned table names
  const waiterTablesMap: Record<string, Table[]> = {}
  for (const t of tables) {
    if (t.assignedWaiterId) {
      if (!waiterTablesMap[t.assignedWaiterId]) waiterTablesMap[t.assignedWaiterId] = []
      waiterTablesMap[t.assignedWaiterId].push(t)
    }
  }
  const unassignedTables = tables.filter((t) => !t.assignedWaiterId)

  async function handleRotateNow() {
    if (!restaurantId || rotating) return
    setRotating(true)
    try {
      const sb = isSupabaseConfigured()
      if (sb) {
        await sbRotateWaiterAssignments(restaurantId)
      } else {
        rotateWaiterAssignments(restaurantId)
      }
      await loadData()
      success('Rotación completada — mesas reasignadas')
    } catch {
      info('Error al rotar. Inténtalo de nuevo.')
    }
    setRotating(false)
  }

  async function handleCreate() {
    const trimmedUsername = username.trim().toLowerCase().replace(/\s+/g, '')
    if (!name.trim() || !trimmedUsername) return

    const taken = isSupabaseConfigured()
      ? await sbIsUsernameTaken(trimmedUsername, restaurantId)
      : isUsernameTaken(trimmedUsername, restaurantId)
    if (taken) {
      setUsernameError('Este nombre de usuario ya existe en tu restaurante')
      return
    }

    const newCamarero = createCamarero({
      name: name.trim(),
      username: trimmedUsername,
      phone: phone.trim(),
      restaurantId,
    })
    setCamareros((prev) => [...prev, newCamarero])
    setName('')
    setUsername('')
    setPhone('')
    setUsernameError('')
    setShowForm(false)
    success('Camarero añadido correctamente')
  }

  function handleDelete(id: string) {
    deleteCamarero(id)
    setCamareros((prev) => prev.filter((c) => c.id !== id))
    setDeleteConfirm(null)
    success('Camarero eliminado')
  }

  const today = new Date().toISOString().slice(0, 10)
  const rotatedToday = rotationState?.lastRotationDate === today

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Equipo</h1>
          <p className="mt-1 text-sm text-foreground-subtle">
            Gestiona los camareros de tu restaurante · {camareros.length} miembro{camareros.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? 'Cancelar' : '+ Añadir camarero'}
        </button>
      </div>

      {/* Rotation section */}
      {camareros.length > 0 && tables.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Asignación de mesas</h2>
              <p className="mt-0.5 text-xs text-foreground-subtle">
                {rotatedToday
                  ? 'Rotación realizada hoy — las mesas ya están repartidas'
                  : 'Las mesas se rotan automáticamente al abrir el TPV cada día'}
              </p>
            </div>
            <button
              onClick={handleRotateNow}
              disabled={rotating}
              className={clsx(
                'rounded-lg border px-4 py-2 text-xs font-medium transition',
                rotating
                  ? 'border-border-subtle text-foreground-subtle opacity-50 cursor-wait'
                  : 'border-accent/30 text-accent hover:bg-accent/10',
              )}
            >
              {rotating ? 'Rotando...' : 'Rotar ahora'}
            </button>
          </div>

          {/* Summary: camarero -> tables */}
          <div className="space-y-3">
            {camareros.map((cam) => {
              const assignedTables = waiterTablesMap[cam.id] ?? []
              return (
                <div key={cam.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
                    {cam.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-foreground">{cam.name}</span>
                      <span className="text-xs text-foreground-subtle">
                        {assignedTables.length} mesa{assignedTables.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {assignedTables.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {assignedTables.map((t) => (
                          <span
                            key={t.id}
                            className={clsx(
                              'rounded-full px-2 py-0.5 text-[10px] font-medium',
                              t.status === 'occupied'
                                ? 'bg-emerald-400/10 text-emerald-400'
                                : t.status === 'reserved'
                                  ? 'bg-blue-400/10 text-blue-400'
                                  : 'bg-foreground-subtle/10 text-foreground-subtle',
                            )}
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-0.5 text-[10px] text-foreground-subtle/50">Sin mesas asignadas</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Unassigned tables warning */}
          {unassignedTables.length > 0 && (
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-400">
              {unassignedTables.length} mesa{unassignedTables.length !== 1 ? 's' : ''} sin asignar:{' '}
              {unassignedTables.map((t) => t.name).join(', ')}
              {' · '}
              <button onClick={handleRotateNow} className="underline hover:no-underline">
                Rotar ahora
              </button>
            </div>
          )}

          {/* Last rotation info */}
          {rotationState && (
            <p className="text-[10px] text-foreground-subtle/50">
              Última rotación: {new Date(rotationState.lastRotationDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          )}
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl border border-accent/20 bg-accent/[0.06] px-4 py-3 text-xs text-foreground-subtle">
        Los camareros inician sesión con su <span className="font-semibold text-foreground">nombre de usuario</span> y contraseña (por defecto <span className="font-semibold text-foreground">password123</span>). El usuario es único dentro de tu restaurante. Pueden acceder al TPV, comandas, mesas, menú y reseñas. No tienen acceso a analíticas de ingresos, facturación ni perfil del restaurante.
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Nuevo camarero</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-foreground-subtle">Nombre *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Elena Ruiz"
                className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle/50 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground-subtle">Usuario *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setUsernameError('') }}
                placeholder="elena"
                autoComplete="off"
                className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle/50 focus:border-accent focus:outline-none"
              />
              {usernameError && <p className="mt-1 text-[10px] text-red-400">{usernameError}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground-subtle">Teléfono</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle/50 focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!name.trim() || !username.trim()} className="btn-primary text-sm disabled:opacity-50">
              Crear camarero
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Camareros list */}
      {camareros.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-lg text-foreground-subtle">No hay camareros registrados</p>
          <p className="mt-1 text-xs text-foreground-subtle/60">Añade camareros para que puedan gestionar mesas y pedidos</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {camareros.map((cam) => {
            const assignedTables = waiterTablesMap[cam.id] ?? []
            return (
              <div key={cam.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
                      {cam.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{cam.name}</p>
                      <p className="text-xs text-foreground-subtle">@{cam.username}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                    {assignedTables.length} mesa{assignedTables.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Assigned tables pills */}
                {assignedTables.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {assignedTables.map((t) => (
                      <span
                        key={t.id}
                        className={clsx(
                          'rounded-full px-2 py-0.5 text-[10px] font-medium',
                          t.status === 'occupied'
                            ? 'bg-emerald-400/10 text-emerald-400'
                            : t.status === 'reserved'
                              ? 'bg-blue-400/10 text-blue-400'
                              : 'bg-foreground-subtle/10 text-foreground-subtle',
                        )}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}

                {cam.phone && (
                  <p className="mt-3 text-xs text-foreground-subtle">Tel: {cam.phone}</p>
                )}
                <p className="mt-1 text-[10px] text-foreground-subtle/50">
                  Desde {new Date(cam.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                <div className="mt-3">
                  {deleteConfirm === cam.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(cam.id)}
                        className="flex-1 rounded-md bg-red-500/10 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 rounded-md border border-border-subtle py-1.5 text-xs text-foreground-subtle hover:text-foreground transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(cam.id)}
                      className="w-full rounded-md border border-border-subtle py-1.5 text-xs text-foreground-subtle hover:border-red-500/30 hover:text-red-400 transition"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageTransition>
  )
}
