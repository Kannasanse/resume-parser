-- Add creation_mode and selected_skills to study_plans
DO $$ BEGIN
  ALTER TABLE study_plans
    ADD COLUMN creation_mode text NOT NULL DEFAULT 'career_map';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE study_plans
    ADD COLUMN selected_skills text[] DEFAULT array[]::text[];
EXCEPTION WHEN others THEN NULL;
END $$;

-- Make target_role_id and target_role_title nullable (for skills mode)
DO $$ BEGIN
  ALTER TABLE study_plans
    ALTER COLUMN target_role_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE study_plans
    ALTER COLUMN target_role_title DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Add creation_mode and selected_skills to career_map_sessions
DO $$ BEGIN
  ALTER TABLE career_map_sessions
    ADD COLUMN creation_mode text NOT NULL DEFAULT 'resume';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE career_map_sessions
    ADD COLUMN selected_skills text[] DEFAULT array[]::text[];
EXCEPTION WHEN others THEN NULL;
END $$;
