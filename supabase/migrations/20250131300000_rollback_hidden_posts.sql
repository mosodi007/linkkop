-- Rollback: remove hidden_posts table (policies and index are dropped with the table)
drop table if exists public.hidden_posts;
