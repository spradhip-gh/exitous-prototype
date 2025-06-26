import ReviewDashboard from '@/components/admin/ReviewDashboard';

export default function ReviewPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
            <h1 className="font-headline text-3xl font-bold">Recommendation Review Queue</h1>
            <p className="text-muted-foreground">
                As a Consultant, you can review, approve, or suggest edits to the AI-generated recommendations before they reach the end-user.
            </p>
        </div>
        <ReviewDashboard />
      </div>
    </div>
  );
}
