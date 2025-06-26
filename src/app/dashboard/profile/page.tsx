import ProfileForm from '@/components/profile/ProfileForm';

export default function ProfilePage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-headline text-3xl font-bold">Create Your Profile</h1>
          <p className="text-muted-foreground">
            Your answers help us create a personalized roadmap for you. All information is stored securely on your device.
          </p>
        </div>
        <ProfileForm />
      </div>
    </div>
  );
}
