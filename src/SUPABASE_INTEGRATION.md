# Layoff Compass - Supabase Integration Prompts

This guide provides a series of prompts to migrate the Layoff Compass application from its in-memory demo database to a persistent Supabase backend.

---

### Prompt 1: Initial Supabase Setup & Environment

**Your Prompt:**
"Let's integrate Supabase into the project.

1.  **Install Dependencies**: Update `package.json` to add the `@supabase/supabase-js` and `@supabase/auth-helpers-nextjs` packages.
2.  **Environment Variables**: Add a `.env.local` file to the project root with placeholders for the Supabase URL and anon key. Also, update the `.gitignore` file to ignore `.env.local`.
3.  **Supabase Client**: Create a new file at `src/lib/supabase-client.ts` to initialize and export a Supabase client instance for use throughout the application."

---

### Prompt 2: Database Schema - Tables

**Your Prompt:**
"Now, create the SQL schema for our Supabase database. Add a new file `supabase/migrations/0001_initial_schema.sql` that defines the necessary tables.

The schema should include tables for:
*   `companies`: To store company details like name, version, and user limits.
*   `platform_users`: For admin and consultant roles.
*   `company_hr_assignments`: To link HR managers to companies.
*   `company_users`: For end-users associated with each company, including their notification status and any pre-filled assessment data.
*   `user_profiles`: To store the JSON profile data for each end-user.
*   `user_assessments`: To store the JSON assessment data for each end-user.
*   `master_questions`: The master list of all assessment questions.
*   `company_question_configs`: To store company-specific question overrides, custom questions, and display order as JSONB."

---

### Prompt 3: Update Data Hooks - Reading Data

**Your Prompt:**
"Let's refactor the `useUserData` hook to read data from Supabase instead of the in-memory `demo-data.ts`.

1.  **Import Supabase Client**: Update `src/hooks/use-user-data.tsx` to import the new Supabase client.
2.  **Fetch Data**: Modify the main `useEffect` in the hook to fetch data from the Supabase tables (`companies`, `platform_users`, etc.) instead of `get...FromDb()` functions. Ensure all fetched data is loaded into the React state.
3.  **Update Getter Functions**: Refactor the helper functions like `getCompanyForHr` and `getCompanyUser` to work with the data now stored in the component's state, which is populated from Supabase.
4.  **Remove Demo Data Import**: Remove all imports from `src/lib/demo-data.ts` in the `useUserData` hook, as it will no longer be the source of truth."

---

### Prompt 4: Update Data Hooks - Writing Data

**Your Prompt:**
"With data reading from Supabase, let's update the functions that write data. Modify `src/hooks/use-user-data.tsx` to perform C.R.U.D. operations against Supabase.

Update the following functions to use the Supabase client to `upsert`, `insert`, or `delete` records, and then refresh the local state:
*   `saveMasterQuestions`
*   `saveCompanyConfig`
*   `saveCompanyUsers`
*   `addCompanyAssignment`
*   `updateCompanyAssignment`
*   `deleteCompanyAssignment`
*   `addPlatformUser`
*   `deletePlatformUser`

This change will make all administrative actions persistent."

---

### Prompt 5: Remove Demo Data File

**Your Prompt:**
"Now that the application is fully integrated with Supabase and no longer relies on the in-memory database, please delete the `src/lib/demo-data.ts` file to finalize the migration."
