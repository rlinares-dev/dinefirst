import { MOCK_RESTAURANTS } from '@/lib/mock-data'
import RestaurantClient from './restaurant-client'

// Required for Next.js static export (Capacitor mobile build)
export function generateStaticParams() {
  return MOCK_RESTAURANTS.map((r) => ({
    ciudad: r.city,
    slug: r.slug,
  }))
}

interface Props {
  params: { ciudad: string; slug: string }
}

export default function RestaurantPage({ params }: Props) {
  return <RestaurantClient ciudad={params.ciudad} slug={params.slug} />
}
