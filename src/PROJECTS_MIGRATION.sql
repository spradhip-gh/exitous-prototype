-- Create the moddatetime function to automatically update updated_at timestamps
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

-- Add the project_id column to company_users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='company_users' AND column_name='project_id'
    ) THEN
        ALTER TABLE company_users ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add the project_access column to company_hr_assignments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='company_hr_assignments' AND column_name='project_access'
    ) THEN
        ALTER TABLE company_hr_assignments ADD COLUMN project_access JSONB DEFAULT '["all"]'::jsonb;
    END IF;
END $$;

-- Add projectIds to various tables if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='master_tasks' AND column_name='project_ids') THEN
        ALTER TABLE master_tasks ADD COLUMN project_ids JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='master_tips' AND column_name='project_ids') THEN
        ALTER TABLE master_tips ADD COLUMN project_ids JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_resources' AND column_name='project_ids') THEN
        ALTER TABLE company_resources ADD COLUMN project_ids JSONB;
    END IF;
END $$;


-- Drop the old, incorrect triggers if they exist
DROP TRIGGER IF EXISTS handle_updated_at ON company_users;
DROP TRIGGER IF EXISTS handle_updated_at ON company_hr_assignments;

-- Create triggers only on tables that have the updated_at column
DROP TRIGGER IF EXISTS handle_updated_at ON projects;
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION moddatetime();

DROP TRIGGER IF EXISTS handle_updated_at ON companies;
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION moddatetime();

-- Grant usage on the public schema and select on tables
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- Allow updates on company_users for specific columns
DROP POLICY IF EXISTS company_users_update_policy ON company_users;
CREATE POLICY company_users_update_policy ON company_users FOR UPDATE USING (true) WITH CHECK (
    (get_user_role(auth.uid()) = 'admin') OR
    (
        (get_user_role(auth.uid()) = 'hr') AND
        (company_id IN (SELECT get_user_companies())) AND
        (
            (SELECT jsonb_array_length(project_access) FROM company_hr_assignments WHERE hr_email = auth.email() AND company_id = company_users.company_id) > 0 AND
            (
                ((SELECT project_access FROM company_hr_assignments WHERE hr_email = auth.email() AND company_id = company_users.company_id) ->> 0) = '"all"' OR
                (project_id::text IN (SELECT jsonb_array_elements_text(project_access) FROM company_hr_assignments WHERE hr_email = auth.email() AND company_id = company_users.company_id))
            )
        )
    )
);

ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
GRANT UPDATE (is_invited, personal_email, phone, notification_date, project_id) ON company_users TO authenticated;
