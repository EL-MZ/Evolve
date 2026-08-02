-- User-selected progress steps. Calendar sessions already live in the
-- scheduled_sessions table created by 0001_initial_schema.sql.

alter table public.goals
  add column log_increment numeric(12, 2) not null default 1
  check (log_increment > 0);
