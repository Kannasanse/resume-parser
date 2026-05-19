alter table study_plans
  add column if not exists preferences_history jsonb default '[]';
