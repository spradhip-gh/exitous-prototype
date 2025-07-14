# Building Layoff Compass: A Step-by-Step Guide

This document provides a detailed, step-by-step guide to building the Layoff Compass application from scratch. It assumes a working knowledge of Next.js, React, TypeScript, and Tailwind CSS.

## 1. Initial Project Setup

The foundation of the application is a standard Next.js project.

### 1.1. Initialize Next.js App

Start by creating a new Next.js project with TypeScript and Tailwind CSS.

```bash
npx create-next-app@latest layoff-compass --typescript --tailwind --eslint
```

### 1.2. Install Core Dependencies

Navigate into your project directory and install the necessary packages for UI components, state management, forms, and drag-and-drop functionality.

```bash
cd layoff-compass
npm install \
  @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-avatar \
  @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-menubar \
  @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group \
  @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator \
  @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch \
  @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip \
  class-variance-authority clsx tailwind-merge tailwindcss-animate \
  lucide-react react-hook-form @hookform/resolvers zod date-fns react-day-picker \
  @dnd-kit/core @dnd-kit/sortable
```

### 1.3. Install AI Dependencies

Install Genkit for handling AI-powered features.

```bash
npm install genkit @genkit-ai/googleai @genkit-ai/next
```

## 2. UI and Styling Configuration

### 2.1. Initialize ShadCN UI

Initialize ShadCN UI to manage your component library. This will create the `components.json` file and set up necessary folders.

```bash
npx shadcn-ui@latest init
```
Follow the prompts, selecting `Default` style, `Neutral` for the base color, and confirming your paths for `globals.css` and `tailwind.config.ts`.

### 2.2. Configure Fonts and Theme

Update `src/app/layout.tsx` to import and use the 'Inter' and 'Space Grotesk' fonts from Google Fonts for body and headline text, respectively. Then, update `src/app/globals.css` and `tailwind.config.ts` to reflect the application's color palette (primary, accent, background) using HSL CSS variables as defined in the project files.

## 3. Core Application Logic

### 3.1. Authentication (`useAuth`)

Create a custom React hook `src/hooks/use-auth.tsx` to manage the user's authentication state globally.
- **Technology:** Use `React.Context` to provide auth state to the entire application. Wrap the root layout in an `AuthProvider`.
- **State:** The `auth` object should contain `role`, `email`, `companyId`, `companyName`, and an `isPreview` flag.
- **Persistence:** Store the `auth` object in `localStorage` to keep users logged in across sessions. Also store the original auth state when an HR manager enters "User Preview" mode.
- **Functions:**
  - `login(authData)`: Saves auth state to `localStorage` and React state.
  - `logout()`: Clears all auth and user data from `localStorage`.
  - `startUserView()`: For HR Managers, saves current auth state as "original" and creates a temporary "end-user" auth state for previewing the user experience.
  - `stopUserView()`: Restores the original HR Manager auth state from `localStorage`.

### 3.2. Data Management (`useUserData`)

Create a central data management hook `src/hooks/use-user-data.tsx`. This hook is the single source of truth for all application data, abstracting away the underlying storage mechanism.

- **Shared Data (In-Memory "Database"):**
  - Create a file `src/lib/demo-data.ts` to hold shared information like `companyAssignments`, `platformUsers`, and the `masterQuestions` list.
  - To simulate persistence across hot reloads in development, attach this data store to the `globalThis` object. This ensures custom questions and other changes are not lost on every file save.
- **User-Specific Data (`localStorage`):**
  - Manage user-specific data like `profileData` and `assessmentData` using React state that is hydrated from and saved to `localStorage`.
  - Handle a separate set of keys for the HR "User Preview" mode (e.g., `exitbetter-profile-hr-preview`) to keep the preview data isolated.
- **Core Functions:**
  - **Data Accessors:** Expose functions to get all data types (e.g., `getAllCompanyConfigs()`, `getMasterQuestions()`).
  - **Data Mutators:** Create functions to save changes back to the in-memory store (e.g., `saveCompanyConfig(name, config)`, `saveMasterQuestions(questions)`). This pattern makes it easy to swap the in-memory store for a real database later.
  - **Derived Data:** Implement logic like `getCompanyConfig(companyName)` which intelligently merges the `masterQuestions` with company-specific `overrides` and `customQuestions` to produce the final form for that company.

## 4. Building Pages and Components

### 4.1. Create App Structure and Layouts

-   `src/app/layout.tsx`: Root layout that includes the `AuthProvider`, `Toaster`, and global font definitions.
-   `src/app/page.tsx`: The main landing page, which contains the multi-role `Login` component. It includes logic to redirect authenticated users to their respective dashboards.
-   `src/app/dashboard/layout.tsx`: Layout for the end-user dashboard, including the `DashboardNav` sidebar.
-   `src/app/admin/layout.tsx`: Layout for all administrative roles (Admin, HR), including the collapsible admin sidebar with role-based navigation links.

### 4.2. End-User Flow Pages

-   **Profile (`/dashboard/profile`):**
    -   Create a `ProfileForm` component that uses `react-hook-form` and a `zod` schema (`src/lib/schemas.ts`) for robust validation.
    -   Group questions into logical sections using `Card` components.
    -   Implement conditional rendering for fields like "self-describe gender."
-   **Assessment (`/dashboard/assessment`):**
    -   Create an `AssessmentForm` component.
    -   Dynamically build the form and its validation schema using the questions provided by `useUserData.getCompanyConfig()`. This ensures company-specific customizations are applied.
    -   Implement conditional logic to show/hide sub-questions based on the parent question's answer (e.g., show "relocation date" only if "relocation paid" is "Yes").
-   **Dashboard (`/dashboard`):**
    -   Create a `ProgressTracker` component to show before both the profile and assessment are complete. It should disable the "Exit Details" button until the profile is done.
    -   Create the `TimelineDashboard` component to display the AI-generated recommendations after both forms are complete. This component fetches data from the Genkit flow.

### 4.3. Admin & HR Flow Pages

-   **Form Editor (`/admin/forms`):**
    -   Build a dual-mode page that renders either the `AdminFormEditor` or `HrFormEditor` based on the user's role.
    -   **Admin View:** Allow creating, editing, and deleting questions from the master list. Implement drag-and-drop reordering using `@dnd-kit`.
    -   **HR View:** Allow HR Managers to enable/disable master questions and edit their text/options (creating overrides). Allow adding new company-specific custom questions.
    -   **Update Alerts:** In the HR view, display a visual indicator (`BellDot` icon) next to any question that has been updated by an Admin since the HR manager last saved their configuration.
-   **Company Management (`/admin/companies`):**
    -   Create a page with a `Table` to list all companies from `useUserData`.
    -   Include columns for key stats: Users Added, Max Users, Assessments Completed, and Custom Questions (count of modified/new questions).
    -   Implement a form to add new companies and assign HR Managers.
-   **User Management (`/admin/users`):**
    -   Build a page for Admins/HR to add or remove end-users for a specific company. Display the user's assessment completion status.
-   **Export (`/admin/export`):**
    -   Implement a page that compiles a list of all users from all sources (`platformUsers`, `companyAssignments`, and end-users from all `companyConfigs`).
    -   Provide an "Export to CSV" function that generates and triggers a download of the user list.

## 5. AI Integration with Genkit

### 5.1. Create Genkit Flow

In `src/ai/flows/personalized-recommendations.ts`, define a Genkit flow that generates a personalized action plan for the user.
-   **Input/Output Schemas:** Use `zod` to define strongly-typed input and output schemas.
    -   `PersonalizedRecommendationsInputSchema`: Defines the expected structure of the user's `profileData` and `layoffDetails`.
    -   `PersonalizedRecommendationsOutputSchema`: Defines the desired output, which is a list of `RecommendationItem` objects. This tells the LLM to structure its response as a JSON array.
-   **Prompt Engineering:**
    -   Write a detailed system prompt instructing the LLM to act as an expert career counselor.
    -   Use Handlebars templating (`{{{...}}}`) to dynamically insert the user's data into the prompt.
    -   Explicitly ask the model to provide a unique `taskId`, `task`, `category`, `timeline`, `details`, and an optional `endDate` for each recommendation, and to sort the list by urgency.
-   **Flow Function:** Export an async wrapper function (`getPersonalizedRecommendations`) that calls the Genkit flow. This function will be used by the `TimelineDashboard` component to fetch the recommendations.

This guide provides a comprehensive roadmap to recreate the core functionality of the Layoff Compass application. Each step involves creating components, defining logic, and styling according to the project's design guidelines.