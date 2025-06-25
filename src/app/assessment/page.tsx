import Header from '@/components/common/Header';
import AssessmentForm from '@/components/assessment/AssessmentForm';

export default function AssessmentPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h1 className="font-headline text-3xl font-bold">Emotional Assessment</h1>
            <p className="text-muted-foreground">
              Let's check in on how you're feeling. This helps us understand what kind of support you might need right now.
            </p>
          </div>
          <AssessmentForm />
        </div>
      </main>
    </div>
  );
}
