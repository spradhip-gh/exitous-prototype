
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
                        Welcome, Admin! This guide outlines your role in managing the entire ExitBetter platform, from onboarding new companies to maintaining the core content library.
                    </p>

                    <h2>1. Customer Management</h2>
                    <p>
                        This section allows you to manage all client companies and their high-level configurations.
                    </p>
                    <h3>Company Management</h3>
                    <ul>
                        <li><strong>Adding Companies:</strong> You can onboard a new company by providing its name, assigning a primary HR Manager, setting a user limit, and choosing a subscription tier (Basic or Pro).</li>
                        <li><strong>Editing Company Details:</strong> From the company list, you can click the "Edit" pencil icon to open a dialog where you can manage that company's settings, HR team, and plan.</li>
                        <li><strong>Managing HR Teams:</strong> Within the edit dialog, you can add new HR managers to a company, remove existing ones, and set a "Primary Manager". The Primary Manager has full permissions for that company.</li>
                        <li><strong>Upgrading to Pro:</strong> You can upgrade a company from Basic to Pro at any time, which unlocks advanced features for their HR Manager.</li>
                        <li><strong>Exporting Data:</strong> A CSV export of all companies and their key statistics (user counts, version, etc.) is available.</li>
                    </ul>
                     <h3>User Management (Admin View)</h3>
                    <p>
                        While HR Managers handle their own users, you have a global view. You can select any company and see its list of end-users, add new users, or remove existing ones. This is useful for support or initial setup.
                    </p>
                     <h3>Platform User Management</h3>
                    <p>
                        Here, you can grant or revoke access for other high-level users of the ExitBetter platform, such as other Admins or Consultants.
                    </p>

                    <h2>2. Content Management</h2>
                    <p>
                        As an Admin, you control the "source of truth" for all default content on the platform.
                    </p>
                    <h3>Master Form Editor</h3>
                    <p>This is the heart of the platform's assessment tool. The editor is tabbed for easier navigation between "Profile Questions," "Assessment Questions," and "Guidance Rules."</p>
                    <ul>
                        <li><strong>Editing Questions:</strong> You can modify the text, type, and options of any question in the master list. Be aware that these changes will be flagged to HR Managers who may have overridden that question, prompting them to review and accept the update.</li>
                        <li><strong>Adding Questions:</strong> New questions added here will become available to all companies. They can then choose to enable or disable them in their own form editor.</li>
                        <li><strong>Guidance Rules:</strong> This powerful editor allows you to create deterministic rules that assign specific tasks or tips when certain conditions are met (e.g., if a user's tenure is over 10 years, assign the "401k Review" task).</li>
                    </ul>
                     <h3>Task & Tip Management</h3>
                    <p>These pages allow you to create and manage the master lists of all possible user tasks and "Did you know..." tips. You can add items individually through a form or manage them in bulk by uploading a CSV file.</p>
                     <h3>External Resources Management</h3>
                    <p>This page allows you to curate the directory of professional services that are recommended to users. The <code>relatedTaskIds</code> field is critical for linking a resource to a specific task, enabling the "Connect with a Professional" feature.</p>

                    <h2>3. Review & Analytics</h2>
                    <h3>Guidance & Review Queue</h3>
                    <p>This is your queue for moderating content. You can review, approve, or reject suggestions submitted by HR Managers for locked questions and custom guidance mappings. This ensures platform-wide content quality and consistency.</p>
                    <h3>Assessment Analytics</h3>
                    <p>
                        This page gives you high-level insights into how employees across the entire platform are interacting with the assessment. You can see the questions most frequently answered with "Unsure" and drill down to see a company-by-company breakdown.
                    </p>

                    <h2>4. Data Export</h2>
                    <p>
                        This feature provides a comprehensive export of every single user on the platform, including End-Users, HR Managers, and Platform Admins/Consultants, along with their status and company affiliation.
                    </p>

                </article>
            </div>
        </div>
    );
}
