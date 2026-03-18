'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { useAuth } from '@/components/providers/auth-provider'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const PLAN_LIMITS: Record<string, number> = {
  pro: 10,
  premium: Infinity,
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export default function ChatWidget() {
  const { user } = useAuth()
  const { restaurantId, restaurant } = useRestaurant()
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dailyCount, setDailyCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const plan = restaurant?.plan ?? 'basic'
  const dailyLimit = PLAN_LIMITS[plan] ?? 0

  // Load daily message count
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const stored = localStorage.getItem('df_chat_count')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.date === today) {
        setDailyCount(parsed.count)
      } else {
        localStorage.setItem('df_chat_count', JSON.stringify({ date: today, count: 0 }))
      }
    }
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const incrementDailyCount = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10)
    const newCount = dailyCount + 1
    setDailyCount(newCount)
    localStorage.setItem('df_chat_count', JSON.stringify({ date: today, count: newCount }))
  }, [dailyCount])

  async function handleSend() {
    const text = input.trim()
    if (!text || streaming || !restaurantId) return

    if (plan === 'pro' && dailyCount >= dailyLimit) {
      setError(`Límite de ${dailyLimit} mensajes/día alcanzado. Actualiza a Premium.`)
      return
    }

    setError(null)
    setExpanded(true)
    const userMsg: Message = { id: generateId(), role: 'user', content: text }
    const assistantMsg: Message = { id: generateId(), role: 'assistant', content: '' }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput('')
    setStreaming(true)
    incrementDailyCount()

    try {
      const chatMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          restaurantId,
          userId: user?.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.error === 'plan_required') {
          setError(data.message)
          setMessages((prev) => prev.slice(0, -2))
          setStreaming(false)
          return
        }
        throw new Error(data.error || 'Error del servidor')
      }

      // Parse SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (reader) {
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                accumulated += delta
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id ? { ...m, content: accumulated } : m
                  )
                )
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }

      if (!accumulated) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: 'No se recibió respuesta. Inténtalo de nuevo.' } : m
          )
        )
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: 'Error al conectar con el asistente. Comprueba tu conexión.' }
            : m
        )
      )
    }

    setStreaming(false)
  }

  // Only for restaurant owners and admins
  if (!user || (user.role !== 'restaurante' && user.role !== 'admin')) {
    return null
  }

  // Plan gate: basic shows upgrade hint inline
  if (plan === 'basic') {
    return (
      <div className="border-t border-border-subtle bg-background-soft px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-accent">AI</span>
          <p className="flex-1 text-xs text-foreground-subtle">
            Asistente AI disponible en planes Pro y Premium
          </p>
          <a
            href="/dashboard/facturacion"
            className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition"
          >
            Actualizar plan
          </a>
        </div>
      </div>
    )
  }

  const hasMessages = messages.length > 0

  return (
    <div className="border-t border-border-subtle bg-background-soft">
      {/* Expandable messages area */}
      <AnimatePresence>
        {expanded && hasMessages && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 300, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="overflow-hidden border-b border-border-subtle"
          >
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-accent">AI</span>
                <span className="text-[10px] text-foreground-subtle">Asistente DineFirst</span>
                {plan === 'pro' && (
                  <span className="text-[10px] text-foreground-subtle/50">· {dailyCount}/{dailyLimit} hoy</span>
                )}
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="text-xs text-foreground-subtle hover:text-foreground transition"
              >
                ▾ Minimizar
              </button>
            </div>
            <div ref={scrollRef} className="h-[260px] overflow-y-auto px-4 pb-3 space-y-2.5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={clsx(
                    'max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed',
                    msg.role === 'user'
                      ? 'ml-auto bg-accent text-white rounded-br-md'
                      : 'bg-background-elevated text-foreground rounded-bl-md',
                  )}
                >
                  {msg.content || (
                    <span className="inline-flex gap-1 text-foreground-subtle">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
                      <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-[10px] text-red-400">
          {error}
        </div>
      )}

      {/* Bottom input bar */}
      <div className="px-4 py-3">
        {/* Quick suggestions when no messages */}
        {!hasMessages && !expanded && (
          <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="shrink-0 text-xs font-semibold text-accent">AI</span>
            {[
              '¿Cuánto he facturado hoy?',
              '¿Plato más vendido?',
              '¿Reservas de mañana?',
            ].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); inputRef.current?.focus() }}
                className="shrink-0 rounded-full border border-border-subtle px-2.5 py-1 text-[10px] text-foreground-subtle hover:text-accent hover:border-accent/30 transition whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Collapsed indicator when messages exist but panel is minimized */}
        {hasMessages && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="mb-2 flex items-center gap-2 text-[10px] text-foreground-subtle hover:text-accent transition"
          >
            <span className="font-semibold text-accent">AI</span>
            <span>▴ {messages.length} mensaje{messages.length !== 1 ? 's' : ''} — clic para expandir</span>
          </button>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); handleSend() }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => { if (hasMessages) setExpanded(true) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Pregunta algo al asistente AI..."
            disabled={streaming}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border-subtle bg-background px-3 py-2 text-xs text-foreground placeholder:text-foreground-subtle/50 focus:border-accent focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-accent text-xs text-white disabled:opacity-30 transition hover:bg-accent-strong"
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  )
}
