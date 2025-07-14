# Building Layoff Compass: A Step-by-Step Guide

This document provides a high-level overview of the steps involved in building the Layoff Compass application from scratch. It assumes a working knowledge of Next.js, React, TypeScript, and Tailwind CSS.

## 1. Initial Project Setup

The foundation of the application is a standard Next.js project.

### 1.1. Initialize Next.js App

Start by creating a new Next.js project with TypeScript and Tailwind CSS.

```bash
npx create-next-app@latest layoff-compass --typescript --tailwind --eslint
```

### 1.2. Install Core Dependencies

Navigate into your project directory and install the necessary packages for UI components, state management, forms, and AI.

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
  @dnd-kit/core @dnd-kit/sortable recharts embla-carousel-react
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

Update `src/app/layout.tsx` to import and use the 'Inter' and 'Space Grotesk' fonts from Google Fonts. Update `src/app/globals.css` and `tailwind.config.ts` to reflect the application's color palette (primary, accent, background) using HSL CSS variables as defined in the project files.

## 3. Core Application Logic

### 3.1. Authentication (`useAuth`)

Create a custom React hook `src/hooks/use-auth.tsx` to manage the user's authentication state.
- Use `React.Context` to provide auth state globally.
- Store auth data (role, email, etc.) in `localStorage` to persist login sessions.
- Implement functions for `login`, `logout`, and role-switching for demos (e.g., "View as User").

### 3.2. Data Management (`useUserData`)

Create a central data management hook `src/hooks/use-user-data.tsx`.
- **User Data:** Manage user-specific data (`profile`, `assessment`) using `localStorage`.
- **Shared Data:** Create an in-memory "database" in `src/lib/demo-data.ts` to hold shared information like company assignments, users, and questions. This data should persist across hot reloads.
- **Data Hydration:** The `useUserData` hook should read from `demo-data.ts` to populate its initial state, ensuring consistent data for all users.
- **API Functions:** Expose functions to get and save all data types (e.g., `saveProfileData`, `saveCompanyConfig`, `saveMasterQuestions`).

## 4. Building Pages and Components

### 4.1. Create App Structure and Layouts

-   `src/app/layout.tsx`: Root layout with font setup and the `AuthProvider`.
-   `src/app/page.tsx`: The main landing page, which contains the multi-role login component.
-   `src/app/dashboard/layout.tsx`: Layout for the end-user dashboard, including the sidebar navigation.
-   `src/app/admin/layout.tsx`: Layout for all administrative roles, including the collapsible admin sidebar.

### 4.2. End-User Flow Pages

-   **Profile (`/dashboard/profile`):** Build the multi-step profile questionnaire using `react-hook-form` and a Zod schema for validation.
-   **Assessment (`/dashboard/assessment`):** Create the exit details form. Implement conditional logic to show/hide sub-questions based on user answers.
-   **Dashboard (`/dashboard`):**
    -   Create a `ProgressTracker` component to show before the profile/assessment is complete.
    -   Create the `TimelineDashboard` to display AI-generated recommendations after completion.

### 4.3. Admin & HR Flow Pages

-   **Form Editor (`/admin/forms`):**
    -   Build a dual-mode component for Admins and HR Managers.
    -   **Admin View:** Allow editing of the master question list. Implement drag-and-drop for reordering.
    -   **HR View:** Allow HR Managers to create company-specific overrides (enabling/disabling questions, editing text). Show alerts for questions updated by an Admin.
-   **Company Management (`/admin/companies`):** Create a table to list all companies, allowing Admins to add new ones, assign HR Managers, and view usage stats.
-   **User Management (`/admin/users`):** Build a page for Admins/HR to add or remove end-users for a specific company.
-   **Export (`/admin/export`):** Implement a page that compiles a list of all users and provides a "Export to CSV" function.

## 5. AI Integration with Genkit

### 5.1. Create Genkit Flow

In `src/ai/flows/personalized-recommendations.ts`, define a Genkit flow.
-   **Input/Output Schemas:** Use Zod to define structured inputs (profile, assessment data) and outputs (a list of `RecommendationItem`).
-   **Prompt Engineering:** Write a detailed prompt instructing the LLM to act as a career counselor and generate a personalized, actionable timeline based on the user's specific circumstances.
-   **Flow Function:** Export an async function that calls the Genkit flow, which will be used by the `TimelineDashboard` component to fetch recommendations.

This guide provides a roadmap to recreate the core functionality of the Layoff Compass application. Each step involves creating components, defining logic, and styling according to the project's design guidelines.