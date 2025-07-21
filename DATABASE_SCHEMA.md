# ExitBetter Platform - Database Schema

This document outlines the proposed database schema for the ExitBetter application. It's designed to support the features and user roles defined in the product requirements, providing a blueprint for backend development.

---

## Table of Contents

1.  [Companies](#companies)
2.  [Platform Users](#platform_users)
3.  [Company Users](#company_users)
4.  [User Profiles](#user_profiles)
5.  [User Assessments](#user_assessments)
6.  [Master Questions](#master_questions)
7.  [Company Question Configs](#company_question_configs)
8.  [Company Resources](#company_resources)

---

### `companies`

Stores information about each client company, their assigned HR manager, and default settings.

| Column                        | Type          | Description                                           |
| --------------------------- | ------------- | ----------------------------------------------------- |
| `id`                        | `UUID`        | **Primary Key**. A unique identifier for the company. |
| `name`                      | `TEXT`        | The unique name of the company (e.g., "Globex Corp"). |
| `hr_manager_email`          | `TEXT`        | The email of the assigned HR manager. Unique constraint. |
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
| `question_data` | `JSONB`   | A JSON object containing all question properties (label, type, section, options, parentId, triggerValue, etc.). |
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
| `updated_at`             | `TIMESTAMPTZ`| Timestamp of the last update.                              |

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
| `storage_path`| `TEXT`    | Path to the file in a storage service (e.g., S3, GCS). |
| `created_at`  | `TIMESTAMPTZ`| Timestamp of when the resource was created. |
| `summary`     | `TEXT`    | Optional AI-generated summary of the document. |
