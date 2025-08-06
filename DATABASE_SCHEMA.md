# ExitBetter Platform - Database Schema

This document outlines the proposed database schema for the ExitBetter application, designed to support the features and user roles defined in the product requirements.

---

## Table of Contents

1.  [Companies](#companies)
2.  [Platform Users](#platform_users)
3.  [Company HR Assignments](#company_hr_assignments)
4.  [Company Users](#company_users)
5.  [User Profiles](#user_profiles)
6.  [User Assessments](#user_assessments)
7.  [Master Questions](#master_questions)
8.  [Master Question Configs](#master_question_configs)
9.  [Company Question Configs](#company_question_configs)
10. [Master Tasks](#master_tasks)
11. [Master Tips](#master_tips)
12. [Task Mappings](#task_mappings)
13. [Tip Mappings](#tip_mappings)
14. [Company Resources](#company_resources)
15. [External Resources](#external_resources)
16. [Guidance Rules](#guidance_rules)
17. [Review Queue](#review_queue)

---

### `companies`

Stores information about each client company, their assigned HR manager, and default settings.

| Column                        | Type          | Description                                           |
| --------------------------- | ------------- | ----------------------------------------------------- |
| `id`                        | `UUID`        | **Primary Key**. A unique identifier for the company. |
| `name`                      | `TEXT`        | The unique name of the company.                       |
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
| `updated_at`| `TIMESTAMPTZ` | Timestamp of the last update.         |

### `company_hr_assignments`

Maps HR Managers to the companies they manage and defines their specific permissions for that company.

| Column        | Type      | Description                                                               |
| ------------- | --------- | ------------------------------------------------------------------------- |
| `company_id`  | `UUID`    | **Composite PK** and **Foreign Key** to `companies.id`.                   |
| `hr_email`    | `TEXT`    | **Composite PK**. The email of the assigned HR manager.                   |
| `is_primary`  | `BOOLEAN` | `true` if this is the primary manager for the company. Default: `false`.  |
| `permissions` | `JSONB`   | A JSON object defining granular permissions (e.g., `{"userManagement": "write"}`). |
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
| `updated_at`                 | `TIMESTAMPTZ` | Timestamp of the last update.                                |

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

Stores the master list of all possible questions for both Profile and Assessment forms, acting as the global template.

| Column          | Type      | Description                                                       |
| --------------- | --------- | ----------------------------------------------------------------- |
| `id`            | `TEXT`    | **Primary Key**. The unique ID of the question (e.g., 'workStatus'). |
| `form_type`     | `TEXT`    | The form this question belongs to ('profile' or 'assessment').    |
| `sort_order`    | `INTEGER` | An integer to define the display order of the question within its section. |
| `question_data` | `JSONB`   | A JSON object containing all question properties (label, type, section, options, parentId, triggerValue, description, etc.). |
| `created_at`    | `TIMESTAMPTZ`| Timestamp of when the question was created.                      |
| `updated_at`    | `TIMESTAMPTZ`| Timestamp of the last update.                                    |

### `master_question_configs`

Stores the global configuration for the forms, such as the display order of sections.

| Column                  | Type    | Description                                                                       |
| ----------------------- | ------- | --------------------------------------------------------------------------------- |
| `form_type`             | `TEXT`  | **Primary Key**. The form this configuration applies to ('profile' or 'assessment'). |
| `section_order`         | `JSONB` | An ordered array of section names (e.g., `["Section A", "Section B"]`).           |
| `updated_at`            | `TIMESTAMPTZ`| Timestamp of the last update.                                                      |


### `company_question_configs`

Stores company-specific customizations for the assessment form. This allows companies to override, disable, or add questions.

| Column                      | Type      | Description                                                                                               |
| --------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `company_id`                | `UUID`    | **Primary Key** and **Foreign Key** to `companies.id`.                                                      |
| `question_overrides`        | `JSONB`   | JSON object of master questions that have been modified (e.g., `{"workStatus": {"label": "Your Status"}}`). |
| `custom_questions`          | `JSONB`   | JSON object of new questions specific to this company.                                                    |
| `question_order_by_section` | `JSONB`   | JSON object defining the display order of questions by section.                                           |
| `answer_guidance_overrides` | `JSONB`   | JSON object mapping custom tasks/tips to specific answers, overriding `task_mappings`. |
| `company_tasks`             | `JSONB`   | A list of company-specific task objects. |
| `company_tips`              | `JSONB`   | A list of company-specific tip objects. |
| `updated_at`                | `TIMESTAMPTZ`| Timestamp of the last update.                                                                             |


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
| `linkedResourceId`            | `TEXT`    | Optional foreign key to `external_resources.id`.                          |
| `isCompanySpecific`           | `BOOLEAN` | Flag to indicate if this is a company-specific task.                      |
| `isActive`                    | `BOOLEAN` | Flag to indicate if the task is active and can be used in mappings. Default: `true`. |
| `created_at`                  | `TIMESTAMPTZ`| Timestamp of when the task was created.                                   |
| `updated_at`                  | `TIMESTAMPTZ`| Timestamp of the last update.                                             |

### `master_tips`

Stores the master list of all "Did you know..." tips that can be mapped to answers.

| Column          | Type      | Description                                                       |
| --------------- | --------- | ----------------------------------------------------------------- |
| `id`            | `TEXT`    | **Primary Key**. A unique, kebab-case identifier for the tip.       |
| `type`          | `TEXT`    | The workflow type (e.g., 'layoff', 'anxious'). Default: 'layoff'. |
| `priority`      | `TEXT`    | The display priority ('High', 'Medium', 'Low').                   |
| `category`      | `TEXT`    | Category for UI grouping (e.g., 'Financial', 'Career', 'Health'). |
| `text`          | `TEXT`    | The content of the tip.                                           |
| `isCompanySpecific` | `BOOLEAN` | Flag to indicate if this is a company-specific tip.             |
| `isActive`      | `BOOLEAN` | Flag to indicate if the tip is active and can be used in mappings. Default: `true`. |
| `created_at`    | `TIMESTAMPTZ`| Timestamp of when the tip was created.                            |
| `updated_at`    | `TIMESTAMPTZ`| Timestamp of the last update.                                     |

### `task_mappings`

Maps tasks from `master_tasks` to specific question answers. This creates the logic for task generation.

| Column          | Type      | Description                                                          |
| --------------- | --------- | -------------------------------------------------------------------- |
| `id`            | `UUID`    | **Primary Key**.                                                     |
| `question_id`   | `TEXT`    | **Foreign Key** to `master_questions.id`.                            |
| `answer_value`  | `TEXT`    | The specific answer that triggers the task (e.g., "Yes", "Onsite"). |
| `task_id`       | `TEXT`    | **Foreign Key** to `master_tasks.id`.                                |
| `created_at`    | `TIMESTAMPTZ`| Timestamp of when the mapping was created.                           |

*Composite unique key on (`question_id`, `answer_value`, `task_id`).*

### `tip_mappings`

Maps tips from `master_tips` to specific question answers.

| Column          | Type      | Description                                                          |
| --------------- | --------- | -------------------------------------------------------------------- |
| `id`            | `UUID`    | **Primary Key**.                                                     |
| `question_id`   | `TEXT`    | **Foreign Key** to `master_questions.id`.                            |
| `answer_value`  | `TEXT`    | The specific answer that triggers the tip.                         |
| `tip_id`        | `TEXT`    | **Foreign Key** to `master_tips.id`.                                 |
| `created_at`    | `TIMESTAMPTZ`| Timestamp of when the mapping was created.                           |

*Composite unique key on (`question_id`, `answer_value`, `tip_id`).*

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
| `updated_at`  | `TIMESTAMPTZ`| Timestamp of the last update.               |

### `external_resources`

Stores the curated directory of professional services and partners that can be recommended to users.

| Column              | Type    | Description                                            |
| ------------------- | ------- | ------------------------------------------------------ |
| `id`                | `TEXT`  | **Primary Key**.                                       |
| `name`              | `TEXT`  | The name of the resource (e.g., "Momentum Financial"). |
| `description`       | `TEXT`  | A brief description of the service.                    |
| `category`          | `TEXT`  | e.g., 'Finances', 'Legal', 'Career', 'Well-being'.     |
| `website`           | `TEXT`  | The URL to the resource's website.                     |
| `image_url`         | `TEXT`  | A URL for a representative image.                      |
| `image_hint`        | `TEXT`  | A hint for AI image generation.                        |
| `is_verified`       | `BOOLEAN`| `true` if this is a verified partner.                  |
| `availability`      | `JSONB` | Array of tiers this is available to (e.g., `["basic", "pro"]`). |
| `basic_offer`       | `TEXT`  | Description of a special offer for basic users.        |
| `pro_offer`         | `TEXT`  | Description of a special offer for pro users.        |
| `related_task_ids`  | `JSONB` | An array of `taskId`s that this resource can help with. |
| `keywords`          | `JSONB` | An array of keywords for searching.                    |
| `created_at`        | `TIMESTAMPTZ`| Timestamp of creation.                                 |
| `updated_at`        | `TIMESTAMPTZ`| Timestamp of the last update.                          |

### `guidance_rules`

Stores consultant-created rules to provide deterministic, high-quality guidance when specific conditions are met.

| Column          | Type      | Description                                       |
| --------------- | --------- | ------------------------------------------------- |
| `id`            | `UUID`    | **Primary Key**.                                  |
| `question_id`   | `TEXT`    | **Foreign Key** to `master_questions.id`. The question this rule is based on. |
| `name`          | `TEXT`    | An internal name for the rule (e.g., "COBRA Advice"). |
| `type`          | `TEXT`    | The type of rule: 'direct' (answer-based) or 'calculated' (range-based). |
| `conditions`    | `JSONB`   | For 'direct' rules, an array of condition objects that must all be true. |
| `calculation`   | `JSONB`   | For 'calculated' rules, defines the calculation logic (e.g., tenure, age). |
| `ranges`        | `JSONB`   | For 'calculated' rules, an array of value ranges and their corresponding assignments. |
| `assignments`   | `JSONB`   | The tasks and/or tips to assign if conditions are met. Stored as `{ "taskIds": [...], "tipIds": [...] }`. |
| `created_at`    | `TIMESTAMPTZ`| Timestamp of creation.                            |
| `updated_at`    | `TIMESTAMPTZ`| Timestamp of last update.                         |

### `review_queue`

A log of AI-generated recommendations for consultants to review, approve, or convert into guidance rules.

| Column        | Type      | Description                                       |
| ------------- | --------- | ------------------------------------------------- |
| `id`          | `UUID`    | **Primary Key**.                                  |
| `user_email`  | `TEXT`    | The email of the user whose data was used.        |
| `input_data`  | `JSONB`   | The user profile/assessment data sent to the AI.  |
| `output_data` | `JSONB`   | The recommendation list received from the AI.     |
| `status`      | `TEXT`    | 'pending', 'approved', or 'rejected'.             |
| `created_at`  | `TIMESTAMPTZ`| Timestamp of when the recommendation was generated. |
| `reviewed_at` | `TIMESTAMPTZ`| Timestamp of when the review occurred.            |
| `reviewer_id` | `UUID`    | **Foreign Key** to `platform_users.id`.           |
