export type Role = 'comensal' | 'restaurante' | 'admin' | 'camarero'
export type Plan = 'basic' | 'pro' | 'premium'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show'
export type MenuCategory = 'entrantes' | 'principales' | 'postres' | 'bebidas'
export type ReviewRating = 1 | 2 | 3 | 4 | 5
export type TableStatus = 'free' | 'occupied' | 'en_route' | 'reserved' | 'inactive'
export type OrderStatus = 'pending' | 'preparing' | 'served' | 'paid' | 'cancelled'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  phone: string
  createdAt: string
  restaurantId?: string
  username?: string // Only for camarero — unique per restaurant, used for login
}

export interface Restaurant {
  id: string
  ownerId: string
  name: string
  slug: string
  city: string
  address: string
  cuisineType: string
  capacity: number
  description: string
  plan: Plan
  isActive: boolean
  rating: number
  reviewCount: number
  phone: string
  openingHours: string
  createdAt: string
  images?: string[]
}

export interface Table {
  id: string
  restaurantId: string
  name: string
  capacity: number
  status: TableStatus
  location: string
  qrCode: string
  assignedWaiterId?: string
}

export interface TableSession {
  id: string
  tableId: string
  restaurantId: string
  startedAt: string
  closedAt: string | null
  totalAmount: number
  billRequested?: boolean
  billRequestedAt?: string
  waiterId?: string
}

export interface Order {
  id: string
  sessionId: string
  tableId: string
  restaurantId: string
  status: OrderStatus
  items: OrderItem[]
  notes: string
  createdAt: string
  waiterId?: string
}

export interface OrderItem {
  id: string
  orderId: string
  menuItemId: string
  name: string
  price: number
  quantity: number
  notes: string
}

export interface MenuItem {
  id: string
  restaurantId: string
  name: string
  description: string
  price: number
  category: MenuCategory
  isAvailable: boolean
  imageUrl?: string
}

export interface Reservation {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone: string
  restaurantId: string
  restaurantName: string
  restaurantCity: string
  tableId: string
  tableName: string
  date: string
  time: string
  partySize: number
  status: ReservationStatus
  specialRequests: string
  confirmationCode: string
  createdAt: string
}

export interface Review {
  id: string
  restaurantId: string
  userId: string
  userName: string
  rating: ReviewRating
  comment: string
  createdAt: string
  response?: string
  respondedAt?: string
}

export interface WaiterRotationState {
  restaurantId: string
  lastRotationDate: string // YYYY-MM-DD
  lastExtraWaiterId: string | null
  updatedAt: string
}

export interface PlanFeature {
  name: string
  included: boolean
}

export interface PlanInfo {
  id: Plan
  name: string
  price: number
  description: string
  features: PlanFeature[]
  highlighted: boolean
}
