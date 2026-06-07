# 🏆 Polla Mundial 2026

Simulador/polla del Mundial de Fútbol 2026 (Canadá · México · Estados Unidos) para hasta **25 participantes**.

## Cómo funciona

- **Pronósticos por partido**: cada participante ingresa el marcador de los 104 partidos. El ingreso se **bloquea automáticamente al inicio de cada partido** (validación server-side).
- **Puntaje** (configurable en `settings.scoring` de Supabase):
  | Fase | Marcador exacto | Solo resultado (1X2) |
  |---|---|---|
  | Fase de grupos | 5 | 3 |
  | Dieciseisavos | 10 | 6 |
  | Octavos | 15 | 9 |
  | Cuartos | 20 | 12 |
  | Semis y 3er puesto | 25 | 15 |
  | Final | 30 | 18 |
  - Bono **campeón**: 30 pts (se elige antes del partido inaugural).
  - Regla de la casa: se compara el **marcador final (incluida prórroga, sin penales)**.
- **Actualización automática**: los resultados se sincronizan desde [fixturedownload.com](https://fixturedownload.com/results/fifa-world-cup-2026) cada vez que alguien abre la app (máx. cada 5 min) + cron diario de respaldo + botón "Sincronizar ahora" del admin. Los equipos de eliminatorias se actualizan solos al cerrarse los grupos.
- **Acceso**: nombre + PIN de 4 dígitos (el admin crea los participantes en `/admin`).
- Horarios mostrados en **hora de Colombia**.

## Setup

1. Crea un proyecto en [supabase.com](https://supabase.com) y ejecuta `supabase/schema.sql` en el SQL Editor.
2. Copia `.env.local.example` a `.env.local` y completa `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET` (`openssl rand -base64 32`) y `CRON_SECRET`.
3. Siembra los 104 partidos: `node scripts/seed.mjs`
4. Crea el primer admin (genera el hash con `npx tsx -e "import b from 'bcryptjs'; console.log(b.hashSync('TU_PIN', 10))"`):
   ```sql
   insert into participants (name, pin_hash, is_admin) values ('Jaime', '<hash>', true);
   ```
5. `npm run dev` para local, o despliega en Vercel configurando las mismas variables de entorno.

> **Nota Vercel Hobby**: el cron incluido corre 1 vez/día (límite del plan). La sincronización principal es la perezosa al abrir la app, que es suficiente. Si quieres latencia mínima sin visitas, apunta un cron externo gratuito (cron-job.org) a `GET /api/cron/sync` con header `Authorization: Bearer <CRON_SECRET>` cada 10 min.

## Stack

Next.js 16 (App Router, server actions) · Supabase (Postgres, acceso solo server-side con service role) · Tailwind 4 · Vercel.
