

'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import type { Question } from '@/lib/questions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface AnalyticsItem {
    questionId: string;
    questionLabel: string;
    count: number;
    companyCounts?: Record<string, number>;
}


export default function AnalyticsPage() {
  const { auth } = useAuth();
  const { getAllCompanyConfigs, getCompanyConfig, isUserDataLoading, masterQuestions, masterProfileQuestions } = useUserData();
  const companyName = auth?.companyName;
  const isAdmin = auth?.role === 'admin';
  const [selectedQuestion, setSelectedQuestion] = useState<AnalyticsItem | null>(null);

  const analyticsData = useMemo(() => {
    if (isUserDataLoading) return null;

    const allConfigs = getAllCompanyConfigs();
    const companiesToProcess = isAdmin ? Object.keys(allConfigs) : (companyName ? [companyName] : []);
    
    if (companiesToProcess.length === 0) return { overall: [], byCompany: [], companyKeys: [] };

    const allMasterQuestions: Record<string, Question> = { ...masterQuestions, ...masterProfileQuestions };

    const unsureCountsByCompany: Record<string, Record<string, number>> = {};

    for (const compName of companiesToProcess) {
        const companyConfig = allConfigs[compName];
        if (!companyConfig || !companyConfig.users) continue;
        
        for (const user of companyConfig.users) {
            if (user.initial_unsure_answers) {
                user.initial_unsure_answers.forEach(questionId => {
                    if (!unsureCountsByCompany[questionId]) {
                        unsureCountsByCompany[questionId] = {};
                    }
                    unsureCountsByCompany[questionId][compName] = (unsureCountsByCompany[questionId][compName] || 0) + 1;
                });
            }
        }
    }
    
    const overallSummary: AnalyticsItem[] = Object.entries(unsureCountsByCompany).map(([questionId, companyCounts]) => {
        const totalUnsure = Object.values(companyCounts).reduce((sum, count) => sum + count, 0);
        return {
            questionId,
            questionLabel: allMasterQuestions[questionId]?.label || questionId,
            count: totalUnsure,
            companyCounts: companyCounts,
        }
    }).sort((a,b) => b.count - a.count);

    return { overall: overallSummary, companyKeys: companiesToProcess };

  }, [companyName, getAllCompanyConfigs, isUserDataLoading, isAdmin, masterQuestions, masterProfileQuestions]);
  
  if (isUserDataLoading || !analyticsData) {
      return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
      )
  }

  const { overall } = analyticsData;
  const drilldownChartData = selectedQuestion?.companyCounts ? Object.entries(selectedQuestion.companyCounts).map(([name, count]) => ({ name, count })) : [];

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="font-headline text-3xl font-bold">Assessment Analytics</h1>
          <p className="text-muted-foreground">
            Insights into employee responses for {isAdmin ? 'all companies' : companyName}.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top "Unsure" Answers on First Completion</CardTitle>
            <CardDescription>
              This shows which questions employees answered "I'm not sure" to most frequently when they first completed their assessment.
              {isAdmin && " Click a row to see the company breakdown."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overall.length > 0 ? (
              <div className="grid gap-8">
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={overall.slice(0, 5)} layout={"vertical"} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis 
                                dataKey="questionLabel" 
                                type="category" 
                                width={180}
                                interval={0}
                                tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 25)}...` : value}
                            />
                            <Tooltip 
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                }}
                            />
                            <Bar dataKey="count" name="Total Unsure" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Question</TableHead>
                            <TableHead className="text-right">Total Unsure</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {overall.map(item => (
                            <TableRow 
                                key={item.questionId}
                                onClick={() => isAdmin && setSelectedQuestion(item)}
                                className={isAdmin ? "cursor-pointer" : ""}
                            >
                                <TableCell className="font-medium">{item.questionLabel}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="destructive">{item.count}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </div>
            ) : (
                <div className="text-center text-muted-foreground py-12">
                    <p>No "Unsure" answers have been recorded yet.</p>
                    <p className="text-sm">Check back after employees have completed their assessments.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
      
       <Dialog open={!!selectedQuestion} onOpenChange={(isOpen) => !isOpen && setSelectedQuestion(null)}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Company Breakdown for "{selectedQuestion?.questionLabel}"</DialogTitle>
                    <DialogDescription>
                        Number of "Unsure" answers per company for this question.
                    </DialogDescription>
                </DialogHeader>
                <div className="h-[300px] py-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={drilldownChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}/>
                            <Legend />
                             <Bar dataKey="count" name="Unsure Count" fill={'hsl(var(--chart-1))'} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
