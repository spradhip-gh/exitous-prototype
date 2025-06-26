'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// In a real app, this would be fetched from a database or a config file
const allQuestions = [
    // Work & Employment Details
    { id: 'workStatus', label: 'Which best describes your work status?', section: "Work & Employment Details" },
    { id: 'startDate', label: 'What day did you begin work?', section: "Work & Employment Details" },
    { id: 'notificationDate', label: 'On what date were you notified you were being laid off?', section: "Work & Employment Details" },
    { id: 'finalDate', label: 'What is your final date of employment?', section: "Work & Employment Details" },
    { id: 'workState', label: 'What state was your work based in?', section: "Work & Employment Details" },
    // Work Circumstances
    { id: 'relocationPaid', label: 'Did the company pay for you to relocate?', section: "Work Circumstances" },
    { id: 'unionMember', label: 'Did you belong to a union?', section: "Work Circumstances" },
    { id: 'workArrangement', label: 'Which best describes your work arrangement?', section: "Work Circumstances" },
    { id: 'workVisa', label: 'Were you on any of these work visas?', section: "Work Circumstances" },
    { id: 'onLeave', label: 'Are you currently on any of the following types of leave?', section: "Work Circumstances" },
    // Systems & Benefits Access
    { id: 'accessSystems', label: 'Which internal work systems do you still have access to?', section: "Systems & Benefits Access" },
    { id: 'hadMedicalInsurance', label: 'Did you have medical insurance through the company?', section: "Systems & Benefits Access" },
    { id: 'hadDentalInsurance', label: 'Did you have dental insurance through the company?', section: "Systems & Benefits Access" },
    { id: 'hadVisionInsurance', label: 'Did you have vision insurance through the company?', section: "Systems & Benefits Access" },
    { id: 'hadEAP', label: 'Did you have access to the Employee Assistance Program (EAP)?', section: "Systems & Benefits Access" },
];

export default function FormEditorPage() {
    const { toast } = useToast();

    const handleSave = () => {
        toast({
            title: "Configuration Saved",
            description: "Your assessment question settings have been updated.",
        });
    };

    const groupedQuestions = allQuestions.reduce((acc, q) => {
        if (!acc[q.section]) {
            acc[q.section] = [];
        }
        acc[q.section].push(q);
        return acc;
    }, {} as Record<string, typeof allQuestions>);

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">Assessment Question Editor</h1>
                    <p className="text-muted-foreground">
                        As an HR Manager, you can select which questions appear in the layoff assessment form for end-users.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Questions</CardTitle>
                        <CardDescription>
                            Check the box next to a question to include it in the assessment. Unchecking it will hide it from users.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {Object.entries(groupedQuestions).map(([section, questions]) => (
                            <div key={section}>
                                <h3 className="font-semibold mb-4 text-lg">{section}</h3>
                                <div className="space-y-4">
                                {questions.map((question) => (
                                    <div key={question.id} className="flex items-center space-x-3">
                                        <Checkbox id={question.id} defaultChecked />
                                        <Label htmlFor={question.id} className="font-normal text-sm">
                                            {question.label}
                                        </Label>
                                    </div>
                                ))}
                                </div>
                                <Separator className="my-6" />
                            </div>
                        ))}

                    </CardContent>
                </Card>
                 <Button onClick={handleSave} className="w-full">
                    Save Configuration
                </Button>
            </div>
        </div>
    );
}
