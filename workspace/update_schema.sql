-- This script updates your existing database schema to match the recommended structure.
-- Run these commands against your database.

-- 1. Add 'form_type' to the master_questions table to differentiate between 'profile' and 'assessment' questions.
ALTER TABLE master_questions ADD COLUMN form_type TEXT;
COMMENT ON COLUMN master_questions.form_type IS 'The form this question belongs to (''profile'' or ''assessment'').';

-- After running this, you will need to populate this column for your existing questions.
-- For example:
-- UPDATE master_questions SET form_type = 'assessment' WHERE id IN (...list of assessment question ids...);
-- UPDATE master_questions SET form_type = 'profile' WHERE id IN (...list of profile question ids...);


-- 2. Modify 'master_question_configs' to use 'form_type' as a more descriptive primary key.
-- Add the new column first
ALTER TABLE master_question_configs ADD COLUMN form_type TEXT;

-- You will need to populate this new column based on your existing data. For example:
-- UPDATE master_question_configs SET form_type = 'profile' WHERE config_id = 'some_profile_id';
-- UPDATE master_question_configs SET form_type = 'assessment' WHERE config_id = 'some_assessment_id';

-- Now, drop the old primary key and column, and set the new primary key.
ALTER TABLE master_question_configs DROP CONSTRAINT master_question_configs_pkey;
ALTER TABLE master_question_configs DROP COLUMN config_id;
ALTER TABLE master_question_configs ADD PRIMARY KEY (form_type);
ALTER TABLE master_question_configs ALTER COLUMN form_type SET NOT NULL;


-- 3. Remove the redundant 'resources' column from 'company_question_configs'.
-- The 'company_resources' table should be used instead for better scalability.
ALTER TABLE company_question_configs DROP COLUMN IF EXISTS resources;


-- 4. Adjust column names in 'master_tasks' and 'master_tips' for consistency.
-- The SQL standard is case-insensitive, but this aligns with the naming in the application code.
ALTER TABLE master_tasks RENAME COLUMN linkedresourceid TO "linkedResourceId";
ALTER TABLE master_tasks RENAME COLUMN iscompanyspecific TO "isCompanySpecific";
ALTER TABLE master_tips RENAME COLUMN iscompanyspecific TO "isCompanySpecific";

