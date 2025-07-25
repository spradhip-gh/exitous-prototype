# ExitBetter Platform - Database Schema

This document outlines the proposed database schema for the ExitBetter application. It's designed to support the features and user roles defined in the product requirements, providing a blueprint for backend development.

---

## Table of Contents

1.  [Companies](#companies)
2.  [Platform Users](#platform_users)
3.  [Company HR Assignments](#company_hr_assignments)
4.  [Company Users](#company_users)
5.  [User Profiles](#user_profiles)
6.  [User Assessments](#user_assessments)
7.  [Master Questions](#master_questions)
8.  [Company Question Configs](#company_question_configs)
9.  [Master Tasks](#master_tasks)
10. [Company Resources](#company_resources)
11. [External Resources](#external_resources)
12. [Guidance Rules](#guidance_rules)
13. [Review Queue](#review_queue)

---

### `companies`

Stores information about each client company, their assigned HR manager, and default settings.

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

Stores users with platform-wide access roles, like administrators and consultants.

| Column      | Type      | Description                           |
| ----------- | --------- | ------------------------------------- |
| `id`        | `UUID`    | **Primary Key**.                      |
| `email`     | `TEXT`    | User's unique email address. Unique.  |
| `role`      | `TEXT`    | Role ('admin' or 'consultant').       |
| `created_at`| `TIMESTAMPTZ` | Timestamp of when the user was created. |

### `company_hr_assignments`

Maps HR Managers to the companies they manage and defines their specific permissions for that company.

| Column        | Type      | Description                                                               |
| ------------- | --------- | ------------------------------------------------------------------------- |
| `company_id`  | `UUID`    | **Composite PK** and **Foreign Key** to `companies.id`.                   |
| `hr_email`    | `TEXT`    | **Composite PK**. The email of the assigned HR manager.                   |
| `is_primary`  | `BOOLEAN` | `true` if this is the primary manager for the company. Default: `false`.  |
| `permissions` | `JSONB`   | A JSON object defining granular permissions (e.g., `{"userManagement": "write", "formEditor": "read"}`). |
| `created_at`  | `TIMESTAMPTZ`| Timestamp of when the assignment was created.                            |
| `updated_at`  | `TIMESTAMPTZ`| Timestamp of the last update.                                            |

### `company_users`

Stores end-users associated with a specific company. This table tracks who is eligible to use the platform.

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

*Composite unique key on (`company_id`, `email`).*

### `user_profiles`

Stores the profile form data for each end-user. This is a one-to-one relationship with `company_users`.

| Column      | Type      | Description                                  |
| ----------- | --------- | -------------------------------------------- |
| `user_id`   | `UUID`    | **Primary Key** and **Foreign Key** to `company_users.id`. |
| `data`      | `JSONB`   | The complete JSON object of the user's profile form. |
| `updated_at`| `TIMESTAMPTZ` | Timestamp of the last update.                |

### `user_assessments`

Stores the assessment (exit details) form data for each end-user. This is a one-to-one relationship with `company_users`.

| Column      | Type      | Description                                      |
| ----------- | --------- | ------------------------------------------------ |
| `user_id`   | `UUID`    | **Primary Key** and **Foreign Key** to `company_users.id`. |
| `data`      | `JSONB`   | The complete JSON object of the user's assessment form. |
| `updated_at`| `TIMESTAMPTZ` | Timestamp of the last update.                    |


### `master_questions`

Stores the master list of all possible assessment questions, acting as the global template.

| Column          | Type      | Description                                                       |
| --------------- | --------- | ----------------------------------------------------------------- |
| `id`            | `TEXT`    | **Primary Key**. The unique ID of the question (e.g., 'workStatus'). |
| `question_data` | `JSONB`   | A JSON object containing all question properties (label, type, section, options, parentId, triggerValue, description, etc.). |
| `created_at`    | `TIMESTAMPTZ`| Timestamp of when the question was created.                      |
| `updated_at`    | `TIMESTAMPTZ`| Timestamp of the last update.                                    |


### `company_question_configs`

Stores company-specific customizations for the assessment form. This allows companies to override, disable, or add questions.

| Column                   | Type      | Description                                                |
| ------------------------ | --------- | ---------------------------------------------------------- |
| `company_id`             | `UUID`    | **Primary Key** and **Foreign Key** to `companies.id`.       |
| `question_overrides`     | `JSONB`   | JSON object of master questions that have been modified (e.g., `{"workStatus": {"label": "Your Status"}}`). |
| `custom_questions`       | `JSONB`   | JSON object of new questions specific to this company.     |
| `question_order`         | `JSONB`   | JSON object defining the display order of questions by section. |
| `guidance`               | `JSONB`   | Array of `GuidanceRule` objects for this company.          |
| `updated_at`             | `TIMESTAMPTZ`| Timestamp of the last update.                              |

### `master_tasks`

Stores the master list of all possible tasks that can be assigned to users based on their answers.

| Column                        | Type      | Description                                                               |
| ----------------------------- | --------- | ------------------------------------------------------------------------- |
| `id`                          | `TEXT`    | **Primary Key**. A unique, kebab-case identifier for the task.              |
| `type`                        | `TEXT`    | The workflow type (e.g., 'layoff', 'anxious'). Default: 'layoff'.        |
| `name`                        | `TEXT`    | The short, actionable name of the task (e.g., "Apply for Unemployment").  |
| `category`                    | `TEXT`    | Category for UI grouping (e.g., 'Financial', 'Career', 'Health').         |
| `detail`                      | `TEXT`    | A more detailed Markdown description of what the task involves.           |
| `deadline_type`               | `TEXT`    | The event that triggers the deadline ('notification_date' or 'termination_date'). |
| `deadline_days`               | `INTEGER` | The number of days from the `deadline_type` event that the task is due.   |
| `linked_resource_id`          | `UUID`    | Optional **Foreign Key** to `external_resources.id`.                      |
| `created_at`                  | `TIMESTAMPTZ`| Timestamp of when the task was created.                                   |
| `updated_at`                  | `TIMESTAMPTZ`| Timestamp of the last update.                                             |

### `company_resources`

Stores documents and links uploaded by an HR Manager for their employees.

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

Stores the curated directory of professional services and partners that can be recommended to users.

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
| `pro_offer`         | `TEXT`  | Description of a special offer for pro users.          |
| `related_task_ids`  | `JSONB` | An array of `taskId`s that this resource can help with. |
| `keywords`          | `JSONB` | An array of keywords for searching.                    |
| `created_at`        | `TIMESTAMPTZ`| Timestamp of creation.                                 |
| `updated_at`        | `TIMESTAMPTZ`| Timestamp of the last update.                          |

### `guidance_rules`

Stores consultant-created rules to provide deterministic, high-quality guidance when specific conditions are met.

| Column          | Type      | Description                                       |
| --------------- | --------- | ------------------------------------------------- |
| `id`            | `UUID`    | **Primary Key**.                                  |
| `name`          | `TEXT`    | An internal name for the rule (e.g., "COBRA Advice"). |
| `conditions`    | `JSONB`   | An array of condition objects that must all be true. |
| `task_id`       | `TEXT`    | **Foreign Key** to `master_tasks.id`. The task to assign if conditions are met. |
| `created_at`    | `TIMESTAMPTZ`| Timestamp of creation.                            |
| `updated_at`    | `TIMESTAMPTZ`| Timestamp of last update.                         |

### `review_queue`

A log of AI-generated recommendations for consultants to review, approve, or convert into guidance rules.

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
