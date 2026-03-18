'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { isSupabaseConfigured } from '@/lib/env'
import { sbGetRestaurantForCurrentUser } from '@/lib/supabase-data'
import { getRestaurantForCurrentUser } from '@/lib/data'
import type { Restaurant } from '@/types/database'

/**
 * Hook that resolves the current user's restaurant.
 * Works in both localStorage and Supabase modes.
 */
export function useRestaurant() {
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [restaurantId, setRestaurantId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    async function load() {
      try {
        if (isSupabaseConfigured()) {
          const rest = await sbGetRestaurantForCurrentUser()
          setRestaurant(rest)
          setRestaurantId(rest?.id ?? '')
        } else {
          const rest = getRestaurantForCurrentUser()
          setRestaurant(rest)
          setRestaurantId(rest?.id ?? 'rest-1')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  return { restaurant, restaurantId, loading, setRestaurant }
}
