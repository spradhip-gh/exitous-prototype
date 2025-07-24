

'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { User, Briefcase, UserCheck, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUserData } from '@/hooks/use-user-data';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { getAllCompanyConfigs, getCompaniesForHr, getPlatformUserRole, companyAssignments } = useUserData();
  const { toast } = useToast();
  
  const [endUserEmail, setEndUserEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [platformUserEmail, setPlatformUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEndUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const allConfigs = getAllCompanyConfigs();
    let companyNameForUser = '';

    for (const companyName in allConfigs) {
        const company = allConfigs[companyName];
        if (company.users) {
            const user = company.users.find(
                u => u.email.toLowerCase() === endUserEmail.toLowerCase() && u.companyId === companyId
            );
            if (user && user.notified) {
                companyNameForUser = companyName;
                break;
            }
        }
    }

    setTimeout(() => {
        setIsLoading(false);
        if (companyNameForUser) {
            login({ role: 'end-user', email: endUserEmail, companyId: companyId }, [{ companyName: companyNameForUser, companyConfigs: { [companyNameForUser]: allConfigs[companyNameForUser] } }] as any);
        } else {
            toast({
                title: "Login Failed",
                description: "Invalid email, Company ID, or you have not been invited yet.",
                variant: "destructive"
            });
        }
    }, 500);
  };
  
  const handleHrLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const assignedCompanies = getCompaniesForHr(hrEmail);

    setTimeout(() => {
        setIsLoading(false);
        if (assignedCompanies.length > 0) {
            login({ role: 'hr', email: hrEmail }, companyAssignments);
        } else {
            toast({
                title: "Login Failed",
                description: "This email is not registered as an HR Manager for any company.",
                variant: "destructive"
            });
        }
    }, 500);
  }

  const handlePlatformLogin = (role: 'admin' | 'consultant') => (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const validatedRole = getPlatformUserRole(platformUserEmail);
    
    setTimeout(() => {
        setIsLoading(false);
        if (validatedRole === role) {
            login({ role: validatedRole, email: platformUserEmail }, []);
        } else {
            toast({
                title: "Login Failed",
                description: "This email is not registered for this role.",
                variant: "destructive"
            });
        }
    }, 500);
  }


  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center font-headline text-2xl">Welcome to ExitBetter</CardTitle>
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
                        <Input id="email" type="email" placeholder="you@company.com" value={endUserEmail} onChange={e => setEndUserEmail(e.target.value)} required />
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
                <form onSubmit={handleHrLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="hr-email">HR Manager Email</Label>
                        <Input id="hr-email" type="email" placeholder="hr.manager@company.com" value={hrEmail} onChange={e => setHrEmail(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="animate-spin mr-2" />}
                        Login as HR Manager
                    </Button>
                </form>
            </TabsContent>
            <TabsContent value="consultant" className="pt-6">
                 <form onSubmit={handlePlatformLogin('consultant')} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="consultant-email">Consultant Email</Label>
                        <Input id="consultant-email" type="email" placeholder="consultant@email.com" value={platformUserEmail} onChange={e => setPlatformUserEmail(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="animate-spin mr-2" />}
                        Login as Consultant
                    </Button>
                </form>
            </TabsContent>
             <TabsContent value="admin" className="pt-6">
                <form onSubmit={handlePlatformLogin('admin')} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="admin-email">Admin Email</Label>
                        <Input id="admin-email" type="email" placeholder="admin@email.com" value={platformUserEmail} onChange={e => setPlatformUserEmail(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="animate-spin mr-2" />}
                        Login as Admin
                    </Button>
                </form>
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
