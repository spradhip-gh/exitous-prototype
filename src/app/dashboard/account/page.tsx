import AccountSettingsForm from '@/components/dashboard/AccountSettingsForm';

export default function AccountPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-headline text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account details and preferences.
          </p>
        </div>
        <AccountSettingsForm />
      </div>
    </div>
  );
}
