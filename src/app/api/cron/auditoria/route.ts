import { adminDb } from '@/lib/db'
import { runAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Auditoría diaria de puntajes (Vercel Cron). Guarda el resultado en settings
// para mostrarlo en el panel de Admin, y responde 500 si hay descuadres
// (así Vercel marca la ejecución como fallida y te avisa).
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const result = await runAudit()
    await adminDb().from('settings').upsert({ key: 'last_audit', value: result })
    return Response.json(result, { status: result.ok ? 200 : 500 })
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
