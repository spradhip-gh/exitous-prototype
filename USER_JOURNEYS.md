# ExitBetter Platform - Critical User Journeys (CUJs)

This document outlines the key user journeys and workflows currently supported by the ExitBetter prototype for each user role.

---

## 1. End-User Journey

The primary goal of the End-User is to receive a personalized, actionable plan to navigate their employment exit.

1.  **Login**: The user logs in using their work email and a unique Company ID provided by their HR Manager. The system validates their credentials and ensures an invitation has been sent.
2.  **Dashboard Landing**:
    *   If the user's profile and assessment are incomplete, they land on a **Progress Tracker** page.
    *   If their data has been pre-filled by HR, they are shown a **Welcome Summary** of key dates.
3.  **Profile Completion**: The user fills out a multi-section **Profile Form** with personal and demographic information. This data is crucial for tailoring the AI recommendations.
4.  **Assessment Completion**: After completing the profile, the user fills out the **Assessment Form** with specific details about their exit (e.g., key dates, insurance status). This form is dynamically generated based on company-specific configurations and pre-filled with any data provided by HR.
5.  **View Personalized Dashboard**: Once both forms are complete, the user gains access to the main **Timeline Dashboard**.
    *   **AI Recommendations**: The dashboard displays a timeline of personalized, AI-generated tasks and recommendations, sorted by urgency and categorized (e.g., Finances, Healthcare).
    *   **Task Management**: The user can check off tasks as they complete them.
    *   **Key Dates Visualizer**: An interactive timeline provides a visual overview of all critical deadlines.
6.  **Access Resources**: The user can navigate to the **Resources** page to view and download company-specific documents (e.g., benefits guides, policies) uploaded by their HR Manager.
7.  **Account Management**: The user can go to their **Account Settings** to update their email or timezone preference.
8.  **Start Over**: From the user dropdown menu, the user has the option to completely clear their profile and assessment data and start the process again.

---

## 2. HR Manager Journey

The HR Manager's goal is to manage exiting employees and customize the offboarding experience for their company.

1.  **Login**: The HR Manager logs in with their company email address.
2.  **User Management**: The HR Manager navigates to the **User Management** page to:
    *   Add new users individually via a form.
    *   Add multiple users at once via a **CSV Bulk Upload**, which supports pre-filling assessment data and updating existing (non-invited) users.
    *   Send "invitations" to users, which makes them eligible to log in (in the prototype, this is a status flag, not an actual email).
    *   Delete users.
    *   Sort the user list by various columns.
3.  **Form Customization (Pro Feature)**: The HR Manager goes to the **Form Editor** to:
    *   Enable or disable questions from the master list for their company's assessment.
    *   Edit the text and options of master questions, creating company-specific "overrides."
    *   Receive notifications when an Admin has updated a master question they have overridden.
    *   Add new, completely custom questions that are unique to their company.
4.  **Resource Management**: The HR Manager navigates to the **Resources** page to upload and manage documents (e.g., PDFs, text files) that their employees can access.
5.  **Company Settings**: The HR Manager can visit the **Company Settings** page to:
    *   View their company's current subscription plan (Basic or Pro) and user license usage.
    *   Set or update default contact aliases and severance deadline timezones for their company.
6.  **User Preview Mode**: From the header dropdown, the HR Manager can select **"View as User"** to enter a sandboxed preview of the end-user experience, allowing them to test the forms and see the dashboard as their employees would. They can easily return to their HR view.
7.  **Access Help Guide**: The HR Manager can open a comprehensive **Help & Guide** page from the sidebar to learn about all available features.

---

## 3. Platform Admin Journey

The Platform Admin's goal is to manage the entire platform, including all companies and the master configuration.

1.  **Login**: The Admin logs in with their platform-specific email.
2.  **Master Form Editing**: The Admin uses the **Master Form Editor** to:
    *   Create, edit, and delete questions from the global master list.
    *   Reorder master questions via drag-and-drop. Changes here propagate as defaults to all companies.
3.  **Company Management**: The Admin goes to the **Company Management** page to:
    *   Create new company accounts, assign an HR Manager, set user limits, and define the subscription tier (Basic or Pro).
    *   View a table of all companies with key stats (user count, completion rates, etc.).
    *   Export a CSV of all company data.
4.  **Global User Management**: From the **User Management** page, the Admin can select any company to view, add, or remove their end-users.
5.  **Platform User Management**: The Admin navigates to the **Platform Users** page to grant or revoke access for other Admins and Consultants.
6.  **Data Export**: The Admin can use the **Export User Data** page to generate and download a comprehensive CSV file containing every user on the platform (End-Users, HR, Admins, Consultants) and their completion statuses.

---

## 4. Consultant Journey

The Consultant's role is focused on quality assurance for the AI-generated content.

1.  **Login**: The Consultant logs in with their platform-specific email.
2.  **Review AI Recommendations**: The Consultant navigates to the **Review Queue**.
    *   The page automatically generates a sample set of AI recommendations based on a predefined test user profile.
    *   The Consultant can review each recommendation and mark it as "Approved," "Snoozed," or "Rejected."
    *   If rejecting, they can provide feedback or suggest edits to help refine the AI's prompting and output for future iterations.
