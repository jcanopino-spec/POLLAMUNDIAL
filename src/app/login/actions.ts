'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { adminDb } from '@/lib/db'
import { createSession, destroySession } from '@/lib/session'

export async function login(_prev: { error?: string } | null, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const pin = String(formData.get('pin') ?? '').trim()
  if (!name || !/^\d{4}$/.test(pin)) return { error: 'Ingresa tu nombre y un PIN de 4 dígitos.' }

  const db = adminDb()
  const { data: p } = await db
    .from('participants')
    .select('id, name, pin_hash, is_admin, must_change_pin, champion_team, finalist1, finalist2')
    .ilike('name', name)
    .maybeSingle()

  if (!p || !(await bcrypt.compare(pin, p.pin_hash))) {
    return { error: 'Nombre o PIN incorrecto. ¿Seguro que vives en esa casa? 🏠' }
  }

  await createSession({ id: p.id, name: p.name, isAdmin: p.is_admin })
  // Primer ingreso (o picks pendientes) → pasar por la bienvenida
  const needsOnboarding = p.must_change_pin || !p.champion_team || !p.finalist1 || !p.finalist2
  redirect(needsOnboarding ? '/bienvenida' : '/')
}

export async function logout() {
  await destroySession()
  redirect('/login')
}

// Reconocimiento del vecino mientras escribe su nombre: si hay una única
// coincidencia, devolvemos su casa y apodo para darle la bienvenida.
export async function lookupName(name: string) {
  const clean = name.trim()
  if (clean.length < 3) return null
  const db = adminDb()
  const { data } = await db
    .from('participants')
    .select('name, nickname, house_number, must_change_pin')
    .ilike('name', `${clean}%`)
    .limit(2)
  if (!data || data.length !== 1) return null
  const p = data[0]
  return { name: p.name, nickname: p.nickname, house: p.house_number, firstTime: p.must_change_pin }
}
