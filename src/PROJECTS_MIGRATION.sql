-- Enable the "moddatetime" extension to automatically update "updated_at" columns.
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the new 'projects' table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    severance_deadline_time TIME,
    severance_deadline_timezone TEXT,
    pre_end_date_contact_alias TEXT,
    post_end_date_contact_alias TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Add a unique constraint for project names within a company
ALTER TABLE projects ADD CONSTRAINT projects_company_id_name_key UNIQUE (company_id, name);
-- Add a trigger to update 'updated_at' on any change
DROP TRIGGER IF EXISTS handle_updated_at ON projects;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE PROCEDURE moddatetime();

-- Alter 'company_users' table
ALTER TABLE company_users ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
-- NOTE: No 'updated_at' trigger for company_users as it does not have the column.

-- Alter 'company_hr_assignments' table
ALTER TABLE company_hr_assignments ADD COLUMN IF NOT EXISTS project_access JSONB DEFAULT '["all"]'::jsonb;
ALTER TABLE company_hr_assignments ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;
-- NOTE: No 'updated_at' trigger for company_hr_assignments as it does not have the column.

-- Alter 'company_question_configs' table to add project-specific overrides
ALTER TABLE company_question_configs ADD COLUMN IF NOT EXISTS project_configs JSONB;
-- This table DOES have an updated_at column, so we ensure the trigger exists.
DROP TRIGGER IF EXISTS handle_updated_at ON company_question_configs;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON company_question_configs
  FOR EACH ROW EXECUTE PROCEDURE moddatetime();

-- Alter 'company_resources' table
ALTER TABLE company_resources ADD COLUMN IF NOT EXISTS project_ids JSONB;
-- This table DOES have an updated_at column, so we ensure the trigger exists.
DROP TRIGGER IF EXISTS handle_updated_at ON company_resources;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON company_resources
  FOR EACH ROW EXECUTE PROCEDURE moddatetime();
