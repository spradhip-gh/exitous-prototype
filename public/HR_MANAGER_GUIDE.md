# ExitBetter: A Guide for HR Managers

Welcome to the ExitBetter platform! This guide is designed to help you, as an HR Manager, effectively manage your company's offboarding process and provide your exiting employees with a seamless, supportive experience.

---

## 1. Getting Started: Logging In

Your journey begins at the login screen.

- **Role:** Select the **"HR"** tab.
- **Credentials:** Enter the email address that has been registered for your company's HR Manager account.
- **Login:** Click the "Login as HR Manager" button.

Upon successful login, you will be taken to your administrative dashboard.

---

## 2. Managing Your Users

The User Management page is where you'll spend most of your time. Here, you can add, update, and manage the list of employees who will be using the ExitBetter platform.

### 2.1. Adding a User Manually

For adding individual employees:
1.  Navigate to the **User Management** page from the sidebar.
2.  Fill in the "Add New User" form with the employee's:
    - **Work Email Address:** (Required) This is their login credential.
    - **Company ID:** (Required) Their unique employee identifier.
    - **Notification Date:** (Required) The date they were officially notified of their exit. This is crucial as it controls when their invitation can be sent.
    - **Personal Email:** (Optional) A secondary email for communication.
3.  Click **"Add User"**. The employee will be added to the list below.

### 2.2. Bulk Uploading Users with a CSV

For managing multiple users at once, the CSV upload is a powerful tool. It allows you to add new users, update existing (but not yet invited) users, and pre-fill some of their assessment data to make their experience smoother.

1.  **Download the Template:** On the User Management page, click the **"Download Template"** button. This provides a CSV file with the correct headers.
2.  **Fill the CSV:** Open the template and fill in the user data.
    - **Required Fields:** `email`, `companyId`, `notificationDate`.
    - **Optional Fields:** `personalEmail`, `timezone`, and various assessment-related dates like `finalDate` and `severanceAgreementDeadline`. Populating these fields will pre-fill the forms for your employees.
3.  **Upload the File:** Click the **"Upload CSV"** button and select your completed file. The system will process the file, adding new users and updating existing ones who have not yet received an invitation.

### 2.3. Sending Invitations

Users cannot log in until they have been invited. An invitation can only be sent on or after the specified **Notification Date**.

- **Single Invite:** Find the user in the table and click the **"Invite"** button in their row.
- **Bulk Invites:** Select multiple users using the checkboxes. The **"Send Invites"** button at the top of the table will become active if any selected users are eligible (i.e., their notification date is today or in the past). Click it to send invitations to all eligible selected users.

Once invited, a user's status will change, and they will be able to log in.

---

## 3. Customizing the Assessment Form (Pro Feature)

If your company has a Pro subscription, you can tailor the assessment questions to better fit your company's specific processes and terminology.

1.  Navigate to the **Form Editor** page.
2.  You will see the master list of questions organized by section. For each question, you can:
    - **Enable/Disable:** Use the checkbox to control whether a question appears on your company's form.
    - **Edit:** Click the "Edit" (pencil) icon to change the question's text, description, or answer options. This creates a company-specific "override" without changing the master template.
    - **Add Custom Questions:** Click the **"Add Custom Question"** button at the bottom to create new questions that are unique to your company.
    - **Add Sub-Questions:** For multiple-choice questions, you can add conditional sub-questions that appear only when a user selects a specific answer.

> **Note:** If a Platform Admin updates a master question you have previously edited, a **bell icon** will appear next to it, notifying you of the available update. You can choose to adopt the new master version or keep your custom override.

---

## 4. Managing Company Resources

You can provide helpful documents directly to your employees through the platform.

1.  Navigate to the **Resources** page.
2.  Fill out the form to add a new resource:
    - **Title & Description:** Give the resource a clear name and summary.
    - **Category:** Organize the resource under a category (e.g., Benefits, Policies).
    - **File:** Click **"Choose File"** to upload the document (e.g., PDF, text file).
3.  Click **"Add Resource"**. The document will appear in the "Company Resources" section of the end-user's dashboard.

---

## 5. Company-Wide Settings

The **Company Settings** page allows you to configure default settings for all users in your company.

- **Deadline Defaults:** You can set a default time and timezone (e.g., 5:00 PM, America/Chicago) for when severance agreements are due. This ensures consistency and accuracy in the AI-generated timeline for your employees.
- **Plan & Usage:** View your company's current subscription plan (Basic or Pro) and see how many user licenses you have used.

---

## 6. User Preview Mode

To ensure the end-user experience is exactly as you intend, you can enter a "User Preview" mode.

1.  Click on your name in the top-right header to open the user menu.
2.  Select **"View as User"**.
3.  You will be redirected to the end-user dashboard, where you can see the platform exactly as an employee would, including your customized assessment questions and uploaded resources.
4.  To return to your HR view, click the user menu again and select **"Return to HR View"**.
