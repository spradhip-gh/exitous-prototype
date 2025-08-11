-- Create the function to update the updated_at column
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    severance_deadline_time TIME,
    severance_deadline_timezone TEXT,
    pre_end_date_contact_alias TEXT,
    post_end_date_contact_alias TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Add triggers for projects table if they don't exist
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'projects'::regclass) THEN
      CREATE TRIGGER handle_updated_at
      BEFORE UPDATE ON projects
      FOR EACH ROW
      EXECUTE PROCEDURE moddatetime();
   END IF;
END $$;


-- Add project_id to company_users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_users' AND column_name='project_id') THEN
        ALTER TABLE company_users ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add project_access to company_hr_assignments table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_hr_assignments' AND column_name='project_access') THEN
        ALTER TABLE company_hr_assignments ADD COLUMN project_access JSONB DEFAULT '["all"]'::jsonb;
    END IF;
END $$;

-- Add project_configs to company_question_configs table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_question_configs' AND column_name='project_configs') THEN
        ALTER TABLE company_question_configs ADD COLUMN project_configs JSONB;
    END IF;
END $$;

-- Add project_ids to company_resources table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_resources' AND column_name='project_ids') THEN
        ALTER TABLE company_resources ADD COLUMN project_ids JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
