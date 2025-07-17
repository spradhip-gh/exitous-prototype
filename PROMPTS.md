# Layoff Compass - AI Build Prompts

This file contains a series of prompts designed to guide an AI coding assistant to build the Layoff Compass application from scratch.

---

### Prompt 1: Initial Project Setup and Theming

**Your Prompt:**
"Let's start building the 'Layoff Compass' app. First, set up the foundational pieces.

1.  **Dependencies**: Add the necessary dependencies to `package.json` for UI (ShadCN, lucide-react), forms (react-hook-form, zod), AI (Genkit), and utilities (date-fns, clsx, etc.).
2.  **Styling**:
    *   Configure `tailwind.config.ts` to use custom font families: 'Inter' for body and 'Space Grotesk' for headlines.
    *   Update `src/app/globals.css` with the required theme colors using HSL variables. The primary color should be `#ff9e18`, background `#F5F5F5` (or a close HSL equivalent), and accent `#82E0AA`.
3.  **Layout**: In `src/app/layout.tsx`, import and apply the 'Inter' and 'Space Grotesk' fonts from Google Fonts. Also, add the `Toaster` component for notifications."

---

### Prompt 2: Core Data and Authentication Hooks

**Your Prompt:**
"Now, let's create the core state management for the application.

1.  **Auth Hook (`useAuth`)**: Create a hook at `src/hooks/use-auth.tsx` to manage user authentication. It should handle different roles (`end-user`, `hr`, `admin`, `consultant`), persist the auth state to `localStorage`, and include logic for logging in, logging out, and a special 'User Preview' mode for HR managers.
2.  **Data Hook (`useUserData`)**: Create the main data management hook at `src/hooks/use-user-data.tsx`. This hook should be the single source of truth for all application data, abstracting away the underlying storage. For now, it will use an in-memory 'database'.
3.  **In-Memory Database (`demo-data.ts`)**: Create a file at `src/lib/demo-data.ts` to simulate a database. It should hold initial data for `platformUsers`, `companyAssignments`, `companyConfigs`, and `masterQuestions`. To simulate persistence across reloads in development, attach this data store to the `globalThis` object."

---

### Prompt 2.5: Define Master Questions

**Your Prompt:**
"Let's define the master list of default questions for the assessment. Create the file `src/lib/questions.ts`. It should export a function `getDefaultQuestions` that returns an array of `Question` objects.

This function will be the single source of truth for the default assessment structure. Organize the questions into the following sections: 'Work & Employment Details', 'Work Circumstances', 'Legal & Agreements', and 'Systems & Benefits Access'.

Ensure you include all sub-questions and their trigger logic. For example, the 'Relocation Date' question should only appear when the user answers 'Yes' to the relocation question. Similarly, insurance coverage questions should only appear if the user had that type of insurance."

---

### Prompt 3: Login and Basic Page Routing

**Your Prompt:**
"With the data hooks in place, let's build the entry point of the app.

1.  **Login Component**: Create a `Login` component at `src/components/auth/Login.tsx`. It should be a tabbed interface allowing users to select their role (End-User, HR, Consultant, Admin) and enter their credentials. Use the `useAuth` hook to handle the login logic.
2.  **Home Page**: Update `src/app/page.tsx` to be the main landing page. It should display the `Login` component. Add logic to this page that automatically redirects users to their respective dashboards if they are already authenticated.
3.  **Header Component**: Create a `Header` component at `src/components/common/Header.tsx`. It should display the app logo. When a user is logged in, it should show a dropdown menu with the user's email, role, and options to 'Logout' or switch between HR and User Preview modes."

---

### Prompt 4: End-User Flow: Profile & Assessment Forms

**Your Prompt:**
"Let's build the core data entry forms for the end-user.

1.  **Schemas**: Create `src/lib/schemas.ts` to define the Zod validation schemas for the Profile and Assessment forms. The assessment schema builder should be dynamic, generating rules based on the active questions from `useUserData`.
2.  **Profile Form**: Create the `ProfileForm` component at `src/components/profile/ProfileForm.tsx`. Use `react-hook-form` and the Zod schema for validation. Group questions into logical `Card` components and handle conditional fields (like self-describing gender). Create the corresponding page at `src/app/dashboard/profile/page.tsx`.
3.  **Assessment Form**: Create the `AssessmentForm` component at `src/components/assessment/AssessmentForm.tsx`. This form should be dynamically generated based on the questions provided by the `useUserData` hook, ensuring it reflects company-specific customizations. It should also pre-fill data provided by HR managers. Create the page at `src/app/dashboard/assessment/page.tsx`."

---

### Prompt 5: End-User Dashboard & AI Recommendations

**Your Prompt:**
"Now, let's build the main user dashboard where they see their progress and recommendations.

1.  **AI Flow**: Create the Genkit flow at `src/ai/flows/personalized-recommendations.ts`. It should take user profile and assessment data as input and generate a structured list of personalized action items as output, sorted by urgency. The prompt should instruct the AI to act as an expert career counselor. Include a retry mechanism to handle temporary API errors.
2.  **Progress Tracker**: Create a `ProgressTracker` component at `src/components/dashboard/ProgressTracker.tsx`. This should be shown before both the profile and assessment are complete, displaying progress bars and linking to the forms.
3.  **Timeline Dashboard**: Create the `TimelineDashboard` component at `src/components/dashboard/TimelineDashboard.tsx`. This is the main view after the forms are complete. It should fetch data from the Genkit flow and display the recommendations in a visually appealing timeline format. It should also have a `DailyBanner` with inspirational quotes.
4.  **Dashboard Page**: Update `src/app/dashboard/page.tsx` to conditionally render either the `ProgressTracker` or the `TimelineDashboard` based on the user's completion status."

---

### Prompt 6: Admin/HR Form Editor

**Your Prompt:**
"Let's build the form editor for both Admins and HR Managers.

1.  **Admin Form Editor**: Create an `AdminFormEditor` component at `src/components/admin/forms/AdminFormEditor.tsx`. It should allow Admins to add, edit, delete, and reorder questions in the master list. Use `@dnd-kit/core` for drag-and-drop reordering.
2.  **HR Form Editor**: Create an `HrFormEditor` component at `src/components/admin/forms/HrFormEditor.tsx`. It should allow HR Managers to enable/disable master questions, edit their text/options (creating overrides), and add new company-specific custom questions. It must also show a visual indicator next to any question that has been updated by an Admin.
3.  **Editor Page**: Create the page at `src/app/admin/forms/page.tsx` that acts as a switch, rendering either the `AdminFormEditor` or `HrFormEditor` based on the logged-in user's role."

---

### Prompt 7: Admin/HR User and Company Management

**Your Prompt:**
"Now, let's create the pages for managing companies and users.

1.  **Company Management (Admin)**: Create the page at `src/app/admin/companies/page.tsx`. It should have a `Table` listing all companies, their stats (user count, assessments completed), and a form to add new companies and assign HR managers.
2.  **User Management (HR)**: Create an `HrUserManagement` component at `src/components/admin/users/HrUserManagement.tsx`. This page should allow HR managers to add/remove users for their company, either individually or via a CSV bulk upload. The CSV upload should support pre-filling assessment data and updating existing, non-invited users.
3.  **User Management (Admin)**: Create an `AdminUserManagement` component at `src/components/admin/users/AdminUserManagement.tsx`. This should be a simpler view for admins to add/remove users for any company.
4.  **Users Page**: Create the page at `src/app/admin/users/page.tsx` to switch between the HR and Admin user management views."

---

### Prompt 8: Final Admin/Consultant Features and Layouts

**Your Prompt:**
"Finally, let's add the remaining administrative features and create the layouts for all user roles.

1.  **Data Export Page**: Create the page at `src/app/admin/export/page.tsx`. It should compile a list of all users and their completion statuses. For the Admin view, it should show a simplified 'Past' or 'Future' indicator for notification dates. Include an 'Export to CSV' function.
2.  **Consultant Review Dashboard**: Create a `ReviewDashboard` component at `src/components/admin/ReviewDashboard.tsx`. This page will fetch a sample set of AI recommendations and allow a consultant to approve, reject, or suggest edits.
3.  **Dashboard Layout**: Create `src/app/dashboard/layout.tsx` to provide the main sidebar navigation for the end-user flow.
4.  **Admin Layout**: Create `src/app/admin/layout.tsx` to provide a collapsible sidebar with role-based navigation links for all administrative roles (Admin, HR, Consultant)."
