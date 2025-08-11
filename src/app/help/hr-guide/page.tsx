
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Key, Users, Users2, BarChart } from "lucide-react";

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
                        <li><strong>Adding Users Manually:</strong> <em>(Requires Write permission).</em> Use the "Add New User" form to add employees one by one. You must provide their Work Email, Company ID, and Notification Date.</li>
                        <li><strong>Bulk Upload via Excel:</strong> <em>(Requires Write & Upload permission).</em> For adding multiple users at once, download the Excel template. It includes a tab with detailed instructions for each column and a separate tab for you to fill in with your user data. You can pre-fill key assessment dates and even custom contact aliases for individual users to override the company defaults.</li>
                        <li><strong>Sending Invitations:</strong> Users can only log in after their "Notification Date" has passed and an invitation has been sent. You can send invitations individually or in bulk.</li>
                    </ul>

                     <h2><Users2 className="inline-block -mt-1 mr-2" />HR Team Management (Primary HR)</h2>
                     <p>
                        As a <strong>Primary HR Manager</strong>, you can manage your own team's access to the companies you oversee from the HR Management page. You can add other HR managers and assign them specific, granular permissions for User Management, the Form Editor, Resources, and Company Settings.
                    </p>

                    <h2>Form Editor (Pro Feature)</h2>
                    <p>
                        The Form Editor allows you to customize the "Exit Details" assessment to match your company's needs. You can also create company-specific tasks and tips and view your submitted suggestions.
                    </p>
                    <ul>
                        <li><strong>Enabling/Disabling Questions:</strong> You can toggle any master question on or off for your company's assessment.</li>
                        <li><strong>Editing & Suggesting Changes:</strong> You can edit unlocked questions directly. For locked questions, you can suggest edits (like adding or removing answers) which are then sent to an Admin for approval.</li>
                        <li><strong>Adding Custom Questions & Guidance:</strong> Add new questions that are specific to your company. When you create a custom question or add a custom answer, you can use the "Guidance" button to map company-specific tasks and tips to it.</li>
                        <li><strong>Company Tasks & Tips:</strong> Use the dedicated tabs to create and manage a library of tasks and tips that are only available to your company.</li>
                        <li><strong>My Suggestions:</strong> This tab shows a history of all the suggestions you've submitted for review and their current status (Pending, Approved, or Rejected).</li>
                    </ul>
                    
                    <h2><BarChart className="inline-block -mt-1 mr-2" /> Analytics</h2>
                    <p>
                        The analytics page provides insights into your employees' initial assessment responses. It highlights the questions that were most frequently answered with "I'm not sure," helping you identify areas where communication or the questions themselves could be clearer.
                    </p>

                    <h2>Company Resources & Settings</h2>
                    <h3>Resources</h3>
                    <p>
                        Here you can upload and manage documents (e.g., benefits guides, policies) that will be available to all of your exiting employees in their dashboard's "Resources" section. <em>(Requires Write permission to upload/delete).</em>
                    </p>
                    <h3>Company Settings</h3>
                    <p>
                        Manage your company's plan and default settings. Note that only Primary HR Managers have write access to these settings. Here you can set default contact aliases and severance agreement deadline time/timezones.
                    </p>

                    <h2>User Preview Mode</h2>
                    <p>
                        To see the platform exactly as an end-user would, use the "View as User" option in the header dropdown menu. This is crucial for quality control. To return to your HR view, simply open the dropdown again and select "Return to HR View."
                    </p>
                </article>
            </div>
        </div>
    );
}
