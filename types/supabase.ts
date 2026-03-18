/**
 * Tipos generados manualmente para Supabase Database.
 * En producción, regenerar con: npx supabase gen types typescript --project-id=<id>
 *
 * Estos tipos mapean directamente a las tablas PostgreSQL (snake_case).
 * Los tipos de aplicación (camelCase) están en types/database.ts.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'comensal' | 'restaurante' | 'admin' | 'camarero'
          name: string
          email: string
          phone: string | null
          avatar_url: string | null
          username: string | null
          restaurant_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          role?: 'comensal' | 'restaurante' | 'admin' | 'camarero'
          name?: string
          email?: string
          phone?: string | null
          avatar_url?: string | null
          username?: string | null
          restaurant_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'comensal' | 'restaurante' | 'admin' | 'camarero'
          name?: string
          email?: string
          phone?: string | null
          avatar_url?: string | null
          username?: string | null
          restaurant_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          city: string
          address: string
          cuisine_type: string
          capacity: number
          description: string | null
          phone: string | null
          opening_hours: string | null
          plan: 'basic' | 'pro' | 'premium'
          is_active: boolean
          rating: number
          review_count: number
          images: string[]
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          city?: string
          address?: string
          cuisine_type?: string
          capacity?: number
          description?: string | null
          phone?: string | null
          opening_hours?: string | null
          plan?: 'basic' | 'pro' | 'premium'
          is_active?: boolean
          rating?: number
          review_count?: number
          images?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          city?: string
          address?: string
          cuisine_type?: string
          capacity?: number
          description?: string | null
          phone?: string | null
          opening_hours?: string | null
          plan?: 'basic' | 'pro' | 'premium'
          is_active?: boolean
          rating?: number
          review_count?: number
          images?: string[]
          created_at?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          capacity: number
          location: string | null
          status: 'free' | 'occupied' | 'en_route' | 'reserved' | 'inactive'
          qr_code: string | null
          assigned_waiter_id: string | null
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          capacity?: number
          location?: string | null
          status?: 'free' | 'occupied' | 'en_route' | 'reserved' | 'inactive'
          qr_code?: string | null
          assigned_waiter_id?: string | null
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          capacity?: number
          location?: string | null
          status?: 'free' | 'occupied' | 'en_route' | 'reserved' | 'inactive'
          qr_code?: string | null
          assigned_waiter_id?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          description: string | null
          price: number
          category: 'entrantes' | 'principales' | 'postres' | 'bebidas'
          is_available: boolean
          image_url: string | null
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          description?: string | null
          price?: number
          category?: 'entrantes' | 'principales' | 'postres' | 'bebidas'
          is_available?: boolean
          image_url?: string | null
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          description?: string | null
          price?: number
          category?: 'entrantes' | 'principales' | 'postres' | 'bebidas'
          is_available?: boolean
          image_url?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          id: string
          user_id: string
          restaurant_id: string
          table_id: string | null
          user_name: string
          user_email: string
          user_phone: string | null
          restaurant_name: string
          restaurant_city: string | null
          table_name: string | null
          date: string
          time: string
          party_size: number
          status: 'pending' | 'confirmed' | 'cancelled' | 'no_show'
          special_requests: string | null
          confirmation_code: string
          whatsapp_consent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_id: string
          table_id?: string | null
          user_name?: string
          user_email?: string
          user_phone?: string | null
          restaurant_name?: string
          restaurant_city?: string | null
          table_name?: string | null
          date: string
          time: string
          party_size?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'no_show'
          special_requests?: string | null
          confirmation_code: string
          whatsapp_consent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          restaurant_id?: string
          table_id?: string | null
          user_name?: string
          user_email?: string
          user_phone?: string | null
          restaurant_name?: string
          restaurant_city?: string | null
          table_name?: string | null
          date?: string
          time?: string
          party_size?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'no_show'
          special_requests?: string | null
          confirmation_code?: string
          whatsapp_consent?: boolean
          created_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          restaurant_id: string
          user_id: string
          user_name: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          user_id: string
          user_name?: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          user_id?: string
          user_name?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: []
      }
      table_sessions: {
        Row: {
          id: string
          table_id: string
          restaurant_id: string
          started_at: string
          closed_at: string | null
          total_amount: number
          bill_requested: boolean
          bill_requested_at: string | null
          waiter_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          table_id: string
          restaurant_id: string
          started_at?: string
          closed_at?: string | null
          total_amount?: number
          bill_requested?: boolean
          bill_requested_at?: string | null
          waiter_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          table_id?: string
          restaurant_id?: string
          started_at?: string
          closed_at?: string | null
          total_amount?: number
          bill_requested?: boolean
          bill_requested_at?: string | null
          waiter_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          session_id: string
          table_id: string
          restaurant_id: string
          status: 'pending' | 'preparing' | 'served' | 'paid' | 'cancelled'
          notes: string | null
          waiter_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          table_id: string
          restaurant_id: string
          status?: 'pending' | 'preparing' | 'served' | 'paid' | 'cancelled'
          notes?: string | null
          waiter_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          table_id?: string
          restaurant_id?: string
          status?: 'pending' | 'preparing' | 'served' | 'paid' | 'cancelled'
          notes?: string | null
          waiter_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      waiter_rotation_state: {
        Row: {
          restaurant_id: string
          last_rotation_date: string
          last_extra_waiter_id: string | null
          updated_at: string
        }
        Insert: {
          restaurant_id: string
          last_rotation_date?: string
          last_extra_waiter_id?: string | null
          updated_at?: string
        }
        Update: {
          restaurant_id?: string
          last_rotation_date?: string
          last_extra_waiter_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          name: string
          price: number
          quantity: number
          notes: string | null
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          name: string
          price: number
          quantity?: number
          notes?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          name?: string
          price?: number
          quantity?: number
          notes?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          restaurant_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          restaurant_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
