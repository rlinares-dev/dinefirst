'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { getTablesForRestaurant, getRestaurantById } from '@/lib/data'
import type { Table, Restaurant } from '@/types/database'

/**
 * Generates a simple QR-like pattern on a canvas.
 * Not a real QR encoder — visual placeholder for print.
 * In production, replace with a proper QR library.
 */
function drawQRPattern(canvas: HTMLCanvasElement, data: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const size = 200
  canvas.width = size
  canvas.height = size
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  // Simple hash-based pattern
  const gridSize = 25
  const cellSize = size / gridSize
  ctx.fillStyle = '#000000'

  // Fixed corner patterns (QR finder patterns)
  const drawFinder = (x: number, y: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const isBorder = i === 0 || i === 6 || j === 0 || j === 6
        const isInner = i >= 2 && i <= 4 && j >= 2 && j <= 4
        if (isBorder || isInner) {
          ctx.fillRect((x + i) * cellSize, (y + j) * cellSize, cellSize, cellSize)
        }
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(gridSize - 7, 0)
  drawFinder(0, gridSize - 7)

  // Data pattern from string hash
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0
  }

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // Skip finder pattern areas
      if ((x < 8 && y < 8) || (x >= gridSize - 8 && y < 8) || (x < 8 && y >= gridSize - 8)) continue

      const seed = (hash + x * 31 + y * 37) & 0xffff
      if (seed % 3 === 0) {
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
      }
    }
  }
}

export default function QRPrintPage() {
  const params = useParams<{ tableId: string }>()
  const tableId = params.tableId
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [table, setTable] = useState<Table | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)

  useEffect(() => {
    const tables = getTablesForRestaurant('rest-1')
    const t = tables.find((tb) => tb.id === tableId)
    if (t) {
      setTable(t)
      const r = getRestaurantById(t.restaurantId)
      if (r) setRestaurant(r)
    }
  }, [tableId])

  useEffect(() => {
    if (table && canvasRef.current) {
      drawQRPattern(canvasRef.current, table.qrCode)
    }
  }, [table])

  if (!table || !restaurant) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-foreground-subtle">Mesa no encontrada</p>
      </div>
    )
  }

  const clientUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/mesa/${table.qrCode}`
    : `/mesa/${table.qrCode}`

  return (
    <div className="space-y-6">
      {/* Screen header (hidden in print) */}
      <div className="flex items-center justify-between print:hidden">
        <a href="/dashboard/mesas" className="text-sm text-foreground-subtle hover:text-foreground transition">
          ← Volver a mesas
        </a>
        <button
          onClick={() => window.print()}
          className="btn-primary text-sm"
        >
          Imprimir QR
        </button>
      </div>

      {/* Printable QR card */}
      <div className="mx-auto max-w-sm rounded-2xl border border-border-subtle bg-white p-8 text-center print:border-2 print:border-black print:shadow-none">
        <p className="text-xl font-bold text-gray-900">{restaurant.name}</p>
        <p className="mt-1 text-sm text-gray-500">{table.name} · {table.location}</p>

        <div className="my-6 flex justify-center">
          <canvas
            ref={canvasRef}
            className="h-48 w-48"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <p className="text-sm font-semibold text-gray-700">Escanea para ver la carta y pedir</p>
        <p className="mt-1 text-xs text-gray-400 font-mono break-all">{clientUrl}</p>

        <div className="mt-4 border-t border-gray-200 pt-3">
          <p className="text-[10px] text-gray-400">Powered by DineFirst</p>
        </div>
      </div>
    </div>
  )
}
