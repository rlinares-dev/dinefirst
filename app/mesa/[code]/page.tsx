import { MOCK_TABLES } from '@/lib/mock-data'
import MesaClient from './mesa-client'

// Pre-generate pages for mock QR codes (static export)
export function generateStaticParams() {
  return MOCK_TABLES.map((t) => ({ code: t.qrCode }))
}

export default function MesaPage() {
  return <MesaClient />
}
