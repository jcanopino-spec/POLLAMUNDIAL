'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Refresca la ruta cada `seconds` para traer el marcador/estado nuevo (server component).
export default function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000)
    return () => clearInterval(t)
  }, [router, seconds])
  return null
}
