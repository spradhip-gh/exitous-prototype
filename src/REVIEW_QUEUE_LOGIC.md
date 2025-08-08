
# ExitBetter: Review Queue & Approval Logic

This document outlines the logic for the Admin/Consultant review queue, detailing which actions by an HR Manager trigger a review and what the expected outcomes are. This serves as the blueprint for the platform's content governance and quality control.

---

## 1. Guiding Principles

- **Admin Oversight:** Platform Admins have the final say on content that affects the master templates or could impact all users.
- **HR Autonomy (with Review):** HR Managers have the autonomy to create content specific to their company's needs. This custom content is immediately available to their users but is also sent to a queue for Admin review to ensure quality, consistency, and to identify potential new master content.
- **User Experience Protection:** Locked questions exist to ensure a consistent and high-quality core experience for all end-users. HR suggestions for these questions require explicit Admin approval.

---

## 2. Review Triggers & Workflows

There are two primary types of review items: **Suggestions Requiring Approval** and **Items for Standard Review**.

### 2.1. Suggestions Requiring Approval (Locked Questions)

This workflow applies when an HR Manager attempts to modify a **locked** master question. The suggested changes are **NOT** applied to the company's form until an Admin explicitly approves them.

| Trigger                             | Action by HR Manager                                                                       | Item Sent to Queue (`review_queue`)                                                                                              | Admin Action: **Approve**                                                                                                                                                                            | Admin Action: **Reject**                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Editing a Locked Master Question**| Suggests adding/removing answer options or mapping guidance to a locked master question answer. | A `question_edit_suggestion` item is created with the proposed `change_details`. The status is `pending`. | The item status is marked `approved`. The approved `options` or `answerGuidance` are merged into the `question_overrides` field for that company in `company_question_configs`. The change is now live. | The item status is marked `rejected`. No changes are applied to the company config. The HR manager sees the 'Rejected' status. |

### 2.2. Items for Standard Review (Custom Content)

This workflow applies when an HR Manager creates new, company-specific content. The content is **immediately active** for that company's users but is simultaneously sent to the queue for an Admin to audit.

| Trigger                            | Action by HR Manager                                                             | Item Sent to Queue (`review_queue`)                                                                                                        | Admin Action: **Mark as Reviewed**                                                                                        | Admin Action: **Reject**                                                                                                                                                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Creating a New Custom Question** | Adds a completely new question (with its own answers and guidance) to the form.  | A `custom_question_guidance` item is created containing the full `Question` object. The status is `pending`. The question is **live** on the company's form. | The item is marked `reviewed`, indicating the Admin has seen and acknowledged the custom content. No changes are made. The question remains active. | An Admin can provide a `rejection_reason`. The item status is marked `rejected`. The `isActive` flag on the custom question in `company_question_configs` is set to `false`. The question is now hidden from users. |
| **Auditing AI Recommendations** | (System Action) The AI agent generates a personalized plan for a user. | An `ai_recommendation_audit` item is created with the user's (anonymized) input data and the AI's generated output. | The item is marked `reviewed`, indicating a consultant has audited the AI's performance for quality assurance. | (Not Applicable) This is for auditing only. |

---

## 3. Summary of Review Item Types

-   `question_edit_suggestion`: An HR's proposal to change the options or guidance of a locked master question. **Requires Admin approval to become active.**
-   `custom_question_guidance`: A notification that an HR manager has created a new, company-specific question. **Active immediately, but can be rejected and deactivated by an Admin.**
-   `ai_recommendation_audit`: A sample of AI-generated recommendations for a real (anonymized) user for consultant review and quality control.
