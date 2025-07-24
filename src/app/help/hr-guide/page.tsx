
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Key, Users, Users2 } from "lucide-react";

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

                    <h2><Users className="inline-block -mt-1 mr-2" /> User Management</h2>
                    <p>
                        This is your central hub for managing the list of exiting employees for your company. <em>(Requires at least Invite Only permission).</em>
                    </p>
                    <ul>
                        <li><strong>Adding Users Manually:</strong> <em>(Requires Write permission).</em> Use the "Add New User" form to add employees one by one. You must provide their Work Email, Company ID, and Notification Date. The Personal Email is optional but recommended.</li>
                        <li><strong>Bulk Upload via CSV:</strong> <em>(Requires Write & Upload permission).</em> For adding multiple users at once, the CSV upload is a powerful tool.
                            <ul>
                                <li>Download the template to see all available columns and a sample row.</li>
                                <li>The required columns are <code>email</code>, <code>companyId</code>, and <code>notificationDate</code>. All other columns are optional.</li>
                                <li>You can optionally pre-fill other assessment data like <code>finalDate</code> or <code>severanceAgreementDeadline</code> to streamline the process for your employees.</li>
                                <li>To provide user-specific contacts, use the <code>preEndDateContactAlias</code> and <code>postEndDateContactAlias</code> columns. These will override the company-wide defaults set in your Company Settings.</li>
                                <li>If you upload a CSV with an email that already exists for a non-invited user, the system will update that user's record with the new data from the CSV.</li>
                            </ul>
                        </li>
                        <li><strong>Sending Invitations:</strong> Users can only log in after their "Notification Date" has passed and an invitation has been sent. You can send invitations individually or select multiple users and use the "Send Invites" bulk action. In this prototype, no actual email is sent; this action simply marks the user as "Invited" and allows them to log in.</li>
                        <li><strong>Editing & Deleting Users:</strong> <em>(Requires Write permission).</em> You can edit a user's notification date and personal email, or permanently delete them from the list.</li>
                    </ul>

                     <h2><Users2 className="inline-block -mt-1 mr-2" />HR Team Management (Primary HR)</h2>
                     <p>
                        As a <strong>Primary HR Manager</strong>, you have the ability to manage your own team's access to the companies you oversee. You can add other HR managers and assign them specific, granular permissions on a per-company basis.
                    </p>
                    <ul>
                        <li><strong>Adding HR Managers:</strong> Use the "Add New HR Manager" form. Provide the new manager's email and select which of your companies they should have access to.</li>
                        <li><strong>Assigning Permissions:</strong> For each company you assign, you can set a specific permission level for different areas of the application:
                            <ul>
                                <li><strong>User Management:</strong>
                                    <ul>
                                        <li><code>Read Only</code>: Can view the user list but cannot add, edit, or invite.</li>
                                        <li><code>Invite Only</code>: Can view the list and send invitations, but cannot add or edit users.</li>
                                        <li><code>Write</code>: Can view, invite, add, and edit users, but cannot use the CSV upload.</li>
                                        <li><code>Write & Upload</code>: Full access, including CSV bulk upload.</li>
                                    </ul>
                                </li>
                                <li><strong>Form Editor:</strong>
                                     <ul>
                                        <li><code>Read Only</code>: Can view the form configuration but cannot make changes.</li>
                                        <li><code>Write</code>: Can enable/disable questions, edit text, and add custom questions.</li>
                                     </ul>
                                </li>
                                 <li><strong>Resources:</strong>
                                     <ul>
                                        <li><code>Read Only</code>: Can view company resources but cannot upload or delete them.</li>
                                        <li><code>Write</code>: Can upload and delete resources.</li>
                                     </ul>
                                </li>
                                 <li><strong>Company Settings:</strong>
                                     <ul>
                                        <li><code>Read Only</code>: Can view the company settings.</li>
                                        <li><code>Write</code>: Can edit the company settings.</li>
                                     </ul>
                                </li>
                            </ul>
                        </li>
                        <li><strong>Editing Permissions:</strong> You can edit a non-primary HR manager's permissions at any time by clicking the pencil icon next to their name in the HR Team Management page.</li>
                    </ul>

                    <h2><Key className="inline-block -mt-1 mr-2" />Managing Companies & Permissions</h2>
                    <p>
                        Your access level is determined on a per-company basis. You can easily see your current role and switch between companies if you are assigned to more than one.
                    </p>
                    <ul>
                        <li><strong>Switching Companies:</strong> If you manage multiple companies, a company switcher will appear in the user menu at the top-right. Select a company from the list to change your active view. All management pages will update to reflect the selected company's data.</li>
                        <li><strong>Viewing Your Permissions:</strong> To see your current permissions for the active company, click on the user menu. A "Permissions" section will detail your access level for each area of the platform.</li>
                    </ul>

                    <h2>Form Editor (Pro Feature)</h2>
                    <p>
                        The Form Editor allows you to customize the "Exit Details" assessment to match your company's specific needs and terminology. <em>(Requires Write permission).</em>
                    </p>
                    <ul>
                        <li><strong>Enabling/Disabling Questions:</strong> You can toggle any master question on or off for your company's assessment using the checkbox.</li>
                        <li><strong>Editing Questions:</strong> Click the "Edit" button to change the text, options, or default value of a master question. This creates an "override" for your company.</li>
                        <li><strong>Update Notifications:</strong> If a Platform Admin updates a master question that you have overridden, a <code className="font-mono">BellDot</code> icon will appear next to it, alerting you to the change. You can then choose to apply the update.</li>
                        <li><strong>Adding Custom Questions:</strong> Add new questions that are specific to your company by clicking the "Add Custom Question" button. These will only appear in your company's assessment.</li>
                    </ul>
                    
                    <h2>Assessment Analytics</h2>
                    <p>
                        The Analytics page provides valuable insight into where your employees may be struggling or lack information during the offboarding process. The dashboard displays the questions that your employees have most frequently answered with "Unsure".
                    </p>

                    <h2>Resources & Support</h2>
                    <h3>Company Resources</h3>
                    <p>
                        Here you can upload and manage documents that will be available to all of your exiting employees in their dashboard's "Resources" section. <em>(Requires Write permission to upload/delete).</em> You and your users can view the content of these documents directly in the application.
                    </p>
                    <ul>
                        <li>Benefits continuation guides (COBRA, etc.)</li>
                        <li>Company policies (e.g., PTO payout)</li>
                        <li>Contact lists for HR or benefits administrators</li>
                    </ul>

                    <h2>Company Settings</h2>
                    <p>
                        Manage your company's subscription plan and default settings. Note that only Primary HR Managers have write access to these settings.
                    </p>
                    <ul>
                        <li><strong>Plan & Usage:</strong> View your current plan (Basic or Pro) and see how many user licenses you have used.</li>
                        <li><strong>Contact & Deadline Defaults:</strong> Set the default contact aliases and severance agreement deadline time/timezone for all users in your company.</li>
                    </ul>

                    <h2>User Preview Mode</h2>
                    <p>
                        To see the platform exactly as an end-user would, use the "View as User" option in the header dropdown menu. This is crucial for quality control and ensuring the experience is clear and helpful. In this mode, any profile or assessment data you enter is kept separate from your HR account and can be cleared at any time. To return to your HR view, simply open the dropdown again and select "Return to HR View."
                    </p>
                </article>
            </div>
        </div>
    );
}
