
# Product Requirements Document: ExitBetter Platform

**Author:** App Prototyper AI
**Version:** 0.2-20250722
**Status:** In Development
**Date:** July 22, 2025

---

## 1. Introduction & Vision

### 1.1. Problem Statement
Navigating a layoff is an overwhelming, confusing, and emotionally draining experience for employees. They are faced with complex documents, critical deadlines for benefits and severance, and the immediate pressure of finding their next role, all with little personalized guidance. Companies, in turn, struggle to provide scalable, compassionate, and effective offboarding support that goes beyond a generic checklist.

### 1.2. Product Vision
The **ExitBetter Platform** is a comprehensive web application designed to transform the layoff experience from a moment of crisis into a managed transition. By leveraging personalized, AI-driven guidance, ExitBetter empowers exiting employees with a clear, actionable timeline of next steps. For companies, it offers a customizable and scalable platform to deliver superior offboarding support, enhancing their brand reputation and maintaining goodwill with former employees.

## 2. User Roles & Personas

The platform is designed to serve four distinct user roles:

| Role             | Description                                                                                             | Key Goals                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **End-User**     | An employee who has been notified of their exit from a company.                                         | - Understand critical deadlines (severance, benefits).<br>- Receive a personalized, step-by-step action plan.<br>- Connect with vetted professional resources.<br>- Securely manage personal and exit-related data. |
| **HR Manager**   | A human resources professional at a client company.                                                     | - Manage the list of exiting employees for their company.<br>- Customize the assessment questionnaire.<br>- Suggest edits to locked questions.<br>- Create and map company-specific tasks and tips.<br>- Upload company-specific resources.<br>- Analyze assessment data to identify areas of confusion.<br>- Preview the end-user experience. |
| **Platform Admin**| A super-user responsible for managing the entire ExitBetter platform.                                  | - Onboard new companies and their HR managers.<br>- Manage the master list of assessment questions, tasks, and tips.<br>- Create and manage deterministic guidance rules.<br>- Review and approve HR suggestions.<br>- Curate the external professional resources directory.<br>- Oversee all platform users and data. |
| **Consultant**   | An external or internal expert tasked with quality control.                                             | - Review and approve AI-generated content and recommendations to ensure quality, accuracy, and empathy.<br>- Convert high-quality recommendations into reusable guidance rules. |

## 3. Key Features & Functionality

### 3.1. End-User Flow
- **Secure Login:** Users log in with a unique email and company ID provided by their HR manager.
- **Profile Creation:** A guided form to collect personal and demographic information that helps tailor the AI recommendations (e.g., marital status, dependents, location).
- **Assessment Form (Exit Details):** A dynamic form where users input details about their specific exit situation (e.g., final day, severance deadlines, benefits information). This form is populated with any data pre-filled by their HR manager. For date-related questions where the user may not know the answer (e.g., specific coverage end dates), they have the option to select "I'm not sure" to proceed.
- **Personalized AI Dashboard:**
    - **Timeline View:** An interactive, AI-generated timeline that visualizes all critical deadlines and recommended actions based on the user's profile and assessment data.
    - **Categorized Recommendations:** Tasks are categorized (e.g., Healthcare, Finances, Legal, Job Search) and sorted by urgency.
    - **Task Management:** Users can mark tasks as complete, and the UI dynamically updates to reflect their progress.
- **Resource Center:**
    - **Company Resources:** View and download company-specific documents (e.g., benefits guides, policies) uploaded by their HR manager.
    - **External Resources:** Browse a directory of vetted professional services (e.g., financial planners, lawyers), view AI-powered "Top Matches," and connect with experts.

### 3.2. HR Manager Flow
- **Secure Login & Company Switching:** HR Managers log in with their company email and can switch between multiple assigned companies.
- **User Management:**
    - Add, remove, and manage the list of end-users for their company.
    - Bulk upload users via a CSV file, with support for pre-filling key assessment data to streamline the user's experience.
    - View the invitation and completion status of all their users.
- **Form Customization (Pro Feature):**
    - Enable or disable questions from the master list.
    - Override the text and options of master questions to match company-specific terminology.
    - Add new, company-specific custom questions to the assessment.
    - **Suggest Edits:** Submit suggestions to an Admin for changes to locked, platform-wide questions.
    - Receive notifications for when a master question has been updated by a Platform Admin.
- **Custom Content Management:**
    - Create, edit, and delete company-specific tasks and tips.
    - Map custom guidance (tasks and tips) to answers on any question, which is then sent for Admin review.
- **Resource Management:** Upload and manage documents and resources for their employees.
- **Analytics Dashboard:** View analytics on the most common "Unsure" answers from employees, providing insight into areas of confusion.
- **HR Team Management (Primary HR Only):** A Primary HR Manager can add other HR managers to the companies they oversee and assign granular permissions for each module.
- **User Preview Mode:** The ability to enter a "preview" mode to see the platform exactly as an end-user would.
- **Company Settings:** Configure default settings like the timezone for severance deadlines.

### 3.3. Platform Admin Flow
- **Secure Login:** Admins log in with their platform email.
- **Company Management:**
    - Create new company accounts and assign HR Managers.
    - Set user limits and subscription tiers (e.g., Basic vs. Pro) for each company.
- **Content Management:**
    - **Master Form Editor:** Create, edit, and delete questions in the master (default) assessment template.
    - **Task Management:** Create, edit, and bulk-manage (via CSV) the master list of all actionable tasks.
    - **Tips Management:** Create, edit, and bulk-manage (via CSV) a master list of "Did you know..." tips that provide contextual advice.
- **Guidance & Review:**
    - **Guidance Rules:** Create complex, deterministic rules to assign specific tasks and tips based on user answers or calculated values (e.g., tenure, age).
    - **Suggestion Queue:** Review, approve, or reject suggestions submitted by HR Managers for locked questions and custom guidance.
    - **Review Queue (AI):** Review, approve, or reject AI-generated recommendations to ensure quality.
- **External Resources Management:** Build and manage the full directory of external resources, including adding partners, editing details, and marking them as "Verified."
- **Platform-wide Analytics:** View aggregated analytics on "Unsure" answers across all companies.
- **Platform User Management:** Grant or revoke Admin and Consultant access to the platform.
- **Data Export:** View and export a comprehensive list of all users across the entire platform.

### 3.4. Consultant Flow
- **Review Queue:** Review AI-generated recommendations from real user data in a dedicated queue.
- **Guidance Editor:** Approve, reject, or convert high-quality recommendations into reusable, rule-based guidance to improve the system over time.
- *Note: This feature is currently deactivated in the main prototype and is undergoing separate testing.*

### 3.5. AI & Technology
- **Genkit Integration:** The platform uses Google's Genkit framework for all AI functionality.
- **Personalized Recommendations:** A core AI flow analyzes a user's profile and assessment data to generate a structured, personalized list of action items. The prompt is engineered to have the AI act as a panel of experts, providing empathetic and actionable advice.
- **Data Schema:** The AI uses strongly-typed Zod schemas for both input and output, a process which ensures the generated data is structured, predictable, and can be reliably rendered in the UI.

## 4. Technical Architecture

- **Frontend:** Next.js (App Router), React, TypeScript
- **UI:** ShadCN UI components, Tailwind CSS for styling
- **State Management:** React Context API combined with custom hooks (`useAuth`, `useUserData`) for centralized and persistent state.
- **Forms:** React Hook Form with Zod for robust, schema-based validation.
- **AI Backend:** Genkit with Google's Gemini models.
- **Data Persistence (Prototype):** User-specific data is stored in `localStorage` to provide a personalized experience. Shared platform data (companies, master questions) is stored in a simulated in-memory database attached to the global scope to persist across hot reloads in development.

## 5. Data Model / Schema

The following tables represent the conceptual data structure for the platform.

### `companies`

| Column                        | Type          | Description                                           |
| --------------------------- | ------------- | ----------------------------------------------------- |
| `id`                        | `UUID`        | **Primary Key**. A unique identifier for the company. |
| `name`                      | `TEXT`        | The unique name of the company (e.g., "Globex Corp"). |
| `version`                   | `TEXT`        | Subscription tier ('basic' or 'pro').                 |
| `max_users`                 | `INTEGER`     | The maximum number of end-users for this company.     |
| `severance_deadline_time`   | `TIME`        | Default time for severance deadlines (e.g., '17:00'). |
| `severance_deadline_timezone`| `TEXT`       | Default timezone for deadlines (e.g., 'America/Chicago'). |
| `pre_end_date_contact_alias`| `TEXT`        | Default contact alias before a user's end date.      |
| `post_end_date_contact_alias`| `TEXT`       | Default contact alias after a user's end date.       |
| `created_at`                | `TIMESTAMPTZ` | Timestamp of when the company was created.            |
| `updated_at`                | `TIMESTAMPTZ` | Timestamp of the last update.                         |

### `platform_users`

| Column      | Type      | Description                           |
| ----------- | --------- | ------------------------------------- |
| `id`        | `UUID`    | **Primary Key**.                      |
| `email`     | `TEXT`    | User's unique email address. Unique.  |
| `role`      | `TEXT`    | Role ('admin' or 'consultant').       |
| `created_at`| `TIMESTAMPTZ` | Timestamp of when the user was created. |

### `company_hr_assignments`

| Column        | Type      | Description                                                               |
| ------------- | --------- | ------------------------------------------------------------------------- |
| `company_id`  | `UUID`    | **Composite PK** and **Foreign Key** to `companies.id`.                   |
| `hr_email`    | `TEXT`    | **Composite PK**. The email of the assigned HR manager.                   |
| `is_primary`  | `BOOLEAN` | `true` if this is the primary manager for the company. Default: `false`.  |
| `permissions` | `JSONB`   | A JSON object defining granular permissions (e.g., `{"userManagement": "write", "formEditor": "read"}`). |
| `created_at`  | `TIMESTAMPTZ`| Timestamp of when the assignment was created.                            |
| `updated_at`  | `TIMESTAMPTZ`| Timestamp of the last update.                                            |

### `company_users`

| Column                       | Type      | Description                                                    |
| ---------------------------- | --------- | -------------------------------------------------------------- |
| `id`                         | `UUID`    | **Primary Key**.                                               |
| `company_id`                 | `UUID`    | **Foreign Key** to `companies.id`.                             |
| `email`                      | `TEXT`    | The end-user's primary (work) email.                           |
| `company_user_id`            | `TEXT`    | The user's ID within their company's system.                   |
| `personal_email`             | `TEXT`    | Optional personal email for the user.                          |
| `notification_date`          | `DATE`    | The date the user was notified of their exit.                  |
| `is_invited`                 | `BOOLEAN` | `true` if an invitation has been sent. Default: `false`.       |
| `prefilled_assessment_data`  | `JSONB`   | Optional JSON object of assessment data pre-filled by HR.      |
| `profile_completed_at`       | `TIMESTAMPTZ` | Timestamp of when the user completed their profile.        |
| `assessment_completed_at`    | `TIMESTAMPTZ` | Timestamp of when the user completed their assessment.     |
| `created_at`                 | `TIMESTAMPTZ` | Timestamp of when the user was added.                        |

### `user_profiles`

| Column      | Type      | Description                                  |
| ----------- | --------- | -------------------------------------------- |
| `user_id`   | `UUID`    | **Primary Key** and **Foreign Key** to `company_users.id`. |
| `data`      | `JSONB`   | The complete JSON object of the user's profile form. |
| `updated_at`| `TIMESTAMPTZ` | Timestamp of the last update.                |

### `user_assessments`

| Column      | Type      | Description                                      |
| ----------- | --------- | ------------------------------------------------ |
| `user_id`   | `UUID`    | **Primary Key** and **Foreign Key** to `company_users.id`. |
| `data`      | `JSONB`   | The complete JSON object of the user's assessment form. |
| `updated_at`| `TIMESTAMPTZ` | Timestamp of the last update.                    |

### `master_questions`

| Column          | Type      | Description                                                       |
| --------------- | --------- | ----------------------------------------------------------------- |
| `id`            | `TEXT`    | **Primary Key**. The unique ID of the question (e.g., 'workStatus'). |
| `form_type`     | `TEXT`    | The form this question belongs to ('profile' or 'assessment'). |
| `question_data` | `JSONB`   | A JSON object containing all question properties (label, type, section, options, parentId, triggerValue, description, etc.). |
| `created_at`    | `TIMESTAMPTZ`| Timestamp of when the question was created.                      |
| `updated_at`    | `TIMESTAMPTZ`| Timestamp of the last update.                                    |

### `company_question_configs`

| Column                   | Type      | Description                                                |
| ------------------------ | --------- | ---------------------------------------------------------- |
| `company_id`             | `UUID`    | **Primary Key** and **Foreign Key** to `companies.id`.       |
| `question_overrides`     | `JSONB`   | JSON object of master questions that have been modified (e.g., `{"workStatus": {"label": "Your Status"}}`). |
| `custom_questions`       | `JSONB`   | JSON object of new questions specific to this company.     |
| `question_order`         | `JSONB`   | JSON object defining the display order of questions by section. |
| `guidance`               | `JSONB`   | Array of `GuidanceRule` objects for this company.          |
| `updated_at`             | `TIMESTAMPTZ`| Timestamp of the last update.                              |

### `master_tasks`

| Column                        | Type      | Description                                                               |
| ----------------------------- | --------- | ------------------------------------------------------------------------- |
| `id`                          | `TEXT`    | **Primary Key**. A unique, kebab-case identifier for the task.              |
| `type`                        | `TEXT`    | The workflow type (e.g., 'layoff', 'anxious'). Default: 'layoff'.        |
| `name`                        | `TEXT`    | The short, actionable name of the task (e.g., "Apply for Unemployment").  |
| `category`                    | `TEXT`    | Category for UI grouping (e.g., 'Financial', 'Career', 'Health').         |
| `detail`                      | `TEXT`    | A more detailed Markdown description of what the task involves.           |
| `deadline_type`               | `TEXT`    | The event that triggers the deadline ('notification_date' or 'termination_date'). |
| `deadline_days`               | `INTEGER` | The number of days from the `deadline_type` event that the task is due.   |
| `created_at`                  | `TIMESTAMPTZ`| Timestamp of when the task was created.                                   |
| `updated_at`                  | `TIMESTAMPTZ`| Timestamp of the last update.                                             |

### `task_mappings`

| Column          | Type      | Description                                                          |
| --------------- | --------- | -------------------------------------------------------------------- |
| `id`            | `UUID`    | **Primary Key**.                                                     |
| `question_id`   | `TEXT`    | **Foreign Key** to `master_questions.id`.                            |
| `answer_value`  | `TEXT`    | The specific answer that triggers the task (e.g., "Yes", "Onsite"). |
| `task_id`       | `TEXT`    | **Foreign Key** to `master_tasks.id`.                                |
| `created_at`    | `TIMESTAMPTZ`| Timestamp of when the mapping was created.                           |

### `master_tips`

| Column          | Type      | Description                                                       |
| --------------- | --------- | ----------------------------------------------------------------- |
| `id`            | `TEXT`    | **Primary Key**. A unique, kebab-case identifier for the tip.       |
| `type`          | `TEXT`    | The workflow type (e.g., 'layoff', 'anxious'). Default: 'layoff'. |
| `priority`      | `TEXT`    | The display priority ('High', 'Medium', 'Low').                   |
| `category`      | `TEXT`    | Category for UI grouping (e.g., 'Financial', 'Career', 'Health'). |
| `text`          | `TEXT`    | The content of the tip.                                           |
| `created_at`    | `TIMESTAMPTZ`| Timestamp of when the tip was created.                            |
| `updated_at`    | `TIMESTAMPTZ`| Timestamp of the last update.                                     |

### `tip_mappings`

| Column          | Type      | Description                                                          |
| --------------- | --------- | -------------------------------------------------------------------- |
| `id`            | `UUID`    | **Primary Key**.                                                     |
| `question_id`   | `TEXT`    | **Foreign Key** to `master_questions.id`.                            |
| `answer_value`  | `TEXT`    | The specific answer that triggers the tip.                         |
| `tip_id`        | `TEXT`    | **Foreign Key** to `master_tips.id`.                                 |
| `created_at`    | `TIMESTAMPTZ`| Timestamp of when the mapping was created.                           |

### `company_resources`

| Column        | Type      | Description                               |
| ------------- | --------- | ----------------------------------------- |
| `id`          | `UUID`    | **Primary Key**.                          |
| `company_id`  | `UUID`    | **Foreign Key** to `companies.id`.        |
| `title`       | `TEXT`    | The title of the resource.                |
| `description` | `TEXT`    | A brief description.                      |
| `file_name`   | `TEXT`    | The original name of the uploaded file.   |
| `category`    | `TEXT`    | Resource category (e.g., 'Benefits').     |
| `content`     | `TEXT`    | The text content of the uploaded file.    |
| `summary`     | `TEXT`    | Optional AI-generated summary of the document. |
| `created_at`  | `TIMESTAMPTZ`| Timestamp of when the resource was created. |

### `external_resources`

| Column              | Type    | Description                                            |
| ------------------- | ------- | ------------------------------------------------------ |
| `id`                | `UUID`  | **Primary Key**.                                       |
| `name`              | `TEXT`  | The name of the resource (e.g., "Momentum Financial"). |
| `description`       | `TEXT`  | A brief description of the service.                    |
| `category`          | `TEXT`  | e.g., 'Finances', 'Legal', 'Career', 'Well-being'.     |
| `website`           | `TEXT`  | The URL to the resource's website.                     |
| `image_url`         | `TEXT`  | A URL for a representative image.                      |
| `is_verified`       | `BOOLEAN`| `true` if this is a verified partner.                  |
| `availability`      | `JSONB` | Array of tiers this is available to (e.g., `["basic", "pro"]`). |
| `basic_offer`       | `TEXT`  | Description of a special offer for basic users.        |
| `pro_offer`         | `TEXT`  | Description of a special offer for pro users.        |
| `related_task_ids`  | `JSONB` | An array of `taskId`s that this resource can help with. |
| `keywords`          | `JSONB` | An array of keywords for searching.                    |
| `created_at`        | `TIMESTAMPTZ`| Timestamp of creation.                                 |
| `updated_at`        | `TIMESTAMPTZ`| Timestamp of the last update.                          |

### `guidance_rules`

| Column          | Type      | Description                                       |
| --------------- | --------- | ------------------------------------------------- |
| `id`            | `UUID`    | **Primary Key**.                                  |
| `question_id`    | `TEXT`   | **Foreign Key** to `master_questions.id`. The question this rule is based on. |
| `name`          | `TEXT`    | An internal name for the rule (e.g., "COBRA Advice"). |
| `type`          | `TEXT`    | The type of rule: 'direct' (answer-based) or 'calculated' (range-based). |
| `conditions`    | `JSONB`   | For 'direct' rules, an array of condition objects that must all be true. |
| `calculation`   | `JSONB`   | For 'calculated' rules, defines the calculation logic (e.g., tenure, age). |
| `ranges`        | `JSONB`   | For 'calculated' rules, an array of value ranges and their corresponding assignments. |
| `assignments`   | `JSONB`   | The tasks and/or tips to assign if conditions are met. Stored as `{ "taskIds": [...], "tipIds": [...] }`. |
| `created_at`    | `TIMESTAMPTZ`| Timestamp of creation.                            |
| `updated_at`    | `TIMESTAMPTZ`| Timestamp of last update.                         |

### `review_queue`

| Column        | Type      | Description                                       |
| ------------- | --------- | ------------------------------------------------- |
| `id`          | `UUID`    | **Primary Key**.                                  |
| `user_id`     | `UUID`    | **Foreign Key** to `company_users.id`.            |
| `input_data`  | `JSONB`   | The user profile/assessment data sent to the AI.  |
| `output_data` | `JSONB`   | The recommendation list received from the AI.     |
| `status`      | `TEXT`    | 'pending', 'approved', or 'rejected'.             |
| `created_at`  | `TIMESTAMPTZ`| Timestamp of when the recommendation was generated. |
| `reviewed_at` | `TIMESTAMPTZ`| Timestamp of when the review occurred.            |
| `reviewer_id` | `UUID`    | **Foreign Key** to `platform_users.id`.           |
