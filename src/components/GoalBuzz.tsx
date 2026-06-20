'use client'

import { useEffect } from 'react'

// Vibra el celular cuando el total de goles de un partido sube entre refrescos.
// Guarda el último total visto por partido en sessionStorage.
export default function GoalBuzz({ matchId, goals }: { matchId: number; goals: number }) {
  useEffect(() => {
    const key = `goals_${matchId}`
    const prev = Number(sessionStorage.getItem(key) ?? '-1')
    if (prev >= 0 && goals > prev) {
      // ¡GOOOL! patrón de vibración celebratorio
      navigator.vibrate?.([180, 80, 180, 80, 320])
    }
    sessionStorage.setItem(key, String(goals))
  }, [matchId, goals])
  return null
}
