-- Function to update `updated_at` column
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add `project_id` to company_users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.columns
        WHERE  table_name = 'company_users'
        AND    column_name = 'project_id'
    ) THEN
        ALTER TABLE "company_users" ADD COLUMN "project_id" UUID;
    END IF;
END;
$$;

-- Add foreign key constraint for project_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.table_constraints
        WHERE  constraint_name = 'company_users_project_id_fkey'
        AND    table_name = 'company_users'
    ) THEN
        ALTER TABLE "company_users" ADD CONSTRAINT "company_users_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL;
    END IF;
END;
$$;

-- IMPORTANT: Drop the incorrect trigger from company_users table if it exists
DROP TRIGGER IF EXISTS handle_updated_at ON "company_users";

-- Drop the incorrect trigger from company_hr_assignments table if it exists
DROP TRIGGER IF EXISTS handle_updated_at ON "company_hr_assignments";

-- Re-apply triggers ONLY to tables that actually have an `updated_at` column.
-- Based on the schema, this includes: companies, projects, platform_users, user_profiles, user_assessments, master_questions, etc.
-- We will only re-add it to `companies` as an example of correct usage.
DROP TRIGGER IF EXISTS handle_updated_at ON "companies";
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON "companies"
FOR EACH ROW
EXECUTE PROCEDURE moddatetime();
