# Chat AI — Guía de proveedores

## Estado actual: Groq (gratis)

- **Modelo**: `llama-3.3-70b-versatile` (70B params, excelente español, 128K contexto)
- **API key**: https://console.groq.com → API Keys
- **Env var**: `GROQ_API_KEY`
- **Coste**: $0
- **Limits**: 30 RPM, 14,400 req/día, 6,000 tokens/min — **quota propia** (no compartida)
- **Código**: `app/api/chat/route.ts`
- **Ventajas**: Inferencia ultra-rápida (LPU chips), sin tarjeta, sin restricción regional

---

## Alternativa: OpenRouter (gratis, quota compartida)

- **Modelos free**: rate limits **compartidos** entre todos los usuarios → 429 frecuentes en horas punta
- **API key**: https://openrouter.ai/settings/keys
- **Env var**: `OPENROUTER_API_KEY`

### Modelos free disponibles
| Modelo | Contexto | Notas |
|--------|----------|-------|
| `google/gemma-3-27b-it:free` | 131K | Buena calidad |
| `meta-llama/llama-3.3-70b-instruct:free` | 65K | Muy capaz, saturado a veces |
| `qwen/qwen3-coder:free` | 262K | Bueno para código |
| `mistralai/mistral-small-3.1-24b-instruct:free` | 128K | Rápido |

### Código para cambiar a OpenRouter
```typescript
// En app/api/chat/route.ts, cambiar:
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
// Por:
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'DineFirst',
  },
  body: JSON.stringify({
    model: 'google/gemma-3-27b-it:free', // o cualquier modelo :free
    ...
  }),
})
```

---

## Alternativa: Google Gemini directo

> **NOTA**: El tier gratuito de Google AI Studio NO funciona en España/UE (quota = 0).
> Requiere añadir tarjeta de crédito en Google Cloud para desbloquear en EU.

### Implementación (guardada para futuro uso)

**Dependencia** (ya instalada): `@google/generative-ai`

**Env var**: `GEMINI_API_KEY` de https://aistudio.google.com/apikey

**Código del endpoint** (`app/api/chat/route.ts`):

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Dentro del handler POST, después de construir systemPrompt:

// Convertir mensajes al formato Gemini
const history = messages.slice(0, -1).map((m) => ({
  role: m.role === 'assistant' ? 'model' as const : 'user' as const,
  parts: [{ text: m.content }],
}))
const lastMessage = messages[messages.length - 1]

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  systemInstruction: systemPrompt,
})

const chat = model.startChat({ history })
const result = await chat.sendMessageStream(lastMessage.content)

// Convertir stream de Gemini a SSE (compatible con el widget)
const encoder = new TextEncoder()
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        const sseData = JSON.stringify({
          choices: [{ delta: { content: text } }],
        })
        controller.enqueue(encoder.encode(`data: ${sseData}\n\n`))
      }
    }
    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
    controller.close()
  },
})
```

### Tier gratuito (fuera de EU)
- 15 RPM, 1500 req/día
- 1M tokens de contexto
- Datos pueden usarse para entrenamiento de Google

---

## Producción: Google Cloud Vertex AI (recomendado para lanzamiento)

Para el lanzamiento comercial de DineFirst, migrar a Vertex AI.

### Pasos de migración

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Activar **Vertex AI API** en el proyecto
3. Crear Service Account con rol **Vertex AI User**
4. Instalar SDK:
   ```bash
   npm install @google-cloud/vertexai
   ```
5. Cambiar imports y config en `app/api/chat/route.ts`:
   ```typescript
   import { VertexAI } from '@google-cloud/vertexai'

   const vertexAI = new VertexAI({
     project: process.env.GOOGLE_CLOUD_PROJECT!,
     location: 'europe-west1', // Región EU para GDPR
   })

   const model = vertexAI.getGenerativeModel({
     model: 'gemini-2.0-flash',
   })

   // El resto del código de streaming es igual
   ```
6. Env vars:
   ```
   GOOGLE_CLOUD_PROJECT=tu-project-id
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
   ```

### Ventajas sobre el tier gratuito
| | Groq (actual) | Vertex AI (producción) |
|---|---|---|
| Disponible en EU | Si | Si |
| Datos para entrenamiento | No (Llama es open-source) | No |
| SLA | Ninguno | 99.9% |
| GDPR | No garantizado | Si (region EU) |
| Coste | $0 | ~$0.01/mes por restaurante |
| Rate limits | 30 RPM | 360 RPM |

### Coste estimado para DineFirst
- 1 restaurante, 20 mensajes/día: **~$0.01/mes**
- 100 restaurantes: **~$1/mes**
- 1000 restaurantes: **~$10/mes**
