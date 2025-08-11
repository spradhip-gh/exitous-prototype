
# ExitBetter - Supabase Integration Guide

This guide provides a series of prompts and instructions for developers to integrate the ExitBetter application with a Supabase backend, moving from an in-memory demo database to a persistent, production-ready one.

---

### Prompt 1: Initial Supabase Setup & Environment

**Your Prompt:**
"Let's integrate Supabase into the project.

1.  **Install Dependencies**: Update `package.json` to add the `@supabase/supabase-js` package.
2.  **Environment Variables**: Add a `.env` file to the project root with placeholders for the Supabase URL and anon key: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3.  **Supabase Client**: Create a new file at `src/lib/supabase-client.ts` to initialize and export a Supabase client instance for use throughout the application. It should read the variables from `process.env`.
4.  **Type Generation**: As a best practice, use the Supabase CLI to generate TypeScript types from your database schema to ensure type safety across the application. Run the command `npx supabase gen types typescript --project-id <your-project-id> --schema public > src/types/supabase.ts`."

---

### Prompt 2: Database Schema - Tables

**Your Prompt:**
"Now, create the SQL schema for our Supabase database. Use the Supabase UI or create a new migration file (e.g., `supabase/migrations/0001_initial_schema.sql`).

Define all tables as specified in `src/DATABASE_SCHEMA.md`. This includes tables for: `companies`, `platform_users`, `company_hr_assignments`, `company_users`, `user_profiles`, `user_assessments`, `master_questions`, `master_question_configs`, `company_question_configs`, `master_tasks`, `master_tips`, `guidance_rules`, `external_resources`, and `review_queue`.

Ensure all primary keys, foreign keys, and constraints are correctly defined as per the schema document."

---

### Prompt 3: Update Data Hooks - Reading Data

**Your Prompt:**
"Let's refactor the `useUserData` hook in `src/hooks/use-user-data.tsx` to read data from Supabase instead of any in-memory stores.

1.  **Import Supabase Client**: Update the file to import the new Supabase client.
2.  **Fetch All Data**: In the main `useEffect` block, perform a `Promise.all` to fetch data from all necessary Supabase tables concurrently. This includes `companies`, `company_hr_assignments`, `platform_users`, `master_questions`, etc.
3.  **Populate State**: Once all data is fetched, populate the various React state variables (`companyAssignments`, `masterQuestions`, `companyConfigs`, etc.) with the data retrieved from Supabase. Handle potential errors during the fetch.
4.  **User-Specific Data**: If an `end-user` is authenticated, fetch their specific `user_profiles` and `user_assessments` data from the respective tables using the authenticated user's ID.
5.  **Remove Demo Data**: Remove any remaining imports or logic related to in-memory demo data."

---

### Prompt 4: Update Data Hooks - Writing Data

**Your Prompt:**
"With data reading from Supabase, let's update all functions that write data. Modify `src/hooks/use-user-data.tsx` to perform C.R.U.D. operations against Supabase tables.

Update the following functions to use the Supabase client to `upsert`, `insert`, or `delete` records, and then optimistically update the local state to reflect the changes immediately for a better user experience.

*   `saveProfileData` / `saveAssessmentData`: `upsert` into `user_profiles` and `user_assessments`.
*   `addCompanyAssignment` / `updateCompanyAssignment`: Perform multiple operations: `insert` into `companies`, `upsert` or `delete` from `company_hr_assignments`.
*   `saveMasterQuestions` / `saveCompanyConfig`: `upsert` into their respective tables.
*   `saveMasterTasks` / `saveMasterTips`: `upsert` into their respective tables.
*   `saveGuidanceRules`: `upsert` rules and `delete` any that were removed.
*   `addPlatformUser` / `deletePlatformUser`: `insert` or `delete` from `platform_users`.
*   `processReviewQueueItem`: `update` the status of an item in the `review_queue` table.

This change will make all administrative and user actions persistent."

---

### Prompt 5: Finalizing the Integration

**Your Prompt:**
"Now that the application is fully integrated with Supabase:

1.  **Review Row-Level Security (RLS):** Ensure that RLS policies are enabled on all tables containing sensitive data. Create policies that restrict access based on user roles and company assignments. For example, an HR Manager should only be able to see users belonging to their assigned company. The `admin/debug` page can be used to test connectivity and RLS policies.
2.  **Clean Up**: Remove any old data-fetching logic or mock data files that are no longer in use."

