import LoginForm, { type Vecino } from '@/components/LoginForm'
import { adminDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const db = adminDb()
  const { data } = await db
    .from('participants')
    .select('name, nickname, house_number, must_change_pin')
    .order('nickname')

  const vecinos: Vecino[] = (data ?? []).map((p) => ({
    name: p.name,
    nickname: p.nickname,
    house: p.house_number,
    firstTime: p.must_change_pin,
  }))

  return <LoginForm vecinos={vecinos} />
}
