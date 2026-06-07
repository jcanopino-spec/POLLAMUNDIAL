-- Polla Mundialista 2026 — schema
-- Todo el acceso es server-side con service role; RLS habilitado sin políticas públicas.

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  pin_hash text not null,
  is_admin boolean not null default false,
  champion_team text,                         -- bono: campeón elegido antes del partido inaugural
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id int primary key,                         -- MatchNumber oficial FIFA 1..104
  round int not null,                         -- 1-3 grupos, 4=16avos, 5=octavos, 6=cuartos, 7=semis, 8=3er puesto/final
  group_name text,                            -- 'A'..'L' solo fase de grupos
  kickoff_utc timestamptz not null,
  venue text,
  home_team text not null,                    -- nombre o placeholder ('2A', '1C', '3ABCDF', 'W89'...)
  away_team text not null,
  home_score int,
  away_score int,
  winner text,                                -- ganador real (clave en eliminatorias definidas por penales)
  manual_result boolean not null default false, -- resultado ingresado por el admin (el feed aún no lo trae)
  status text not null default 'scheduled' check (status in ('scheduled','live','finished')),
  updated_at timestamptz not null default now()
);

create table if not exists predictions (
  participant_id uuid not null references participants(id) on delete cascade,
  match_id int not null references matches(id) on delete cascade,
  home_score int not null check (home_score between 0 and 99),
  away_score int not null check (away_score between 0 and 99),
  points int,                                 -- null hasta que el partido finalice
  updated_at timestamptz not null default now(),
  primary key (participant_id, match_id)
);

create table if not exists settings (
  key text primary key,
  value jsonb not null
);

-- Configuración de puntaje (editable sin tocar código):
-- exact/outcome = base; multipliers por ronda; el partido 104 (final) usa final_multiplier.
insert into settings (key, value) values (
  'scoring',
  '{
    "exact": 5,
    "outcome": 3,
    "multipliers": {"1": 1, "2": 1, "3": 1, "4": 2, "5": 3, "6": 4, "7": 5, "8": 5},
    "final_multiplier": 6,
    "champion_bonus": 30
  }'::jsonb
) on conflict (key) do nothing;

create index if not exists idx_matches_kickoff on matches (kickoff_utc);
create index if not exists idx_predictions_match on predictions (match_id);

alter table participants enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;
alter table settings enable row level security;
