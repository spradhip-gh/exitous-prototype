
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function AdminGuidePage() {
    return (
        <div className="w-full bg-background">
            <div className="container mx-auto py-12 px-4">
                <article className="prose lg:prose-xl max-w-4xl mx-auto">
                    <h1>Platform Admin Guide</h1>
                    <p className="lead">
                        Welcome, Admin! This guide outlines your role in managing the entire ExitBetter platform, from onboarding new companies to maintaining the core question library.
                    </p>

                    <h2>1. Master Form Editor</h2>
                    <p>
                        This is the heart of the platform's assessment tool. As an Admin, you control the "source of truth" for all questions that can be presented to an end-user. The editor is now tabbed for easier navigation between "Profile" and "Assessment" questions.
                    </p>
                    <ul>
                        <li><strong>Editing Questions:</strong> You can modify the text, type, and options of any question in the master list. Be aware that these changes will be flagged to HR Managers who may have overridden that question, prompting them to review and accept the update.</li>
                        <li><strong>Adding Tooltips:</strong> You can add a helpful description (tooltip) to any question to provide context or clarification for the user.</li>
                        <li><strong>Adding Questions:</strong> New questions added here will become available to all companies. They can then choose to enable or disable them in their own form editor.</li>
                        <li><strong>Reordering Questions:</strong> You can drag and drop questions to change their default display order within a section.</li>
                        <li><strong>Deleting Questions:</strong> Deleting a master question will remove it from the platform entirely. It will no longer be available for any company. This action cannot be undone.</li>
                    </ul>

                    <h2>2. Customer Management</h2>
                    <p>
                        This section allows you to manage all client companies on the platform.
                    </p>
                    <h3>Company Management</h3>
                    <ul>
                        <li><strong>Adding Companies:</strong> You can onboard a new company by providing its name, assigning an HR Manager's email, setting a user limit, and choosing a subscription tier (Basic or Pro).</li>
                        <li><strong>Editing Company Details:</strong> From the company list, you can click the "Edit" pencil icon to open a dialog where you can manage that company's settings, HR team, and plan.</li>
                        <li><strong>Managing HR Teams:</strong> Within the edit dialog, you can add new HR managers to a company, remove existing ones, and set a "Primary Manager". The Primary Manager has full permissions for that company.</li>
                        <li><strong>Upgrading to Pro:</strong> You can upgrade a company from Basic to Pro at any time, which unlocks the Form Editor feature for their HR Manager.</li>
                        <li><strong>Exporting Data:</strong> A CSV export of all companies and their key statistics (user counts, version, etc.) is available.</li>
                    </ul>
                     <h3>User Management (Admin View)</h3>
                    <p>
                        While HR Managers handle their own users, you have a global view. You can select any company and see its list of end-users, add new users, or remove existing ones. This is useful for support or initial setup.
                    </p>

                    <h2>3. External Resources Management</h2>
                    <p>
                        This page allows you to curate the directory of professional services and companies that are recommended to users. Maintaining a high-quality, relevant list of resources is key to the platform's value.
                    </p>
                    <ul>
                        <li><strong>Adding & Editing Resources:</strong> You can add new partners or edit existing ones. Key fields include the resource's name, category, description, and website.</li>
                        <li><strong>Verification & Offers:</strong> You can mark a resource as "Exitous Verified" to build user trust, and you can add a "Special Offer" to highlight exclusive deals for your users.</li>
                        <li><strong>AI Matching Keywords:</strong> The <code>relatedTaskIds</code> field is critical. It links a resource directly to one or more AI-generated task IDs (e.g., 'review-severance-agreement'). This allows the system to automatically recommend the right professional for a specific user need.</li>
                    </ul>
                    
                    <h2>4. Assessment Analytics</h2>
                    <p>
                        This page gives you high-level insights into how employees across the entire platform are interacting with the assessment, helping you identify common areas of confusion or concern.
                    </p>
                    <ul>
                        <li><strong>Top "Unsure" Answers:</strong> The main dashboard shows a chart and table of the questions that users most frequently answer with "Unsure". This can indicate that a question is confusing or that users lack the information to answer it.</li>
                        <li><strong>Company Drill-Down:</strong> As an admin, you can click on any bar in the chart or any row in the table to open a dialog showing a company-by-company breakdown for that specific question. This helps you identify if confusion is widespread or concentrated within a specific client.</li>
                    </ul>

                    <h2>5. Platform User Management</h2>
                    <p>
                        Here, you can grant or revoke access for other high-level users of the ExitBetter platform.
                    </p>
                    <ul>
                        <li><strong>Roles:</strong> You can add users with either the 'Admin' or 'Consultant' role.</li>
                        <li><strong>Access Control:</strong> You can remove access for any platform user except yourself.</li>
                    </ul>
                    
                    <h2>6. Export User Data</h2>
                    <p>
                        This powerful feature provides a comprehensive export of every single user on the platform.
                    </p>
                    <ul>
                        <li><strong>Combined List:</strong> The export includes End-Users, HR Managers, and Platform Admins/Consultants in a single CSV file.</li>
                        <li><strong>Key Statuses:</strong> For end-users, the export includes their invitation status and their progress on the profile and assessment, giving you a complete overview of platform engagement.</li>
                    </ul>

                </article>
            </div>
        </div>
    );
}
