-- ============================================================
-- NECO · Evento especial POR CASA (2 partidos finales del Mundial)
-- ------------------------------------------------------------
-- Puntaje 100% independiente de la app general. Participan TODAS
-- las casas MENOS la '2026' (casa simbólica de invitados que no
-- son de la natillera; ellos VEN el menú pero no pronostican).
-- El pronóstico es de la CASA: cualquier integrante lo puede
-- crear/editar con su clave, y se cierra al pitazo como siempre.
-- ============================================================

create table if not exists neco_predictions (
  house_number  text        not null,                       -- casa dueña del pronóstico
  match_id      int         not null references matches(id) on delete cascade,
  winner        text,                                        -- equipo ganador pronosticado
  winner_goals  int,                                         -- nº de goles del equipo ganador
  scorers       text[]      not null default '{}',           -- autores de gol (formato roster/ESPN)
  corners_total int,                                         -- tiros de esquina totales del partido
  goal_phase    text,                                        -- etapa del 1er gol: '1T' | '2T' | 'ET1' | 'ET2'
  penalties     boolean     not null default false,          -- ¿habrá tanda de penaltis?
  updated_by    uuid        references participants(id),     -- quién de la casa editó por última vez
  updated_at    timestamptz not null default now(),
  primary key (house_number, match_id)
);
alter table neco_predictions enable row level security;
create index if not exists idx_neco_match on neco_predictions (match_id);

-- Puntaje NECO (editable sin tocar código):
--  ganador = 10 · nº goles del ganador = 5 · cada goleador = 5 ·
--  córners totales = 5 · etapa de los goles = 5 · penaltis = 3
insert into settings (key, value) values (
  'neco_scoring',
  '{
     "winner": 10,
     "winner_goals": 5,
     "scorer": 5,
     "corners": 5,
     "goal_phase": 5,
     "penalties": 3
   }'::jsonb
) on conflict (key) do nothing;

-- Resultados NECO que la app NO rastrea automáticamente (córners totales).
-- El admin los carga al terminar cada partido. Formato:
--   { "103": { "corners": 9 }, "104": { "corners": 11 } }
insert into settings (key, value) values (
  'neco_actual', '{}'::jsonb
) on conflict (key) do nothing;

-- Configuración del evento (casa excluida y partidos que aplican).
insert into settings (key, value) values (
  'neco_config',
  '{ "excluded_house": "2026", "match_ids": [103, 104] }'::jsonb
) on conflict (key) do nothing;
