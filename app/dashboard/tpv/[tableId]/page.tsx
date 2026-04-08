import { MOCK_TABLES } from '@/lib/mock-data'
import SessionDetailClient from './session-client'

// Pre-generate pages for mock tables (static export)
export function generateStaticParams() {
  return MOCK_TABLES.map((t) => ({ tableId: t.id }))
}

export default function SessionDetailPage() {
  return <SessionDetailClient />
}
