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

### 2.1. Suggestions Requiring Approval

This workflow applies when an HR Manager attempts to modify a **locked** master question. These suggestions are not applied to the company's form until an Admin explicitly approves them.

| Trigger                               | Action by HR Manager                                                                 | Item Sent to Queue                                                                                                        | Admin Action: **Approve**                                                                                                   | Admin Action: **Reject**                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Editing a Locked Master Question** | Submits a request to add new answer options or remove existing ones from a locked question. | A `question_edit_suggestion` item is created with the proposed `optionsToAdd` and `optionsToRemove`. The status is `pending`. | The suggested changes are applied to the `question_overrides` for that company. The item is marked `approved`.              | No changes are made. The item is marked `rejected`, and the HR Manager is notified (in a future implementation).              |
| **Mapping Guidance to Locked Answer** | Maps a company-specific task or tip to an answer on a locked master question.          | A `guidance_override_suggestion` item is created with the proposed `answerGuidance` mapping. The status is `pending`.         | The `answerGuidanceOverrides` for that company are updated with the new mapping. The item is marked `approved`. | No changes are made. The item is marked `rejected`.                                                                               |

---

### 2.2. Items for Standard Review

This workflow applies when an HR Manager creates new, company-specific content. The content is **immediately active** for that company's users but is simultaneously sent to the queue for an Admin to audit. This allows for HR agility while maintaining quality control.

| Trigger                             | Action by HR Manager                                                              | Item Sent to Queue                                                                                                   | Admin Action: **Mark as Reviewed**                                                                                        | Admin Action: **Reject / Revoke**                                                                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Creating a New Custom Question** | Adds a completely new question (with its own answers and guidance) to the form.   | A `custom_question_guidance` item is created containing the full `Question` object. The status is `pending`.       | The item is marked `reviewed`, indicating the Admin has seen and acknowledged the custom content. No changes are made.    | The item is marked `rejected`, and the custom question (and its associated guidance) is **deleted** from the company's configuration. This is a corrective action. |
| **Mapping Guidance to Custom Answer**| Adds guidance (tasks/tips) to a custom answer on an otherwise unlocked master question. | A `guidance_override_suggestion` item is sent for review (similar to locked questions, but considered less critical). | The item is marked `reviewed`. The guidance remains active.                                                               | The Admin can manually navigate to the Form Editor to remove the guidance if it is inappropriate. The item is marked `rejected`.                                |

---

## 3. Summary of Review Item Types

-   `question_edit_suggestion`: An HR's proposal to change the options of a locked master question. **Requires Admin approval to become active.**
-   `custom_question_guidance`: A notification that an HR manager has created a new, company-specific question. **Active immediately, but can be revoked by an Admin.**
-   `guidance_override_suggestion`: A notification that an HR manager has mapped custom guidance to a question's answer. **Active immediately, can be reviewed/revoked.**
-   `ai_recommendation_audit`: (Future feature) A sample of AI-generated recommendations for a real (anonymized) user for consultant review and quality control.
