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
    .select('id, name, pin_hash, is_admin')
    .ilike('name', name)
    .maybeSingle()

  if (!p || !(await bcrypt.compare(pin, p.pin_hash))) {
    return { error: 'Nombre o PIN incorrecto.' }
  }

  await createSession({ id: p.id, name: p.name, isAdmin: p.is_admin })
  redirect('/')
}

export async function logout() {
  await destroySession()
  redirect('/login')
}
