import { render, screen, fireEvent } from '@testing-library/react'
import ComandaCard from '@/components/comandas/comanda-card'
import type { Order } from '@/types/database'

const mockOrder: Order = {
  id: 'order-1',
  sessionId: 'sess-1',
  tableId: 'table-1',
  restaurantId: 'rest-1',
  status: 'pending',
  notes: 'Sin gluten',
  createdAt: new Date().toISOString(),
  items: [
    { id: 'oi-1', orderId: 'order-1', menuItemId: 'mi-1', name: 'Risotto', price: 14, quantity: 2, notes: 'Extra queso' },
    { id: 'oi-2', orderId: 'order-1', menuItemId: 'mi-2', name: 'Agua', price: 2.5, quantity: 1, notes: '' },
  ],
}

describe('ComandaCard', () => {
  it('renders table name', () => {
    render(<ComandaCard order={mockOrder} tableName="Mesa 3" onStatusChange={jest.fn()} />)
    expect(screen.getByText('Mesa 3')).toBeInTheDocument()
  })

  it('renders item names and quantities', () => {
    render(<ComandaCard order={mockOrder} tableName="Mesa 3" onStatusChange={jest.fn()} />)
    expect(screen.getByText('Risotto')).toBeInTheDocument()
    expect(screen.getByText('Agua')).toBeInTheDocument()
    expect(screen.getByText('2x')).toBeInTheDocument()
    expect(screen.getByText('1x')).toBeInTheDocument()
  })

  it('renders item notes', () => {
    render(<ComandaCard order={mockOrder} tableName="Mesa 3" onStatusChange={jest.fn()} />)
    expect(screen.getByText(/Extra queso/)).toBeInTheDocument()
  })

  it('renders order notes', () => {
    render(<ComandaCard order={mockOrder} tableName="Mesa 3" onStatusChange={jest.fn()} />)
    expect(screen.getByText('Sin gluten')).toBeInTheDocument()
  })

  it('shows "Preparar" button for pending orders', () => {
    const onStatusChange = jest.fn()
    render(<ComandaCard order={mockOrder} tableName="Mesa 3" onStatusChange={onStatusChange} />)
    const btn = screen.getByText('Preparar')
    fireEvent.click(btn)
    expect(onStatusChange).toHaveBeenCalledWith('order-1', 'preparing')
  })

  it('shows "Listo" button for preparing orders', () => {
    const onStatusChange = jest.fn()
    const preparing: Order = { ...mockOrder, status: 'preparing' }
    render(<ComandaCard order={preparing} tableName="Mesa 3" onStatusChange={onStatusChange} />)
    const btn = screen.getByText('Listo')
    fireEvent.click(btn)
    expect(onStatusChange).toHaveBeenCalledWith('order-1', 'served')
  })

  it('shows no action button for served orders', () => {
    const served: Order = { ...mockOrder, status: 'served' }
    render(<ComandaCard order={served} tableName="Mesa 3" onStatusChange={jest.fn()} />)
    expect(screen.queryByText('Preparar')).toBeNull()
    expect(screen.queryByText('Listo')).toBeNull()
  })

  it('marks order as URGENTE if pending > 10 min', () => {
    const oldOrder: Order = {
      ...mockOrder,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    }
    render(<ComandaCard order={oldOrder} tableName="Mesa 3" onStatusChange={jest.fn()} />)
    expect(screen.getByText('URGENTE')).toBeInTheDocument()
  })

  it('does not show URGENTE for recent orders', () => {
    render(<ComandaCard order={mockOrder} tableName="Mesa 3" onStatusChange={jest.fn()} />)
    expect(screen.queryByText('URGENTE')).toBeNull()
  })
})
