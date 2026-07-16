-- ============================================================
-- NECO v2 · Agrega MARCADOR EXACTO (100% aditiva)
-- ------------------------------------------------------------
-- El pronóstico pasa a marcador completo (home_score / away_score).
-- El puntaje 'exact' (=20) lo aporta el código por defecto, así que
-- NO hace falta tocar la fila de settings. Solo agregamos 2 columnas
-- nullable (no borra nada). Las viejas winner/winner_goals quedan sin
-- uso (en NULL); se pueden limpiar más tarde si se quiere.
-- ============================================================

alter table neco_predictions add column if not exists home_score int;
alter table neco_predictions add column if not exists away_score int;

-- (Opcional) reflejar el puntaje en la BD para poder editarlo desde ahí:
-- update settings set value = value || '{"exact": 20}'::jsonb where key = 'neco_scoring';
