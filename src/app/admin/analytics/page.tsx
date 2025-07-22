
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import type { Question } from '@/lib/questions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AnalyticsPage() {
  const { auth } = useAuth();
  const { getAllCompanyConfigs, getCompanyConfig, isUserDataLoading, companyAssignments } = useUserData();
  const companyName = auth?.companyName;
  const isAdmin = auth?.role === 'admin';

  const analyticsData = useMemo(() => {
    if (isUserDataLoading) return null;

    const allConfigs = getAllCompanyConfigs();
    const companiesToProcess = isAdmin ? companyAssignments.map(c => c.companyName) : (companyName ? [companyName] : []);
    
    if (companiesToProcess.length === 0) return { overall: [], byCompany: [], companyKeys: [] };

    const questionMap: Map<string, Question> = new Map();
    const allQuestions = getCompanyConfig(isAdmin ? undefined : companyName, false);
    
    const flattenQuestions = (questions: Question[]) => {
      for (const q of questions) {
        questionMap.set(q.id, q);
        if (q.subQuestions) {
          flattenQuestions(q.subQuestions);
        }
      }
    };
    flattenQuestions(allQuestions);

    const unsureCountsByCompany: Record<string, Record<string, number>> = {}; // { questionId: { companyName: count } }

    for (const compName of companiesToProcess) {
        const companyConfig = allConfigs[compName];
        if (!companyConfig || !companyConfig.users) continue;

        for (const user of companyConfig.users) {
            const assessmentData = user.prefilledAssessmentData;
            if (assessmentData) {
                for (const questionId in assessmentData) {
                    const answer = (assessmentData as any)[questionId];
                    if (answer === 'Unsure') {
                        if (!unsureCountsByCompany[questionId]) {
                            unsureCountsByCompany[questionId] = {};
                        }
                        unsureCountsByCompany[questionId][compName] = (unsureCountsByCompany[questionId][compName] || 0) + 1;
                    }
                }
            }
        }
    }
    
    const overallSummary = Object.entries(unsureCountsByCompany).map(([questionId, companyCounts]) => {
        const total = Object.values(companyCounts).reduce((sum, count) => sum + count, 0);
        return {
            questionId,
            questionLabel: questionMap.get(questionId)?.label || questionId,
            count: total,
        }
    }).sort((a,b) => b.count - a.count);


    const chartDataByCompany = overallSummary.slice(0, 7).map(({ questionId, questionLabel }) => {
        const entry: { [key: string]: string | number } = { questionLabel };
        const companyCounts = unsureCountsByCompany[questionId] || {};
        for(const compName of companiesToProcess) {
            entry[compName] = companyCounts[compName] || 0;
        }
        return entry;
    });

    return {
        overall: overallSummary,
        byCompany: chartDataByCompany,
        companyKeys: companiesToProcess,
    };

  }, [companyName, getAllCompanyConfigs, getCompanyConfig, isUserDataLoading, isAdmin, companyAssignments]);
  
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

  const { overall, byCompany, companyKeys } = analyticsData;

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
            <CardTitle>Top "Unsure" Answers</CardTitle>
            <CardDescription>
              These are the questions employees were most frequently unsure about. This data can help improve documentation and resources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overall.length > 0 ? (
              <div className="grid gap-8">
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={isAdmin ? byCompany : overall.slice(0, 5)} 
                            layout="vertical" 
                            margin={{ left: 120 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis 
                                dataKey="questionLabel" 
                                type="category" 
                                width={150}
                                tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 25)}...` : value}
                            />
                            <Tooltip 
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                }}
                            />
                            {isAdmin ? (
                                <>
                                <Legend />
                                {companyKeys.map((key, index) => (
                                    <Bar key={key} dataKey={key} stackId="a" fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[0, 4, 4, 0]} />
                                ))}
                                </>
                            ) : (
                                <Bar dataKey="count" name="Unsure Count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Question</TableHead>
                            <TableHead className="text-right">Total "Unsure" Count</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {overall.map(item => (
                            <TableRow key={item.questionId}>
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
                    <p>No one has answered "Unsure" to any questions yet.</p>
                    <p className="text-sm">Check back after employees have completed their assessments.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
