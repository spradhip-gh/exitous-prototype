--
-- PROJECTS_MIGRATION.sql
--
-- This script migrates an existing ExitBetter database schema to support the new Projects/Divisions feature.
-- WARNING: Always back up your database before running a migration script.
--

-- 1. Create the moddatetime function to automatically update 'updated_at' columns.
-- This function is called by triggers on various tables.
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 2. Create the new 'projects' table
-- This table will store information about projects or divisions within a company.
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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

-- Add a trigger to automatically update the 'updated_at' timestamp on the 'projects' table.
DROP TRIGGER IF EXISTS handle_updated_at ON projects;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();


-- 3. Alter the 'company_users' table
-- Add a nullable 'project_id' to associate users with a specific project.
ALTER TABLE company_users
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;


-- 4. Alter the 'company_hr_assignments' table
-- Add a 'project_access' column to control which projects an HR manager can access.
-- Also adds a 'projectManagement' permission to the 'permissions' JSONB.
ALTER TABLE company_hr_assignments
ADD COLUMN IF NOT EXISTS project_access JSONB DEFAULT '["all"]'::jsonb;

-- Note: Updating the permissions JSONB for existing rows must be done carefully.
-- This example adds 'projectManagement: "write"' if it doesn't exist.
-- You may need to adjust this logic based on your specific requirements.
UPDATE company_hr_assignments
SET permissions = permissions || '{"projectManagement": "write"}'::jsonb
WHERE permissions->>'projectManagement' IS NULL;


-- 5. Alter the 'company_question_configs' table
-- Add a 'project_configs' column to store project-specific question visibility and answer hiding.
ALTER TABLE company_question_configs
ADD COLUMN IF NOT EXISTS project_configs JSONB;


-- 6. Alter the 'company_resources' table
-- Add a 'project_ids' column to control which projects a resource is visible to.
ALTER TABLE company_resources
ADD COLUMN IF NOT EXISTS project_ids JSONB DEFAULT '[]'::jsonb;

-- This command sets existing resources to be visible to all projects by default.
UPDATE company_resources SET project_ids = '[]'::jsonb WHERE project_ids IS NULL;


-- 7. Add 'updated_at' triggers to existing tables if they don't have them.
-- This ensures consistency across the schema.

-- companies
DROP TRIGGER IF EXISTS handle_updated_at ON companies;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

-- platform_users
DROP TRIGGER IF EXISTS handle_updated_at ON platform_users;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON platform_users
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

-- company_hr_assignments
DROP TRIGGER IF EXISTS handle_updated_at ON company_hr_assignments;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON company_hr_assignments
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

-- company_users
DROP TRIGGER IF EXISTS handle_updated_at ON company_users;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON company_users
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

-- user_profiles
DROP TRIGGER IF EXISTS handle_updated_at ON user_profiles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

-- user_assessments
DROP TRIGGER IF EXISTS handle_updated_at ON user_assessments;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON user_assessments
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

-- master_questions
DROP TRIGGER IF EXISTS handle_updated_at ON master_questions;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON master_questions
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

-- master_question_configs
DROP TRIGGER IF EXISTS handle_updated_at ON master_question_configs;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON master_question_configs
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

-- company_question_configs
DROP TRIGGER IF EXISTS handle_updated_at ON company_question_configs;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON company_question_configs
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

-- master_tasks
DROP TRIGGER IF EXISTS handle_updated_at ON master_tasks;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON master_tasks
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

-- master_tips
DROP TRIGGER IF EXISTS handle_updated_at ON master_tips;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON master_tips
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

-- company_resources
DROP TRIGGER IF EXISTS handle_updated_at ON company_resources;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON company_resources
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

-- external_resources
DROP TRIGGER IF EXISTS handle_updated_at ON external_resources;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON external_resources
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

-- guidance_rules
DROP TRIGGER IF EXISTS handle_updated_at ON guidance_rules;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON guidance_rules
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

-- review_queue
DROP TRIGGER IF EXISTS handle_updated_at ON review_queue;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON review_queue
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime();

---
--- End of Migration
---
