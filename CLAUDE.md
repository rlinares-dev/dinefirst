# DineFirst — CLAUDE.md

## Descripción del Proyecto
DineFirst es un SaaS two-sided para la industria gastronómica. Conecta comensales con restaurantes resolviendo la fragmentación operativa. Roles: `comensal`, `restaurante`, `admin`.

## Stack Tecnológico
- **Next.js 14** App Router + TypeScript 5
- **Tailwind CSS 3** (tema oscuro azul + acento naranja) → ver `tailwind.config.ts`
- **Librerías disponibles**: `@heroicons/react`, `@headlessui/react`, `clsx`, `zod`, `@prisma/client`
- **Mock data**: localStorage (sin Supabase/Stripe activo en dev)

## Estructura de Rutas
| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/` | `app/(public)/page.tsx` | Landing pública |
| `/restaurantes/[ciudad]/[slug]` | `app/(public)/restaurantes/[ciudad]/[slug]/page.tsx` | Perfil público SEO |
| `/login` | `app/(auth)/login/page.tsx` | Login |
| `/register` | `app/(auth)/register/page.tsx` | Registro |
| `/app` | `app/app/page.tsx` | Home comensal |
| `/app/reservas` | `app/app/reservas/page.tsx` | Mis reservas |
| `/app/perfil` | `app/app/perfil/page.tsx` | Perfil comensal |
| `/dashboard` | `app/dashboard/page.tsx` | Resumen operativo |
| `/dashboard/mesas` | `app/dashboard/mesas/page.tsx` | Gestión mesas |
| `/dashboard/menu` | `app/dashboard/menu/page.tsx` | Gestión menú |
| `/dashboard/analiticas` | `app/dashboard/analiticas/page.tsx` | Analíticas |
| `/dashboard/facturacion` | `app/dashboard/facturacion/page.tsx` | Facturación Stripe |
| `/admin` | `app/admin/page.tsx` | Panel administración |

## Sistema de Colores (tailwind.config.ts)
```
background: DEFAULT=#050816  soft=#0B1220  elevated=#111827
foreground:  DEFAULT=#F9FAFB  subtle=#9CA3AF  muted=#CBD5F5
accent:      DEFAULT=#F97316  soft=#FDBA74   strong=#EA580C
success:     DEFAULT=#22C55E  soft=#4ADE80
border:      subtle=#1F2937   strong=#374151
```

## Clases CSS Personalizadas (styles/globals.css)
- `.btn-primary` — botón naranja (accent)
- `.btn-secondary` — botón outline
- `.card` — tarjeta con borde y sombra
- `.pill` — badge/etiqueta

## Capa de Datos Mock
- **`types/database.ts`** → interfaces TypeScript de todos los modelos
- **`lib/mock-data.ts`** → datos de prueba: 3 restaurantes, 15+ mesas, 30+ items menú, 10+ reservas
- **`lib/data.ts`** → funciones CRUD sobre localStorage con inicialización lazy

### Funciones principales en lib/data.ts
```
getUser() / setUser(u) / clearUser()
getRestaurants() / saveRestaurant(r)
getTablesForRestaurant(restaurantId) / saveTable(t) / deleteTable(id)
getMenuForRestaurant(restaurantId) / saveMenuItem(i) / deleteMenuItem(id)
getReservationsForRestaurant(restaurantId) / getReservationsForUser(userId)
saveReservation(r) / updateReservationStatus(id, status)
```

## Convenciones de Código
- Server Components por defecto; `'use client'` solo si hay hooks/estado
- Heroicons: `import { XIcon } from '@heroicons/react/24/outline'`
- IDs generados en cliente: `Date.now().toString(36) + Math.random().toString(36).slice(2)`
- Fechas: formato `YYYY-MM-DD`; horas: `HH:MM`
- No usar `any`, tipado estricto siempre

## Mock Users (para login manual)
| Email | Password | Rol |
|-------|----------|-----|
| admin@dinefirst.com | password123 | admin |
| restaurante@demo.com | password123 | restaurante |
| comensal@demo.com | password123 | comensal |

## Comandos de Desarrollo
```bash
npm run dev          # Dev server → localhost:3000
npm run build        # Build producción
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

## Próximos Pasos (Roadmap)
- [x] Fase 0: Estructura base, layout, auth mock, design system
- [ ] Fase 1: Supabase real (auth JWT + RLS + PostgreSQL)
- [ ] Fase 2: Stripe (suscripciones, webhooks)
- [ ] Fase 3: Twilio WhatsApp + Resend emails
- [ ] Fase 4: PWA, analíticas avanzadas, reseñas
