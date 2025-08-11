
-- Enable Row Level Security
alter table projects enable row level security;
-- Add policies
create policy "Projects are viewable by assigned HR managers" on projects for select using (auth.uid() IN ( SELECT profiles.id FROM profiles JOIN company_hr_assignments ON profiles.email = company_hr_assignments.hr_email WHERE company_hr_assignments.company_id = projects.company_id));
create policy "Projects can be inserted by assigned HR managers" on projects for insert with check (auth.uid() IN ( SELECT profiles.id FROM profiles JOIN company_hr_assignments ON profiles.email = company_hr_assignments.hr_email WHERE company_hr_assignments.company_id = projects.company_id));
create policy "Projects can be updated by assigned HR managers" on projects for update using (auth.uid() IN ( SELECT profiles.id FROM profiles JOIN company_hr_assignments ON profiles.email = company_hr_assignments.hr_email WHERE company_hr_assignments.company_id = projects.company_id));
create policy "Projects can be deleted by assigned HR managers" on projects for delete using (auth.uid() IN ( SELECT profiles.id FROM profiles JOIN company_hr_assignments ON profiles.email = company_hr_assignments.hr_email WHERE company_hr_assignments.company_id = projects.company_id));

-- Add project_id to company_users
alter table company_users add column if not exists project_id uuid references projects(id) on delete set null;

-- Enable RLS for company_users if not already enabled
alter table company_users enable row level security;

-- Drop existing policies on company_users to recreate them with project access logic
drop policy if exists "Company users are viewable by assigned HR managers" on company_users;
drop policy if exists "Company users can be inserted by assigned HR managers" on company_users;
drop policy if exists "Company users can be updated by assigned HR managers" on company_users;
drop policy if exists "Company users can be deleted by assigned HR managers" on company_users;

-- Create new policies with project scoping for HR managers
create policy "Company users are viewable by assigned HR managers"
on company_users for select using (
  (get_hr_project_access(auth.uid(), company_id) ->> 0) = 'all' 
  OR project_id IS NULL 
  OR project_id::text IN (select jsonb_array_elements_text(get_hr_project_access(auth.uid(), company_id)))
);

create policy "Company users can be inserted by assigned HR managers"
on company_users for insert with check (
  (get_hr_project_access(auth.uid(), company_id) ->> 0) = 'all' 
  OR project_id IS NULL 
  OR project_id::text IN (select jsonb_array_elements_text(get_hr_project_access(auth.uid(), company_id)))
);

create policy "Company users can be updated by assigned HR managers"
on company_users for update using (
  (get_hr_project_access(auth.uid(), company_id) ->> 0) = 'all' 
  OR project_id IS NULL 
  OR project_id::text IN (select jsonb_array_elements_text(get_hr_project_access(auth.uid(), company_id)))
) with check (
  (get_hr_project_access(auth.uid(), company_id) ->> 0) = 'all' 
  OR project_id IS NULL 
  OR project_id::text IN (select jsonb_array_elements_text(get_hr_project_access(auth.uid(), company_id)))
);

create policy "Company users can be deleted by assigned HR managers"
on company_users for delete using (
  (get_hr_project_access(auth.uid(), company_id) ->> 0) = 'all' 
  OR project_id IS NULL 
  OR project_id::text IN (select jsonb_array_elements_text(get_hr_project_access(auth.uid(), company_id)))
);

-- Add project_ids to company_resources
alter table company_resources add column if not exists project_ids jsonb;

-- Drop existing policies on company_resources
drop policy if exists "Resources are viewable by assigned HR managers" on company_resources;
drop policy if exists "Resources can be managed by assigned HR managers" on company_resources;

-- Recreate policies for company_resources with project scoping
create policy "Resources are viewable by assigned HR managers" on company_resources for select using (
  auth.uid() IN ( SELECT profiles.id FROM profiles JOIN company_hr_assignments ON profiles.email = company_hr_assignments.hr_email WHERE company_hr_assignments.company_id = company_resources.company_id)
);

create policy "Resources can be managed by assigned HR managers" on company_resources for all using (
  (get_hr_permission(auth.uid(), company_id, 'resources') = '"write"')
);

-- Add project_ids to custom questions, tasks, and tips inside the company_question_configs JSONB
-- This is handled in application logic, no schema change needed, but RLS needs to be aware.

-- Update RLS for company_question_configs to allow access for HR managers.
drop policy if exists "Company configs are viewable by assigned HR managers" on company_question_configs;
drop policy if exists "Company configs can be updated by assigned HR managers" on company_question_configs;

create policy "Company configs are viewable by assigned HR managers" on company_question_configs for select using (
  auth.uid() IN ( SELECT profiles.id FROM profiles JOIN company_hr_assignments ON profiles.email = company_hr_assignments.hr_email WHERE company_hr_assignments.company_id = company_question_configs.company_id)
);

create policy "Company configs can be updated by assigned HR managers" on company_question_configs for update using (
  (get_hr_permission(auth.uid(), company_id, 'formEditor') = '"write"')
) with check (
  (get_hr_permission(auth.uid(), company_id, 'formEditor') = '"write"')
);
