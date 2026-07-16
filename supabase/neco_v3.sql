-- ============================================================
-- NECO v3 · Etapa POR GOL (aditiva)
-- ------------------------------------------------------------
-- La etapa deja de ser una sola por partido y pasa a ser una por
-- gol (multiset), guardada como arreglo de texto. La vieja columna
-- goal_phase (single) queda sin uso. Solo agregamos 1 columna
-- nullable (no borra nada).
-- ============================================================

alter table neco_predictions add column if not exists goal_phases text[];
