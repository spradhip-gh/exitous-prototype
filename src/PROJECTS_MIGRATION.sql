
-- Enable Row Level Security
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_hr_assignments ENABLE ROW LEVEL SECURITY;
-- Add more tables as needed that contain sensitive company or user data.

-- Create the function to update `updated_at` columns
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Projects Table
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Add updated_at trigger for projects
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE PROCEDURE moddatetime();

-- Add project_id to company_users
ALTER TABLE company_users
ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add project_access to company_hr_assignments
ALTER TABLE company_hr_assignments
ADD COLUMN project_access JSONB DEFAULT '["all"]'::jsonb;

-- Add project management permission to company_hr_assignments
-- Note: This requires a manual update of existing rows if you want to grant this permission.
-- For new assignments, the application logic should handle adding this permission.

-- Add project_ids to company_resources
ALTER TABLE company_resources
ADD COLUMN project_ids JSONB DEFAULT '[]'::jsonb;

-- Add project_configs to company_question_configs
ALTER TABLE company_question_configs
ADD COLUMN project_configs JSONB;

-- Add trigger for company_hr_assignments
DROP TRIGGER IF EXISTS handle_updated_at ON company_hr_assignments;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON company_hr_assignments
  FOR EACH ROW EXECUTE PROCEDURE moddatetime();
  
-- Add trigger for company_resources
DROP TRIGGER IF EXISTS handle_updated_at ON company_resources;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON company_resources
  FOR EACH ROW EXECUTE PROCEDURE moddatetime();

-- Add trigger for company_question_configs
DROP TRIGGER IF EXISTS handle_updated_at ON company_question_configs;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON company_question_configs
  FOR EACH ROW EXECUTE PROCEDURE moddatetime();
  
-- Add trigger for guidance_rules
DROP TRIGGER IF EXISTS handle_updated_at ON guidance_rules;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON guidance_rules
  FOR EACH ROW EXECUTE PROCEDURE moddatetime();
  
-- Add trigger for external_resources
DROP TRIGGER IF EXISTS handle_updated_at ON external_resources;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON external_resources
  FOR EACH ROW EXECUTE PROCEDURE moddatetime();

    