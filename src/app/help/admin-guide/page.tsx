
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
                        This is the heart of the platform's assessment tool. As an Admin, you control the "source of truth" for all questions that can be presented to an end-user.
                    </p>
                    <ul>
                        <li><strong>Editing Questions:</strong> You can modify the text, type, and options of any question in the master list. Be aware that these changes will be flagged to HR Managers who may have overridden that question, prompting them to review and accept the update.</li>
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
                        <li><strong>Editing Companies:</strong> You can adjust a company's user limit and other settings after it has been created.</li>
                        <li><strong>Upgrading to Pro:</strong> You can upgrade a company from Basic to Pro at any time, which unlocks the Form Editor feature for their HR Manager.</li>
                        <li><strong>Exporting Data:</strong> A CSV export of all companies and their key statistics (user counts, version, etc.) is available.</li>
                    </ul>
                     <h3>User Management (Admin View)</h3>
                    <p>
                        While HR Managers handle their own users, you have a global view. You can select any company and see its list of end-users, add new users, or remove existing ones. This is useful for support or initial setup.
                    </p>

                    <h2>3. Platform User Management</h2>
                    <p>
                        Here, you can grant or revoke access for other high-level users of the ExitBetter platform.
                    </p>
                    <ul>
                        <li><strong>Roles:</strong> You can add users with either the 'Admin' or 'Consultant' role.</li>
                        <li><strong>Access Control:</strong> You can remove access for any platform user except yourself.</li>
                    </ul>
                    
                    <h2>4. Export User Data</h2>
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
