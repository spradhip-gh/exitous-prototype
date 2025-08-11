
'use client';

import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Server, AlertTriangle, CheckCircle } from 'lucide-react';

const tablesToTest = [
    'companies',
    'platform_users',
    'company_hr_assignments',
    'company_users',
    'master_questions',
    'master_question_configs',
    'company_question_configs',
    'master_tasks',
    'master_tips',
    'guidance_rules',
    'review_queue',
    'external_resources',
];

type TableStatus = {
    name: string;
    status: 'pending' | 'success' | 'error';
    count?: number;
    error?: string;
};

export default function DebugPage() {
    const [tableStatuses, setTableStatuses] = useState<TableStatus[]>(
        tablesToTest.map(name => ({ name, status: 'pending' }))
    );

    useEffect(() => {
        const testTables = async () => {
            for (const tableName of tablesToTest) {
                try {
                    // Use service_role key to bypass RLS for this test
                    const { count, error } = await supabase
                        .from(tableName)
                        .select('id', { count: 'exact', head: true });
                    
                    if (error) {
                        throw new Error(error.message);
                    }

                    setTableStatuses(prev =>
                        prev.map(s => s.name === tableName ? { ...s, status: 'success', count: count ?? 0 } : s)
                    );

                } catch (e: any) {
                     setTableStatuses(prev =>
                        prev.map(s => s.name === tableName ? { ...s, status: 'error', error: e.message } : s)
                    );
                }
            }
        };

        testTables();
    }, []);

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-2xl space-y-6">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Database Connectivity Test</h1>
                    <p className="text-muted-foreground">
                        This page tests read access to each table to diagnose potential Row-Level Security (RLS) issues.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Table Read Status</CardTitle>
                        <CardDescription>
                            If any table shows an "ACCESS DENIED" error, it confirms that RLS policies are blocking the login process.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {tableStatuses.map(table => (
                            <div key={table.name} className="flex items-center justify-between rounded-md border p-3">
                                <div className="flex items-center gap-2">
                                    {table.status === 'pending' && <Skeleton className="h-5 w-5 rounded-full" />}
                                    {table.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                                    {table.status === 'error' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                                    <span className="font-mono text-sm">{table.name}</span>
                                </div>
                                <div>
                                    {table.status === 'pending' && <Skeleton className="h-5 w-24" />}
                                    {table.status === 'success' && <span className="text-sm text-green-700">OK ({table.count} rows)</span>}
                                    {table.status === 'error' && <span className="text-sm text-destructive">ACCESS DENIED</span>}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
