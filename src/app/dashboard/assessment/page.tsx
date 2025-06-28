import AssessmentForm from '@/components/assessment/AssessmentForm';

export default function AssessmentPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-headline text-3xl font-bold">Exit Details</h1>
          <p className="text-muted-foreground">
            Please provide details about your exit. This will help us create a personalized timeline and resource list for you.
          </p>
        </div>
        <AssessmentForm />
      </div>
    </div>
  );
}
