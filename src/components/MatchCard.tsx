'use client'

import { useState, useTransition } from 'react'
import { savePrediction } from '@/app/actions'
import { teamFlag, teamShort } from '@/lib/teams'
import { stadiumOf } from '@/lib/stadiums'

// Banner del estadio: foto con el nombre y ciudad sobrepuestos
function StadiumBanner({ venue }: { venue: string | null }) {
  const st = stadiumOf(venue)
  if (!st) return null
  return (
    <div className="relative h-[88px] overflow-hidden" style={{ borderBottom: '2.5px solid var(--ink)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/stadiums/${st.img}.jpg`} alt={st.nombre} loading="lazy" className="w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(27,23,20,.85) 0%, rgba(27,23,20,.15) 55%, transparent 100%)' }} />
      <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="display text-[15px] uppercase leading-none truncate" style={{ color: '#fff' }}>{st.nombre}</p>
          <p className="text-[10px] font-extrabold" style={{ color: 'var(--yellow)' }}>{st.pais} {st.ciudad}</p>
        </div>
      </div>
    </div>
  )
}

type Props = {
  matchId: number
  home: string
  away: string
  kickoffLabel: string
  venue: string | null
  tv: string
  groupLabel: string
  locked: boolean
  status: 'scheduled' | 'live' | 'finished'
  actualHome: number | null
  actualAway: number | null
  initialHome: number | null
  initialAway: number | null
  points: number | null
  maxExact: number
}

function Stepper({ val, set, disabled, label }: { val: number; set: (v: number) => void; disabled: boolean; label: string }) {
  return (
    <div className="stepper">
      <div className="num">{val}</div>
      <div className="ctrls">
        <button type="button" disabled={disabled} aria-label={`Menos goles ${label}`} onClick={() => set(Math.max(0, val - 1))}>−</button>
        <button type="button" disabled={disabled} aria-label={`Más goles ${label}`} onClick={() => set(Math.min(15, val + 1))}>+</button>
      </div>
    </div>
  )
}

export default function MatchCard(p: Props) {
  const [saved, setSaved] = useState<{ home: number; away: number } | null>(
    p.initialHome != null ? { home: p.initialHome, away: p.initialAway ?? 0 } : null
  )
  const [home, setHome] = useState(saved?.home ?? 0)
  const [away, setAway] = useState(saved?.away ?? 0)
  const [editing, setEditing] = useState(saved == null)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const esColombia = p.home === 'Colombia' || p.away === 'Colombia'
  const dirty = !saved || saved.home !== home || saved.away !== away

  function onButton() {
    if (p.locked || pending) return
    if (!editing) {
      setEditing(true)
      setError('')
      return
    }
    startTransition(async () => {
      const res = await savePrediction(p.matchId, home, away)
      if (res?.error) {
        setError(res.error)
      } else {
        setSaved({ home, away })
        setEditing(false)
        setError('')
      }
    })
  }

  // Partido terminado: resultado grande + badge de puntos
  if (p.status === 'finished') {
    const kind = p.points == null ? null : p.points >= p.maxExact ? 'hit' : p.points > 0 ? 'part' : 'miss'
    return (
      <div className="match done fade">
        <StadiumBanner venue={p.venue} />
        <div className="mtop">
          <span className="grp">{p.groupLabel}</span>
          <span>{p.kickoffLabel} · FINAL</span>
        </div>
        <div className="mbody" style={{ paddingBottom: 6 }}>
          <div className="mteam"><div className="fl">{teamFlag(p.home)}</div><div className="nm">{teamShort(p.home)}</div></div>
          <div className="resultline"><span className="big">{p.actualHome}</span><span className="scoremid">:</span><span className="big">{p.actualAway}</span></div>
          <div className="mteam"><div className="fl">{teamFlag(p.away)}</div><div className="nm">{teamShort(p.away)}</div></div>
        </div>
        <div className="predbadge">
          <span className="pl">
            {saved ? <>Tu pronóstico: <b>{saved.home}–{saved.away}</b></> : 'No pronosticaste 🫥'}
          </span>
          {kind && (
            <span className={`ptsbadge ${kind}`}>
              {kind === 'hit' ? '¡Exacto!' : kind === 'part' ? 'Acertaste' : 'Falló'} · +{p.points}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`match fade ${p.status === 'live' ? 'live' : esColombia ? 'col' : ''}`}>
      <StadiumBanner venue={p.venue} />
      <div className="mtop">
        <span className="grp">{esColombia && '🇨🇴 '}{p.groupLabel}</span>
        <span>{p.status === 'live' ? '● EN JUEGO' : p.kickoffLabel}</span>
      </div>
      <div className="mbody">
        <div className="mteam"><div className="fl">{teamFlag(p.home)}</div><div className="nm">{teamShort(p.home)}</div></div>
        <div className="flex items-center gap-1">
          <Stepper val={home} set={(v) => { setHome(v); setError('') }} disabled={p.locked || !editing} label={p.home} />
          <span className="scoremid">:</span>
          <Stepper val={away} set={(v) => { setAway(v); setError('') }} disabled={p.locked || !editing} label={p.away} />
        </div>
        <div className="mteam"><div className="fl">{teamFlag(p.away)}</div><div className="nm">{teamShort(p.away)}</div></div>
      </div>
      <div className="mfoot">
        {p.locked ? (
          <div className="predbadge" style={{ margin: 0 }}>
            <span className="pl">{saved ? <>Tu pronóstico: <b>{saved.home}–{saved.away}</b></> : 'Te cogió la noche 🫥'}</span>
            <span className="ptsbadge" style={{ background: 'var(--cream-2)' }}>🔒</span>
          </div>
        ) : (
          <>
            <button className={`savebtn ${!editing ? 'saved' : ''}`} disabled={pending || (editing && !dirty && !!saved)} onClick={onButton}>
              {pending ? 'Guardando…' : !editing ? '✓ Guardado · editar ✏️' : 'Guardar pronóstico 💾'}
            </button>
            {!editing && saved && (
              <div className="savedline">¡Quedó! {teamShort(p.home)} {saved.home}–{saved.away} {teamShort(p.away)} 🔒 al pitazo</div>
            )}
            {error && <div className="savedline err">{error}</div>}
          </>
        )}
        <p className="text-center text-[10px] font-bold pt-2" style={{ color: 'var(--muted)' }}>
          📺 {p.tv}
        </p>
      </div>
    </div>
  )
}
