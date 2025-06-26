'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, UserRole } from '@/hooks/use-auth';
import { User, Briefcase, UserCheck, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUserData } from '@/hooks/use-user-data';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { setRole, login } = useAuth();
  const { getAllCompanyConfigs } = useUserData();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEndUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const allConfigs = getAllCompanyConfigs();
    let foundUser = false;

    for (const companyName in allConfigs) {
        const company = allConfigs[companyName];
        if (company.users) {
            const user = company.users.find(
                u => u.email.toLowerCase() === email.toLowerCase() && u.companyId === companyId
            );
            if (user) {
                login(user.email, user.companyId, companyName);
                foundUser = true;
                break;
            }
        }
    }

    setTimeout(() => {
        setIsLoading(false);
        if (!foundUser) {
            toast({
                title: "Login Failed",
                description: "Invalid email or Company ID. Please check your credentials.",
                variant: "destructive"
            });
        }
    }, 500);
  };
  
  const handleSelectRole = (role: UserRole) => {
    setRole(role);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center font-headline text-2xl">Welcome to Layoff Compass</CardTitle>
        <CardDescription className="text-center">Please select your role to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="end-user" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="end-user">
                    <User className="mr-2 h-4 w-4"/> User
                </TabsTrigger>
                <TabsTrigger value="hr">
                    <Briefcase className="mr-2 h-4 w-4"/> HR
                </TabsTrigger>
                <TabsTrigger value="consultant">
                    <UserCheck className="mr-2 h-4 w-4"/> Consultant
                </TabsTrigger>
                 <TabsTrigger value="admin">
                    <Shield className="mr-2 h-4 w-4"/> Admin
                </TabsTrigger>
            </TabsList>
            <TabsContent value="end-user" className="pt-6">
                <form onSubmit={handleEndUserLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="companyId">Company ID</Label>
                        <Input id="companyId" placeholder="Your Company ID #" value={companyId} onChange={e => setCompanyId(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="animate-spin mr-2" />}
                        Login as End User
                    </Button>
                </form>
            </TabsContent>
             <TabsContent value="hr" className="pt-6">
                 <p className="text-center text-sm text-muted-foreground mb-4">Continue to the HR administration panel.</p>
                <Button onClick={() => handleSelectRole('hr')} className="w-full" size="lg">
                    Continue as HR Manager
                </Button>
            </TabsContent>
            <TabsContent value="consultant" className="pt-6">
                 <p className="text-center text-sm text-muted-foreground mb-4">Continue to the consultant review dashboard.</p>
                <Button onClick={() => handleSelectRole('consultant')} className="w-full" size="lg">
                    Continue as Consultant
                </Button>
            </TabsContent>
             <TabsContent value="admin" className="pt-6">
                 <p className="text-center text-sm text-muted-foreground mb-4">Continue to the master administration panel.</p>
                <Button onClick={() => handleSelectRole('admin')} className="w-full" size="lg">
                    Continue as Admin
                </Button>
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
