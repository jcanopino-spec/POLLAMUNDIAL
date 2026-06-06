import { syncResults } from '@/lib/sync'

export const dynamic = 'force-dynamic'

// Respaldo programado (Vercel Cron) + endpoint para un cron externo
// (ej. cron-job.org cada 10 min durante los partidos).
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const result = await syncResults(true)
    return Response.json({ ok: true, ...result })
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
