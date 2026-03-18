import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildRestaurantContext } from '@/lib/chat-context'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: 'Chat AI no configurado. Añade OPENROUTER_API_KEY.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await req.json()
  const { messages, restaurantId, userId } = body as {
    messages: ChatMessage[]
    restaurantId: string
    userId: string
  }

  if (!restaurantId || !messages?.length) {
    return new Response(JSON.stringify({ error: 'Missing restaurantId or messages' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Check plan — limit messages for non-premium
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('plan')
    .eq('id', restaurantId)
    .single()

  const plan = restaurant?.plan ?? 'basic'

  if (plan === 'basic') {
    return new Response(JSON.stringify({
      error: 'plan_required',
      message: 'El chat AI está disponible en los planes Pro y Premium. Actualiza tu plan en Facturación.',
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Build system prompt with restaurant context
  let context: string
  try {
    context = await buildRestaurantContext(restaurantId)
  } catch {
    context = 'No se pudo cargar el contexto del restaurante.'
  }

  const systemPrompt = `Eres el asistente AI de DineFirst, una plataforma de gestión para restaurantes. Estás ayudando al gestor de un restaurante.

CONTEXTO ACTUAL DEL NEGOCIO:
${context}

INSTRUCCIONES:
- Responde siempre en español
- Sé conciso y directo, como un consultor de negocio experto
- Usa los datos del contexto para dar respuestas precisas con números reales
- Si te preguntan sobre facturación/ingresos, usa los datos de sesiones cerradas
- Si te preguntan sobre tendencias, analiza los datos disponibles
- Puedes sugerir mejoras operativas basadas en los datos
- Si no tienes datos suficientes, dilo claramente
- Formato: usa markdown ligero (negritas, listas) para legibilidad`

  const fullMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-20), // Keep last 20 messages for context window
  ]

  // Stream response from OpenRouter
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'DineFirst',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: fullMessages,
      stream: true,
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenRouter error:', response.status, errorText)
    return new Response(JSON.stringify({ error: 'Error al contactar el servicio AI' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Forward the SSE stream
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

export async function GET() {
  return new Response(JSON.stringify({ status: 'chat endpoint ready' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
