'use client'

import { useState, useEffect, useCallback } from 'react'
import { isSupabaseConfigured } from '@/lib/env'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { useRestaurant } from '@/lib/hooks/use-restaurant'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

interface PushState {
  isSupported: boolean
  permission: NotificationPermission | 'default'
  isSubscribed: boolean
  loading: boolean
}

export function usePushNotifications() {
  const { user } = useAuth()
  const { restaurantId } = useRestaurant()
  const [state, setState] = useState<PushState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    loading: true,
  })

  // Check current state on mount
  useEffect(() => {
    async function checkState() {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      if (!supported) {
        setState({ isSupported: false, permission: 'default', isSubscribed: false, loading: false })
        return
      }

      const permission = Notification.permission

      let isSubscribed = false
      try {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js')
        if (registration) {
          const subscription = await registration.pushManager.getSubscription()
          isSubscribed = !!subscription
        }
      } catch {
        // SW not registered yet
      }

      setState({ isSupported: true, permission, isSubscribed, loading: false })
    }
    checkState()
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey || !user?.id || !restaurantId) return false

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState((s) => ({ ...s, permission }))
        return false
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      const json = subscription.toJSON()
      const keys = json.keys as { p256dh: string; auth: string }
      const endpoint = json.endpoint ?? subscription.endpoint

      // Save to Supabase
      if (isSupabaseConfigured()) {
        const supabase = createClient()
        await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          restaurant_id: restaurantId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        }, { onConflict: 'endpoint' })
      } else {
        // localStorage fallback: store subscription for demo
        const subs = JSON.parse(localStorage.getItem('df_push_subs') || '[]')
        subs.push({
          userId: user.id,
          restaurantId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        })
        localStorage.setItem('df_push_subs', JSON.stringify(subs))
      }

      setState((s) => ({ ...s, permission: 'granted', isSubscribed: true }))
      return true
    } catch (err) {
      console.error('Push subscription failed:', err)
      return false
    }
  }, [user?.id, restaurantId])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js')
      if (!registration) return false

      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) return false

      // Remove from server
      if (isSupabaseConfigured()) {
        const supabase = createClient()
        await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
      } else {
        const subs = JSON.parse(localStorage.getItem('df_push_subs') || '[]')
        const filtered = subs.filter((s: { endpoint: string }) => s.endpoint !== subscription.endpoint)
        localStorage.setItem('df_push_subs', JSON.stringify(filtered))
      }

      await subscription.unsubscribe()
      setState((s) => ({ ...s, isSubscribed: false }))
      return true
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
      return false
    }
  }, [])

  return { ...state, subscribe, unsubscribe }
}
