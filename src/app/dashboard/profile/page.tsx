
import ProfileForm from '@/components/profile/ProfileForm';

export default function ProfilePage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-headline text-3xl font-bold">Create Your Profile</h1>
          <p className="text-muted-foreground">
            Exits can be challenging and we are here to help. Your Answers help us create a personalized roadmap for you. All information entered in confidential and personal info is never shared
          </p>
        </div>
        <ProfileForm />
      </div>
    </div>
  );
}
