# ExitBetter: Data Fetching Strategy for Admin & HR Views

This document outlines the current data fetching and management strategy employed by the Admin and HR sections of the ExitBetter application. Understanding this is key to evaluating performance and planning future optimizations.

---

## 1. Core Strategy: Centralized Data Providers

The application uses a provider pattern (`AdminProvider` and `HrProvider`) to manage data for high-level user roles. The core principle is to **load all necessary data once** when the provider mounts (i.e., when an Admin or HR user first loads the application section) and then hold this data in React state.

**This means data is NOT re-fetched every time you navigate between tabs** (e.g., from "User Management" to "Form Editor"). The data is already in memory, which makes subsequent navigation very fast.

---

## 2. Initial Data Load

### For Platform Admins (`use-admin-data.tsx`)

-   **Trigger:** The `AdminProvider` component mounts.
-   **Scope:** Fetches data across **all companies** on the platform.
-   **Process:** A single `useEffect` hook fires, which executes a `Promise.all` to fetch data from numerous Supabase tables concurrently. This is the most data-intensive operation in the application.
-   **Tables Fetched:**
    -   `companies`
    -   `company_hr_assignments`
    -   `master_questions`
    -   `master_question_configs`
    -   `guidance_rules`
    -   `company_users`
    -   `company_question_configs`
    -   `master_tasks`
    -   `master_tips`
    -   `platform_users`
    -   `review_queue`
    -   `external_resources`
    -   `projects`
-   **Result:** The fetched data populates various `useState` hooks within the `AdminProvider`. All child components then read from this central state.

### For HR Managers (`use-hr-data.tsx`)

-   **Trigger:** The `HrProvider` component mounts.
-   **Scope:** Data fetching is **scoped to the companies** the logged-in HR manager is assigned to.
-   **Process:**
    1.  First, it fetches the HR manager's assignments from `company_hr_assignments` to identify which company IDs they have access to.
    2.  Then, it uses these company IDs to fetch all related data (users, configs, resources, etc.) for just those companies.
-   **Result:** Like the `AdminProvider`, this data populates `useState` hooks within the `HrProvider`, serving as the in-memory database for the HR user's session.

---

## 3. Data Modification (Write, Edit, Delete)

When a user performs an action that modifies data, the application generally uses an **optimistic update** pattern.

-   **Action:** An HR Manager adds a new user, or an Admin saves a change to a master question.
-   **Process:**
    1.  **Immediate UI Update:** The function handling the action (e.g., `addUser`, `saveMasterQuestions`) immediately updates the local React state. For example, it adds the new user object to the `users` array in the state. This makes the UI feel instantaneous.
    2.  **Asynchronous Database Call:** Simultaneously, a request is sent to Supabase to perform the actual `insert`, `update`, or `delete` operation.
    3.  **Error Handling:** If the database call fails, a toast notification informs the user of the error. The local state might remain "optimistically" updated, which is a known trade-off of this approach. A more robust implementation would revert the state on failure.
-   **Data Re-fetching:** The application **does not** perform a full re-fetch of all data after a modification. It relies on the optimistic update to keep the UI in sync. The only exception is when new data is created that requires a value from the database (like a `uuid`), in which case the created record is returned and added to the state.

---

## 4. Evaluation

### Pros:

-   **Fast Navigation:** Once the initial load is complete, navigating between different admin/HR pages is extremely fast as there are no network requests.
-   **Simpler State Management:** All data is held in a single, high-level context, avoiding the need to pass props down through many layers.

### Cons:

-   **Large Initial Load:** The initial data fetch, especially for Admins, can be large and slow depending on the amount of data in the database.
-   **Potentially Stale Data:** If two HR managers or Admins are working simultaneously, one user will not see the other's changes until they perform a full page reload.
-   **Memory Usage:** Holding all data in memory on the client can increase browser memory usage, though this is generally manageable for typical data sizes.

This documentation should provide a clear picture of the current system, paving the way for targeted performance improvements, such as implementing real-time subscriptions with Supabase or refactoring to a more granular data-fetching model if needed.