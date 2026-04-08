import { MOCK_TABLES } from '@/lib/mock-data'
import QRPrintClient from './qr-client'

// Pre-generate pages for mock tables (static export)
export function generateStaticParams() {
  return MOCK_TABLES.map((t) => ({ tableId: t.id }))
}

export default function QRPrintPage() {
  return <QRPrintClient />
}
