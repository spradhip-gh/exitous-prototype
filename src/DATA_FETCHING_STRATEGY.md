# ExitBetter: Data Fetching Strategy for Admin & HR Views

This document outlines the current data fetching and management strategy employed by the Admin and HR sections of the ExitBetter application. Understanding this is key to evaluating performance and planning future optimizations.

---

## 1. Core Strategy: Centralized Data Providers with Local Caching

The application uses a provider pattern (`AdminProvider` and `HrProvider`) to manage data for high-level user roles. The core principle is to **load all necessary data once** when the provider mounts and then hold this data in React state.

To improve performance on subsequent visits, this data is also **cached in the browser's local storage for 5 minutes**.

**This means:**
-   The very first time an Admin or HR user loads the application during a session, a full data fetch occurs.
-   If the user reloads the page or navigates away and comes back **within 5 minutes**, the application will load instantly from the local cache, skipping the large database query.
-   Data is **NOT** re-fetched every time you navigate between tabs (e.g., from "User Management" to "Form Editor"). The data is already in memory.

---

## 2. Initial Data Load

### For Platform Admins (`use-admin-data.tsx`)

-   **Trigger:** The `AdminProvider` component mounts.
-   **Process:**
    1.  The provider first checks for a `lastAdminFetch` timestamp in local storage.
    2.  If the timestamp is less than 5 minutes old, it loads all data directly from the cache.
    3.  If the cache is stale or non-existent, it executes a `Promise.all` to fetch data from numerous Supabase tables concurrently. This is the most data-intensive operation in the application.
    4.  After a successful fetch, the data is saved to local storage with a new timestamp.
-   **Scope:** Fetches data across **all companies** on the platform.
-   **Tables Fetched:**
    -   `companies`, `company_hr_assignments`, `master_questions`, `master_question_configs`, `guidance_rules`, `company_users`, `company_question_configs`, `master_tasks`, `master_tips`, `platform_users`, `review_queue`, `external_resources`, `projects`
-   **Result:** The fetched data populates various `useState` hooks within the `AdminProvider`. All child components then read from this central state.

### For HR Managers (`use-hr-data.tsx`)

-   **Trigger:** The `HrProvider` component mounts.
-   **Process:**
    1.  The provider first checks for a `lastHrFetch` timestamp in local storage.
    2.  If the cache is fresh, it loads all data from local storage.
    3.  If not, it first fetches the HR manager's assignments from `company_hr_assignments` to identify which company IDs they have access to.
    4.  Then, it uses these company IDs to fetch all related data (users, configs, resources, etc.) for just those companies.
    5.  After a successful fetch, the data is saved to local storage with a new timestamp.
-   **Scope:** Data fetching is **scoped to the companies** the logged-in HR manager is assigned to.
-   **Result:** Like the `AdminProvider`, this data populates `useState` hooks within the `HrProvider`, serving as the in-memory database for the HR user's session.

---

## 3. Data Modification (Write, Edit, Delete)

When a user performs an action that modifies data, the application generally uses an **optimistic update** pattern.

-   **Action:** An HR Manager adds a new user, or an Admin saves a change to a master question.
-   **Process:**
    1.  **Immediate UI Update:** The function handling the action (e.g., `addUser`, `saveMasterQuestions`) immediately updates the local React state. For example, it adds the new user object to the `users` array in the state. This makes the UI feel instantaneous.
    2.  **Local Cache Invalidation:** The action **clears the local storage cache** to ensure fresh data is fetched on the next full page load.
    3.  **Asynchronous Database Call:** Simultaneously, a request is sent to Supabase to perform the actual `insert`, `update`, or `delete` operation.
    4.  **Error Handling:** If the database call fails, a toast notification informs the user of the error. The local state might remain "optimistically" updated, which is a known trade-off of this approach. A more robust implementation would revert the state on failure.
-   **Data Re-fetching:** The application **does not** perform a full re-fetch of all data after a modification. It relies on the optimistic update to keep the UI in sync.

---

## 4. Evaluation & Future Optimizations

### Pros:

-   **Extremely Fast Navigation:** Once the initial load is complete, navigating between different admin/HR pages is instantaneous as there are no network requests.
-   **Fast Reloads:** The local storage cache makes reloading the application or returning to it within a short timeframe much faster.
-   **Simpler State Management:** All data is held in a single, high-level context, avoiding the need to pass props down through many layers.

### Cons:

-   **Large Initial Load:** The first data fetch, especially for Admins, can be large and slow depending on the amount of data in the database.
-   **Potentially Stale Data:** If two HR managers or Admins are working simultaneously, one user will not see the other's changes until the 5-minute cache expires and they perform a full page reload.

### Future Optimizations

The current strategy is a balance between performance and implementation complexity. A more advanced, scalable long-term solution would be to refactor the data fetching to be **on-demand**.

-   **Page-Specific Fetching:** Instead of one large initial fetch, each admin/HR page (e.g., "User Management", "Form Editor") would be responsible for fetching only the data it needs to display.
-   **State Management Libraries:** This would likely involve a more sophisticated state management library (like React Query or SWR) to handle caching, background re-fetching, and sharing data between components more granularly.
-   **Real-time Subscriptions:** For highly collaborative pages, Supabase's real-time subscriptions could be implemented to push live updates to all connected clients, eliminating stale data entirely.

This approach was deemed too complex for the current phase but represents the next logical step in the platform's evolution.
