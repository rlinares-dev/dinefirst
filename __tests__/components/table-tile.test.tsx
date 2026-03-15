import { render, screen, fireEvent } from '@testing-library/react'
import TableTile from '@/components/tpv/table-tile'
import type { Table } from '@/types/database'

const mockTable: Table = {
  id: 'table-1',
  restaurantId: 'rest-1',
  name: 'Mesa 1',
  capacity: 4,
  status: 'free',
  location: 'Terraza',
  qrCode: 'qr-test-123',
}

describe('TableTile', () => {
  it('renders table name and location', () => {
    render(<TableTile table={mockTable} />)
    expect(screen.getByText('Mesa 1')).toBeInTheDocument()
    expect(screen.getByText('Terraza')).toBeInTheDocument()
  })

  it('renders capacity', () => {
    render(<TableTile table={mockTable} />)
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('personas')).toBeInTheDocument()
  })

  it('shows status label', () => {
    render(<TableTile table={mockTable} />)
    expect(screen.getByText('Libre')).toBeInTheDocument()
  })

  it('shows "Ocupar" button for free tables', () => {
    const onOccupy = jest.fn()
    render(<TableTile table={mockTable} onOccupy={onOccupy} />)
    const btn = screen.getByText('Ocupar')
    fireEvent.click(btn)
    expect(onOccupy).toHaveBeenCalledTimes(1)
  })

  it('shows "Liberar" button for occupied tables', () => {
    const onFree = jest.fn()
    const occupied: Table = { ...mockTable, status: 'occupied' }
    render(<TableTile table={occupied} onFree={onFree} />)
    const btn = screen.getByText('Liberar')
    fireEvent.click(btn)
    expect(onFree).toHaveBeenCalledTimes(1)
  })

  it('shows pending orders badge when > 0', () => {
    render(<TableTile table={mockTable} pendingOrders={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not show badge when pendingOrders is 0', () => {
    const { container } = render(<TableTile table={mockTable} pendingOrders={0} />)
    const badge = container.querySelector('.bg-red-500')
    expect(badge).toBeNull()
  })

  it('renders session duration when provided', () => {
    render(<TableTile table={{ ...mockTable, status: 'occupied' }} sessionDuration="01:23:45" />)
    expect(screen.getByText('01:23:45')).toBeInTheDocument()
  })

  it('applies opacity for inactive tables', () => {
    const inactive: Table = { ...mockTable, status: 'inactive' }
    const { container } = render(<TableTile table={inactive} />)
    expect(container.firstChild).toHaveClass('opacity-50')
  })

  it('calls onClick when card is clicked', () => {
    const onClick = jest.fn()
    render(<TableTile table={mockTable} onClick={onClick} />)
    fireEvent.click(screen.getByText('Mesa 1'))
    expect(onClick).toHaveBeenCalled()
  })
})
