-- This script introduces the Projects feature.
-- It is designed to be idempotent and can be re-run safely.

-- 1. Create the projects table
CREATE TABLE IF NOT EXISTS projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    is_archived boolean NOT NULL DEFAULT false,
    severance_deadline_time time,
    severance_deadline_timezone text,
    pre_end_date_contact_alias text,
    post_end_date_contact_alias text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(company_id, name)
);

-- 2. Create the function to update the `updated_at` timestamp
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Add the `updated_at` trigger to the `projects` table (if it doesn't exist)
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'projects'::regclass) THEN
      CREATE TRIGGER handle_updated_at BEFORE UPDATE ON projects 
      FOR EACH ROW EXECUTE PROCEDURE moddatetime();
   END IF;
END
$$;

-- 4. Add the `project_id` column to the `company_users` table
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_users' AND column_name='project_id') THEN
      ALTER TABLE company_users ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
   END IF;
END
$$;

-- 5. Add the `project_access` column to the `company_hr_assignments` table
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_hr_assignments' AND column_name='project_access') THEN
      ALTER TABLE company_hr_assignments ADD COLUMN project_access jsonb DEFAULT '["all"]'::jsonb;
   END IF;
END
$$;

-- 6. Add the `project_ids` column to the `company_resources` table
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_resources' AND column_name='project_ids') THEN
      ALTER TABLE company_resources ADD COLUMN project_ids jsonb;
   END IF;
END
$$;

-- 7. Add the `project_configs` column to the `company_question_configs` table
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_question_configs' AND column_name='project_configs') THEN
      ALTER TABLE company_question_configs ADD COLUMN project_configs jsonb;
   END IF;
END
$$;

-- 8. [CORRECTION] Drop the incorrect triggers from tables that do not have `updated_at`
DROP TRIGGER IF EXISTS handle_updated_at ON company_users;
DROP TRIGGER IF EXISTS handle_updated_at ON company_hr_assignments;

-- The following tables from the original schema already have `updated_at` and should have the trigger.
-- This part ensures the trigger exists on the correct tables.
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'companies'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'platform_users'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON platform_users FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'company_hr_assignments'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON company_hr_assignments FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'company_users'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON company_users FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'user_profiles'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'user_assessments'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON user_assessments FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'master_questions'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON master_questions FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'master_question_configs'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON master_question_configs FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'company_question_configs'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON company_question_configs FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'master_tasks'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON master_tasks FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'master_tips'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON master_tips FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'company_resources'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON company_resources FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'external_resources'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON external_resources FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'guidance_rules'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON guidance_rules FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'review_queue'::regclass) THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON review_queue FOR EACH ROW EXECUTE PROCEDURE moddatetime(); END IF; END $$;
