
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function UserGuidePage() {
    return (
        <div className="w-full bg-background">
            <div className="container mx-auto py-12 px-4">
                <article className="prose lg:prose-xl max-w-4xl mx-auto">
                    <h1>End-User Guide</h1>
                    <p className="lead">
                        Welcome to ExitBetter. We know this is a challenging time, and this platform is designed to give you clear, personalized guidance. This guide will help you get the most out of it.
                    </p>

                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Your Data is Private</AlertTitle>
                        <AlertDescription>
                            All the information you enter in your Profile and Exit Details is stored securely on your own device and is not shared. It is used only to generate your personalized recommendations.
                        </AlertDescription>
                    </Alert>

                    <h2>1. Your Dashboard: The Command Center</h2>
                    <p>
                        The main dashboard is your primary view. At first, it will show you a progress tracker. Once you complete your Profile and Exit Details, it will transform into a personalized timeline.
                    </p>
                    <ul>
                        <li><strong>Key Dates Timeline:</strong> This visual timeline at the top gives you an at-a-glance overview of your most critical deadlines, like your final day of employment and when benefits coverage ends.</li>
                        <li><strong>Personalized Next Steps:</strong> This is an AI-generated list of tasks and helpful tips, sorted by urgency, to help you navigate your exit. You can check items off as you complete them to track your progress.</li>
                        <li><strong>Add Custom Dates:</strong> You can add your own personal deadlines or reminders to the timeline, such as "Follow up with recruiter," to keep all your important dates in one place.</li>
                    </ul>

                    <h2>2. Profile & Exit Details</h2>
                    <p>
                        To unlock your personalized timeline, you need to complete two forms:
                    </p>
                    <ul>
                        <li><strong>Your Profile:</strong> This form asks about your personal circumstances (e.g., family, location). This context helps the AI provide more relevant advice.</li>
                        <li><strong>Exit Details:</strong> This form captures the specifics of your departure from the company (e.g., key dates, insurance status). Some of this information may be pre-filled by your HR Manager.</li>
                    </ul>
                    <p>
                        You can return to these forms at any time from the sidebar navigation to update your information if anything changes.
                    </p>

                    <h2>3. Getting Help: Resources</h2>
                    <p>
                        The platform provides two types of resources to help you.
                    </p>
                    <h3>Company Resources</h3>
                    <p>
                        This page contains documents and links uploaded specifically by your HR manager. You can view the content directly in the app or download the files. It's a great place to find things like official benefits summaries, company policies, or specific contact information. It also shows you who your primary contact at the company is.
                    </p>
                    <h3>External Resources</h3>
                    <p>
                        This is a directory of vetted professionals and services that can provide expert help.
                    </p>
                    <ul>
                        <li><strong>Your Top Matches:</strong> Based on your profile, the AI will recommend the most relevant experts for your situation.</li>
                        <li><strong>Connect with a Professional:</strong> On your main timeline, you'll see a "Connect" button on certain tasks. This will take you directly to the profile of a relevant expert or a filtered list of them.</li>
                        <li><strong>Browse & Filter:</strong> You can also search the entire directory and filter by category (e.g., Finances, Legal) to find the help you need.</li>
                    </ul>

                    <h2>4. Account Settings & Starting Over</h2>
                    <p>
                        From the sidebar navigation, you can go to **Account Settings** to update your primary email address and timezone preference. If you need to clear all your entered data and start the process again, you can click on your email in the top-right corner of the page and select **Start Over**.
                    </p>

                </article>
            </div>
        </div>
    );
}
