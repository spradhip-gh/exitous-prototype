
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function HrManagerGuidePage() {
    return (
        <div className="w-full bg-background">
            <div className="container mx-auto py-12 px-4">
                <article className="prose lg:prose-xl max-w-4xl mx-auto">
                    <h1>HR Manager Guide</h1>
                    <p className="lead">
                        Welcome to ExitBetter! This guide will walk you through the key features available to you as an HR Manager, helping you provide a smooth and supportive offboarding experience for your employees.
                    </p>

                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Pro vs. Basic</AlertTitle>
                        <AlertDescription>
                            Some features, like the Form Editor, are only available on the Pro plan. If a feature is unavailable, please contact an administrator to upgrade your company's plan.
                        </AlertDescription>
                    </Alert>

                    <h2>1. User Management</h2>
                    <p>
                        This is your central hub for managing the list of exiting employees for your company.
                    </p>
                    <ul>
                        <li><strong>Adding Users Manually:</strong> Use the "Add New User" form to add employees one by one. You must provide their Work Email, Company ID, and Notification Date. The Personal Email is optional but recommended.</li>
                        <li><strong>Bulk Upload via CSV:</strong> For adding multiple users at once, the CSV upload is a powerful tool.
                            <ul>
                                <li>Download the template to see all available columns and a sample row.</li>
                                <li>The required columns are <code>email</code>, <code>companyId</code>, and <code>notificationDate</code>. All other columns are optional.</li>
                                <li>You can optionally pre-fill other assessment data like <code>finalDate</code> or <code>severanceAgreementDeadline</code> to streamline the process for your employees.</li>
                                <li>To provide user-specific contacts, use the <code>preEndDateContactAlias</code> and <code>postEndDateContactAlias</code> columns. These will override the company-wide defaults set in your Company Settings.</li>
                                <li>If you upload a CSV with an email that already exists for a non-invited user, the system will update that user's record with the new data from the CSV.</li>
                                <li>
                                    <h4 className="!mt-6 !mb-2">CSV Column Reference</h4>
                                    <p className="!m-0">The following table details the available columns in the user upload template. Remember, all dates must be in <strong>YYYY-MM-DD</strong> format.</p>
                                    <div className="overflow-x-auto">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Column Header</th>
                                                    <th>Required?</th>
                                                    <th>Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td><code>email</code></td>
                                                    <td><strong>Yes</strong></td>
                                                    <td>The employee's primary work email address. This is used for login identification.</td>
                                                </tr>
                                                <tr>
                                                    <td><code>companyId</code></td>
                                                    <td><strong>Yes</strong></td>
                                                    <td>The employee's unique ID within your company's system.</td>
                                                </tr>
                                                <tr>
                                                    <td><code>notificationDate</code></td>
                                                    <td><strong>Yes</strong></td>
                                                    <td>The date the employee was officially notified of their exit. e.g., <code>2025-08-15</code></td>
                                                </tr>
                                                <tr>
                                                    <td><code>personalEmail</code></td>
                                                    <td>No</td>
                                                    <td>The employee's personal email address (optional but recommended).</td>
                                                </tr>
                                                <tr>
                                                    <td><code>finalDate</code></td>
                                                    <td>No</td>
                                                    <td>The employee's final day of employment. e.g., <code>2025-08-31</code></td>
                                                </tr>
                                                <tr>
                                                    <td><code>severanceAgreementDeadline</code></td>
                                                    <td>No</td>
                                                    <td>The deadline for the employee to sign their severance agreement. e.g., <code>2025-09-14</code></td>
                                                </tr>
                                                <tr>
                                                    <td><code>medicalCoverageEndDate</code></td>
                                                    <td>No</td>
                                                    <td>The last day of the employee's medical insurance coverage. e.g., <code>2025-08-31</code></td>
                                                </tr>
                                                <tr>
                                                    <td><code>dentalCoverageEndDate</code></td>
                                                    <td>No</td>
                                                    <td>The last day of the employee's dental insurance coverage. e.g., <code>2025-08-31</code></td>
                                                </tr>
                                                <tr>
                                                    <td><code>visionCoverageEndDate</code></td>
                                                    <td>No</td>
                                                    <td>The last day of the employee's vision insurance coverage. e.g., <code>2025-08-31</code></td>
                                                </tr>
                                                <tr>
                                                    <td><code>eapCoverageEndDate</code></td>
                                                    <td>No</td>
                                                    <td>The last day of the employee's EAP coverage. e.g., <code>2025-11-30</code></td>
                                                </tr>
                                                <tr>
                                                    <td><code>preEndDateContactAlias</code></td>
                                                    <td>No</td>
                                                    <td>Overrides the default company contact alias for this user *before* their end date.</td>
                                                </tr>
                                                <tr>
                                                    <td><code>postEndDateContactAlias</code></td>
                                                    <td>No</td>
                                                    <td>Overrides the default company contact alias for this user *after* their end date.</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </li>
                            </ul>
                        </li>
                        <li><strong>Sending Invitations:</strong> Users can only log in after their "Notification Date" has passed and an invitation has been sent. You can send invitations individually or select multiple users and use the "Send Invites" bulk action. In this prototype, no actual email is sent; this action simply marks the user as "Invited" and allows them to log in.</li>
                    </ul>

                    <h2>2. Form Editor (Pro Feature)</h2>
                    <p>
                        The Form Editor allows you to customize the "Exit Details" assessment to match your company's specific needs and terminology.
                    </p>
                    <ul>
                        <li><strong>Enabling/Disabling Questions:</strong> You can toggle any master question on or off for your company's assessment using the checkbox.</li>
                        <li><strong>Editing Questions:</strong> Click the "Edit" button to change the text, options, or default value of a master question. This creates an "override" for your company.</li>
                        <li><strong>Update Notifications:</strong> If a Platform Admin updates a master question that you have overridden, a <code className="font-mono">BellDot</code> icon will appear next to it, alerting you to the change. You can then choose to apply the update.</li>
                        <li><strong>Adding Custom Questions:</strong> Add new questions that are specific to your company by clicking the "Add Custom Question" button. These will only appear in your company's assessment.</li>
                        <li><strong>Adding Sub-Questions:</strong> For questions with options (like Radio or Checkbox), you can add conditional sub-questions that only appear when a specific option is chosen by the user.</li>
                    </ul>
                    
                    <h2>3. Assessment Analytics</h2>
                    <p>
                        The Analytics page provides valuable insight into where your employees may be struggling or lack information during the offboarding process. The dashboard displays the questions that your employees have most frequently answered with "Unsure". This can help you identify areas where your offboarding communication or resources could be improved.
                    </p>

                    <h2>4. Resources & Support</h2>
                    <h3>Company Resources</h3>
                    <p>
                        Here you can upload and manage documents that will be available to all of your exiting employees in their dashboard's "Resources" section. This is a great place for:
                    </p>
                    <ul>
                        <li>Benefits continuation guides (COBRA, etc.)</li>
                        <li>Company policies (e.g., PTO payout)</li>
                        <li>Contact lists for HR or benefits administrators</li>
                    </ul>
                    <h3>External Resources</h3>
                    <p>
                        Your employees also have access to a directory of external professionals (e.g., financial advisors, lawyers) that are curated and managed by the platform administrator. This provides an additional layer of support for your employees.
                    </p>

                    <h2>5. Company Settings</h2>
                    <p>
                        Manage your company's subscription plan and default settings. Your platform administrator sets the initial values for contacts and deadlines when creating the company.
                    </p>
                    <ul>
                        <li><strong>Plan & Usage:</strong> View your current plan (Basic or Pro) and see how many user licenses you have used.</li>
                        <li><strong>Contact & Deadline Defaults:</strong> Set the default contact aliases and severance agreement deadline time/timezone for all users in your company. The aliases you set here will be shown to users unless you provide a user-specific override in a CSV upload.</li>
                    </ul>

                    <h2>6. User Preview Mode</h2>
                    <p>
                        To see the platform exactly as an end-user would, use the "View as User" option in the header dropdown menu. This is crucial for quality control and ensuring the experience is clear and helpful. In this mode, any profile or assessment data you enter is kept separate from your HR account and can be cleared at any time. To return to your HR view, simply open the dropdown again and select "Return to HR View."
                    </p>
                </article>
            </div>
        </div>
    );
}
