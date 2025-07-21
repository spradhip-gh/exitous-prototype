
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
                                <li>Download the template to see all available columns.</li>
                                <li>The required columns are <code>email</code>, <code>companyId</code>, and <code>notificationDate</code>.</li>
                                <li>You can optionally pre-fill other assessment data like <code>finalDate</code>, <code>severanceAgreementDeadline</code>, or contact aliases (<code>preLayoffContactAlias</code>, <code>postLayoffContactAlias</code>) to streamline the process for your employees. These user-specific aliases will override the company defaults you set in settings.</li>
                                <li>If you upload a CSV with an email that already exists for a non-invited user, the system will update that user's record with the new data from the CSV.</li>
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

                    <h2>3. Resources</h2>
                    <p>
                        Here you can upload and manage documents that will be available to all of your exiting employees in their dashboard's "Resources" section. This is a great place for:
                    </p>
                    <ul>
                        <li>Benefits continuation guides (COBRA, etc.)</li>
                        <li>Company policies (e.g., PTO payout)</li>
                        <li>Contact lists for HR or benefits administrators</li>
                    </ul>
                    <p>
                        Currently, the platform supports uploading text-based files.
                    </p>

                    <h2>4. Company Settings</h2>
                    <p>
                        Manage your company's subscription plan and default settings.
                    </p>
                    <ul>
                        <li><strong>Plan & Usage:</strong> View your current plan (Basic or Pro) and see how many user licenses you have used.</li>
                        <li><strong>Contact & Deadline Defaults:</strong> Set the default contact aliases and severance agreement deadline time/timezone. This ensures consistency and accuracy for all users. The aliases you set here will be shown to users unless you provide a user-specific override in a CSV upload.</li>
                    </ul>

                    <h2>5. User Preview Mode</h2>
                    <p>
                        To see the platform exactly as an end-user would, use the "View as User" option in the header dropdown menu. This is crucial for quality control and ensuring the experience is clear and helpful. In this mode, any profile or assessment data you enter is kept separate from your HR account and can be cleared at any time. To return to your HR view, simply open the dropdown again and select "Return to HR View."
                    </p>
                </article>
            </div>
        </div>
    );
}
