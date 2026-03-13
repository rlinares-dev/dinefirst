import { NextResponse } from 'next/server'
import { MOCK_RESTAURANTS } from '@/lib/mock-data'

export async function GET(request: Request) {
  // In static export (mobile), searchParams won't work — return all active restaurants
  let city: string | undefined
  let cuisine: string | undefined

  try {
    const { searchParams } = new URL(request.url)
    city = searchParams.get('city') ?? undefined
    cuisine = searchParams.get('cuisine') ?? undefined
  } catch {
    // Static export fallback — no URL available
  }

  const restaurants = MOCK_RESTAURANTS.filter((r) => {
    const matchCity = !city || r.city.toLowerCase() === city.toLowerCase()
    const matchCuisine = !cuisine || r.cuisineType.toLowerCase().includes(cuisine.toLowerCase())
    return matchCity && matchCuisine && r.isActive
  }).slice(0, 20)

  return NextResponse.json({ restaurants })
}
