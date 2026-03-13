# 🍽️ DineFirst

> **Gestiona restaurantes de forma más inteligente.**  
> Plataforma SaaS two-sided que conecta comensales con restaurantes, resolviendo la fragmentación operativa de la industria gastronómica.

![Estado](https://img.shields.io/badge/estado-pre--alpha-orange)
![Versión](https://img.shields.io/badge/versión-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![License](https://img.shields.io/badge/licencia-privada-red)

---

## 📋 Tabla de Contenidos

- [Descripción del Proyecto](#-descripción-del-proyecto)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Setup Local](#-instalación-y-setup-local)
- [Variables de Entorno](#-variables-de-entorno)
- [Base de Datos](#-base-de-datos)
- [Scripts Disponibles](#-scripts-disponibles)
- [Arquitectura](#-arquitectura)
- [Roles y Autenticación](#-roles-y-autenticación)
- [Módulos Principales](#-módulos-principales)
- [Despliegue](#-despliegue)
- [Roadmap](#-roadmap)
- [Convenciones de Código](#-convenciones-de-código)
- [Contribución](#-contribución)

---

## 🎯 Descripción del Proyecto

DineFirst es una plataforma SaaS para la industria gastronómica que resuelve tres problemas críticos simultáneamente:

| Segmento | Problema | Solución |
|----------|----------|----------|
| **Comensal** | Reserva lenta y dispersa en múltiples apps | Reserva en tiempo real con confirmación automática vía WhatsApp/Email |
| **Restaurante Nuevo** | Invisibilidad digital en los primeros meses | Alta operativa en 24-48h con visibilidad inmediata |
| **Restaurante Existente** | Dashboard fragmentado, análisis manual | Panel centralizado con analíticas de comportamiento y ROI |

### Diferenciación vs Competidores

- **Sin comisiones por reserva** (TheFork cobra 30%+)
- **Onboarding en 24h** (vs semanas en OpenTable)
- **Marketplace + gestión** en un solo producto (vs Covermanager que es solo gestión)
- **SEO propio** sin dependencia de ecosistemas externos

---

## 🛠️ Stack Tecnológico

### Frontend
- **[Next.js 14](https://nextjs.org/)** — App Router, SSR/SSG, API Routes
- **[TypeScript 5](https://www.typescriptlang.org/)** — Type safety end-to-end
- **[Tailwind CSS 3](https://tailwindcss.com/)** — Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** — Componentes accesibles y personalizables

### Backend & Base de Datos
- **[Supabase](https://supabase.com/)** — PostgreSQL + Auth + Realtime + Storage
- **[Prisma 5](https://www.prisma.io/)** — ORM type-safe con migraciones automáticas

### Servicios Externos
- **[Stripe](https://stripe.com/)** — Suscripciones SaaS, PCI DSS compliant, 3D Secure
- **[Twilio](https://www.twilio.com/)** — WhatsApp Business API + SMS fallback
- **[Resend](https://resend.com/) + [React Email](https://react.email/)** — Emails transaccionales

### Infraestructura
- **[Vercel](https://vercel.com/)** — Hosting, Edge Network, CI/CD automático
- **[Sentry](https://sentry.io/)** — Error tracking y performance monitoring
- **[Vercel Analytics](https://vercel.com/analytics)** — Core Web Vitals, RGPD-friendly

---

## 📁 Estructura del Proyecto

```
dinefirst/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Rutas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── (public)/                 # Rutas públicas (SEO)
│   │   ├── page.tsx              # Homepage
│   │   └── restaurantes/
│   │       └── [ciudad]/
│   │           └── [slug]/       # Perfil público del restaurante
│   ├── app/                      # Rutas autenticadas (comensal)
│   │   ├── reservas/
│   │   └── perfil/
│   ├── dashboard/                # Panel del restaurante
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Resumen operativo
│   │   ├── reservas/
│   │   ├── mesas/
│   │   ├── menu/
│   │   ├── analiticas/
│   │   └── facturacion/
│   ├── admin/                    # Panel de administración
│   └── api/                      # API Routes (Next.js)
│       ├── reservations/
│       ├── restaurants/
│       └── webhooks/
│           ├── stripe/
│           └── twilio/
├── components/                   # Componentes reutilizables
│   ├── ui/                       # shadcn/ui components
│   ├── forms/
│   ├── layout/
│   └── shared/
├── lib/                          # Utilidades y configuraciones
│   ├── supabase/
│   │   ├── client.ts             # Cliente Supabase (browser)
│   │   └── server.ts             # Cliente Supabase (server)
│   ├── stripe/
│   ├── twilio/
│   ├── resend/
│   └── utils.ts
├── prisma/
│   ├── schema.prisma             # Esquema de base de datos
│   ├── migrations/               # Migraciones SQL
│   └── seed.ts                   # Datos de prueba
├── types/                        # TypeScript types globales
│   └── database.ts               # Tipos generados por Supabase
├── hooks/                        # Custom React hooks
├── styles/
│   └── globals.css
├── public/
├── .env.example                  # Plantilla de variables de entorno
├── .env.local                    # Variables locales (NO commitear)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── prisma/schema.prisma
```

---

## ✅ Requisitos Previos

Asegúrate de tener instalado:

- **Node.js** >= 18.17.0
- **npm** >= 9.x (o pnpm >= 8.x)
- **Git**
- Cuenta en [Supabase](https://supabase.com/) (free tier suficiente para desarrollo)
- Cuenta en [Stripe](https://stripe.com/) (modo test)
- Cuenta en [Twilio](https://www.twilio.com/) (trial suficiente para desarrollo)
- Cuenta en [Resend](https://resend.com/) (free tier: 3.000 emails/mes)

---

## 🚀 Instalación y Setup Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/[org]/dinefirst.git
cd dinefirst
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores (ver sección [Variables de Entorno](#-variables-de-entorno)).

### 4. Iniciar Supabase localmente

```bash
# Requiere Docker
npx supabase start
```

Esto levantará una instancia local de PostgreSQL, Auth y Storage en `localhost:54321`.

### 5. Aplicar el esquema de base de datos

```bash
npx prisma migrate dev --name init
```

### 6. Poblar con datos de prueba

```bash
npx prisma db seed
```

Esto creará:
- 1 usuario admin (`admin@dinefirst.com` / `password123`)
- 3 restaurantes de ejemplo con mesas y menús
- 10 usuarios comensales de prueba

### 7. Arrancar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 🔐 Variables de Entorno

Copia `.env.example` a `.env.local` y rellena cada valor. **Nunca commitees `.env.local` al repositorio.**

```env
# ─── SUPABASE ──────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Solo servidor, NUNCA en cliente

# ─── STRIPE ────────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...            # ID del price en Stripe
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_PREMIUM=price_...

# ─── TWILIO (WhatsApp / SMS) ────────────────────────────────
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# ─── RESEND (Email) ────────────────────────────────────────
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@dinefirst.com

# ─── APP ───────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development         # development | staging | production
```

### Configuración de Stripe Webhooks en local

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escuchar webhooks y reenviarlos a tu servidor local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 🗄️ Base de Datos

### Esquema Principal (Prisma)

```prisma
model Profile {
  id         String   @id @default(uuid())
  role       Role     @default(comensal)
  name       String
  avatarUrl  String?
  createdAt  DateTime @default(now())
  restaurants Restaurant[]
  reservations Reservation[]
}

model Restaurant {
  id              String   @id @default(uuid())
  ownerId         String
  name            String
  slug            String   @unique
  city            String
  address         String
  lat             Float
  lng             Float
  cuisineType     String
  capacity        Int
  description     String?
  coverImage      String?
  stripeCustomerId String?
  plan            Plan     @default(basic)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  owner           Profile  @relation(fields: [ownerId], references: [id])
  tables          Table[]
  reservations    Reservation[]
  menuItems       MenuItem[]
}

model Table {
  id           String   @id @default(uuid())
  restaurantId String
  name         String
  capacity     Int
  isActive     Boolean  @default(true)
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])
  timeSlots    TimeSlot[]
}

model TimeSlot {
  id           String   @id @default(uuid())
  restaurantId String
  tableId      String
  date         DateTime
  startTime    String
  endTime      String
  isAvailable  Boolean  @default(true)
  table        Table    @relation(fields: [tableId], references: [id])
  reservation  Reservation?
}

model Reservation {
  id               String            @id @default(uuid())
  userId           String
  restaurantId     String
  tableId          String
  timeSlotId       String            @unique
  partySize        Int
  status           ReservationStatus @default(pending)
  specialRequests  String?
  confirmationCode String            @unique
  createdAt        DateTime          @default(now())
  user             Profile           @relation(fields: [userId], references: [id])
  restaurant       Restaurant        @relation(fields: [restaurantId], references: [id])
  timeSlot         TimeSlot          @relation(fields: [timeSlotId], references: [id])
}

enum Role              { comensal restaurante admin }
enum Plan              { basic pro premium }
enum ReservationStatus { pending confirmed cancelled no_show }
```

### Comandos útiles de Prisma

```bash
npx prisma migrate dev          # Crear y aplicar nueva migración
npx prisma migrate deploy       # Aplicar migraciones en producción
npx prisma studio               # UI visual de la base de datos
npx prisma generate             # Regenerar el cliente Prisma
npx prisma db push              # Sync schema sin migración (solo desarrollo)
```

---

## 📜 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo (localhost:3000)
npm run build        # Build de producción
npm run start        # Iniciar servidor de producción
npm run lint         # ESLint
npm run type-check   # TypeScript check sin emitir archivos
npm run test         # Tests unitarios (Vitest)
npm run test:e2e     # Tests E2E (Playwright)
npm run test:watch   # Tests en modo watch
```

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER / PWA                        │
│           Next.js 14 App Router (React 18)              │
│          Tailwind CSS + shadcn/ui + Poppins/Lato        │
└──────────────────────┬──────────────────────────────────┘
                      │ HTTP / WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                  NEXT.JS API LAYER                        │
│  /api/reservations  /api/restaurants  /api/webhooks/*    │
│         Zod validation + Rate limiting (Upstash)         │
└──────────┬─────────────────────────────┬────────────────┘
          │                             │
┌──────────▼──────────┐    ┌─────────────▼──────────────┐
│      SUPABASE        │    │     SERVICIOS EXTERNOS       │
│  PostgreSQL (RLS)    │    │  Stripe — Pagos/Suscripciones│
│  Auth (JWT + OAuth)  │    │  Twilio — WhatsApp / SMS     │
│  Realtime (WS)       │    │  Resend  — Email             │
│  Storage (CDN)       │    │  Sentry  — Error tracking    │
└─────────────────────┘    └────────────────────────────-─┘
```

### Flujo de una Reserva (tiempo real)

```
Comensal selecciona mesa
       │
       ▼
Frontend consulta disponibilidad (Supabase Realtime WebSocket)
       │
       ▼
POST /api/reservations
       │
       ▼
Transacción PostgreSQL (SELECT FOR UPDATE → evita doble reserva)
       │
       ├──► Supabase trigger → Edge Function de notificaciones
       │         ├──► Resend: email de confirmación al comensal
       │         └──► Twilio: WhatsApp al comensal + restaurante
       │
       └──► Supabase Realtime push al dashboard del restaurante
```

---

## 👥 Roles y Autenticación

El sistema usa **Row Level Security (RLS)** de Supabase para multitenancy estricto.

| Rol | Descripción | Rutas |
|-----|-------------|-------|
| `comensal` | Usuario final que busca y reserva | `/app/*`, `/restaurantes/*` |
| `restaurante` | Propietario que gestiona su local | `/dashboard/*` |
| `admin` | Equipo DineFirst, acceso total | `/admin/*` |

La autenticación soporta:
- Email + contraseña
- OAuth con Google
- OAuth con Facebook *(próximamente)*

---

## 🧩 Módulos Principales

### `lib/supabase/`
Clientes de Supabase separados para browser y server components de Next.js.

### `lib/stripe/`
- `createCheckoutSession()` — Inicia el flujo de pago
- `createPortalSession()` — Portal de facturación para el restaurante
- `handleWebhook()` — Procesa eventos de Stripe

### `lib/twilio/`
- `sendWhatsAppConfirmation()` — Confirmación de reserva
- `sendWhatsAppReminder()` — Recordatorio 24h antes
- `sendSMSFallback()` — SMS si WhatsApp falla

### `lib/resend/`
- `sendReservationConfirmation()` — Email al comensal
- `sendNewReservationAlert()` — Alerta al restaurante
- `sendCancellationEmail()` — Notificación de cancelación

---

## 🚢 Despliegue

### Entornos

| Entorno | URL | Rama | Base de datos |
|---------|-----|------|---------------|
| Development | `localhost:3000` | `feature/*` | Supabase local |
| Staging | `staging.dinefirst.com` | `develop` | Supabase staging |
| Production | `dinefirst.com` | `main` | Supabase producción |

### Vercel (Producción)

```bash
# Deploy manual (normalmente automático desde main)
vercel --prod
```

Variables de entorno a configurar en el panel de Vercel:
- Todas las de `.env.example` con los valores de producción
- `NEXT_PUBLIC_APP_ENV=production`

### Pipeline CI/CD (GitHub Actions)

```
push feature/* → lint + type-check + tests → Preview URL (Vercel)
merge a develop → deploy staging automático
merge a main    → deploy producción automático (zero-downtime)
```

---

## 🗺️ Roadmap

- [x] **Fase 0** — Fundamentos: Next.js, Supabase, Auth, Vercel, Design System
- [ ] **Fase 1** — MVP Restaurante: Onboarding, mesas, reservas básicas, perfil público
- [ ] **Fase 2** — MVP Comensal: Búsqueda, reserva en tiempo real, WhatsApp
- [ ] **Fase 3** — Monetización: Stripe, planes, feature flags, portal de facturación
- [ ] **Fase 4** — Crecimiento: Analíticas avanzadas, marketing automático, PWA, reseñas

---

## 📐 Convenciones de Código

### Nomenclatura

```
Componentes React:    PascalCase     → ReservationCard.tsx
Funciones/variables:  camelCase      → createReservation()
Constantes:           UPPER_SNAKE    → MAX_PARTY_SIZE
Rutas de archivo:     kebab-case     → reservation-form.tsx
Tablas DB:            snake_case     → time_slots
```

### Estructura de un componente

```tsx
// 1. Imports externos
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 2. Imports internos
import { createReservation } from '@/lib/supabase/reservations'
import type { Reservation } from '@/types/database'

// 3. Types/interfaces del componente
interface ReservationCardProps {
  reservation: Reservation
  onCancel: (id: string) => void
}

// 4. Componente
export function ReservationCard({ reservation, onCancel }: ReservationCardProps) {
  // ...
}
```

### Commits (Conventional Commits)

```
feat:     nueva funcionalidad
fix:      corrección de bug
docs:     cambios en documentación
style:    formato, sin cambio de lógica
refactor: refactorización sin nueva feature ni fix
test:     añadir o modificar tests
chore:    tareas de mantenimiento (deps, config)

Ejemplo: feat(reservations): add race condition protection with SELECT FOR UPDATE
```

---

## 🤝 Contribución

1. Crea una rama desde `develop`: `git checkout -b feat/nombre-feature`
2. Desarrolla y escribe tests
3. Asegúrate de que pasan todos los checks: `npm run lint && npm run type-check && npm run test`
4. Abre un Pull Request hacia `develop` con descripción clara del cambio
5. Requiere al menos 1 revisión antes de mergear

---

## 📄 Licencia

Proyecto privado y confidencial. © DineFirst 2026. Todos los derechos reservados.

---

<div align="center">
  <strong>DineFirst</strong> · Gestiona restaurantes de forma más inteligente.<br/>
  Construido con Next.js · Supabase · Stripe · Twilio
</div>

