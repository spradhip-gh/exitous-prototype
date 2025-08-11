-- Migration script to add Projects/Divisions functionality to the ExitBetter database.

-- 1. Create the new 'projects' table
-- This table will store the individual projects or divisions associated with a company.
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_archived BOOLEAN DEFAULT false,
    severance_deadline_time TIME,
    severance_deadline_timezone TEXT,
    pre_end_date_contact_alias TEXT,
    post_end_date_contact_alias TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name)
);

COMMENT ON TABLE projects IS 'Stores projects or divisions within a company, allowing for separate configurations.';
COMMENT ON COLUMN projects.is_archived IS 'True if the project is archived and hidden.';


-- 2. Add 'project_id' to the 'company_users' table
-- This creates the link between an end-user and a specific project.
-- It is nullable, so existing users are not affected and can remain at the company level.
ALTER TABLE company_users
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

COMMENT ON COLUMN company_users.project_id IS 'Foreign Key to projects.id. If null, user is company-level.';


-- 3. Add 'project_access' to the 'company_hr_assignments' table
-- This JSONB column will control which projects an HR manager has permissions for.
ALTER TABLE company_hr_assignments
ADD COLUMN IF NOT EXISTS project_access JSONB DEFAULT '["all"]'::jsonb;

COMMENT ON COLUMN company_hr_assignments.project_access IS 'An array of project UUIDs this manager can access, or ["all"] for full access.';


-- 4. Add 'project_configs' to the 'company_question_configs' table
-- This JSONB column will store project-specific form customizations.
ALTER TABLE company_question_configs
ADD COLUMN IF NOT EXISTS project_configs JSONB;

COMMENT ON COLUMN company_question_configs.project_configs IS 'Project-specific overrides, e.g., {"projectId": {"hiddenQuestions": ["qId"], "hiddenAnswers": {"qId": ["ans"]}}}.';


-- 5. Add 'project_ids' to the 'company_resources' table
-- This JSONB column will control which projects a specific resource is visible to.
ALTER TABLE company_resources
ADD COLUMN IF NOT EXISTS project_ids JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN company_resources.project_ids IS 'An array of project UUIDs this resource is visible to. Empty array means visible to all.';


-- Optional: Add a trigger to update 'updated_at' on projects table changes
CREATE OR REPLACE TRIGGER on_project_update
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updated_at);

-- End of migration script
