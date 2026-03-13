# 🍽️ DineFirst

Este proyecto implementa la estructura base descrita en la documentación original de DineFirst (`README-spec.md`) usando **Next.js 14 (App Router)**, **TypeScript** y **Tailwind CSS**.

## ▶️ Puesta en marcha rápida

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo de entorno local a partir del ejemplo:

```bash
cp .env.example .env.local
```

3. Arranca el servidor de desarrollo:

```bash
npm run dev
```

La app estará disponible en `http://localhost:3000`.

## 🌐 Rutas principales ya creadas

- `/` (grupo `(public)`) · Landing pública
- `/restaurantes/[ciudad]/[slug]` · Perfil público SEO del restaurante
- `/app` · Área de comensal
- `/app/reservas` · Reservas del comensal
- `/app/perfil` · Perfil del comensal
- `/dashboard` · Dashboard del restaurante
- `/dashboard/reservas` · Reservas operativas
- `/dashboard/mesas` · Gestión de mesas
- `/dashboard/menu` · Gestión de carta
- `/dashboard/analiticas` · Analíticas
- `/dashboard/facturacion` · Facturación (Stripe, futuro)
- `/admin` · Panel de administración
- `/api/reservations` · Endpoint de reservas (stub)
- `/api/restaurants` · Endpoint de restaurantes (stub)
- `/api/webhooks/stripe` · Webhook Stripe (stub)
- `/api/webhooks/twilio` · Webhook Twilio (stub)

## 📁 Más detalles

Para la visión completa de negocio, stack, base de datos y roadmap, revisa `README-spec.md`, que contiene el documento original que has usado como referencia.

# dinefirst
