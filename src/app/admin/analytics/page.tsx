
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import type { Question } from '@/lib/questions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface UnsureAnswer {
  questionId: string;
  questionLabel: string;
  count: number;
}

export default function AnalyticsPage() {
  const { auth } = useAuth();
  const { getAllCompanyConfigs, getCompanyConfig, isUserDataLoading } = useUserData();
  const companyName = auth?.companyName;

  const unsureAnalytics = useMemo(() => {
    if (!companyName || isUserDataLoading) return null;

    const companyConfig = getAllCompanyConfigs()[companyName];
    if (!companyConfig || !companyConfig.users) return [];

    const questionMap: Map<string, Question> = new Map();
    const allQuestions = getCompanyConfig(companyName, false);
    
    const flattenQuestions = (questions: Question[]) => {
      for (const q of questions) {
        questionMap.set(q.id, q);
        if (q.subQuestions) {
          flattenQuestions(q.subQuestions);
        }
      }
    };
    flattenQuestions(allQuestions);

    const unsureCounts: Record<string, number> = {};

    for (const user of companyConfig.users) {
      const assessmentData = user.prefilledAssessmentData; // In demo, this holds the answers
      if (assessmentData) {
        for (const questionId in assessmentData) {
          const answer = (assessmentData as any)[questionId];
          if (answer === 'Unsure') {
            unsureCounts[questionId] = (unsureCounts[questionId] || 0) + 1;
          }
        }
      }
    }

    return Object.entries(unsureCounts)
      .map(([questionId, count]) => {
        const question = questionMap.get(questionId);
        return {
          questionId,
          questionLabel: question ? question.label : questionId,
          count,
        };
      })
      .sort((a, b) => b.count - a.count);

  }, [companyName, getAllCompanyConfigs, getCompanyConfig, isUserDataLoading]);
  
  if (isUserDataLoading) {
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

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="font-headline text-3xl font-bold">Assessment Analytics</h1>
          <p className="text-muted-foreground">
            Insights into employee responses for {companyName}.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top "Unsure" Answers</CardTitle>
            <CardDescription>
              These are the questions your employees were most frequently unsure about. This data can help you improve internal documentation and resources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {unsureAnalytics && unsureAnalytics.length > 0 ? (
              <div className="grid gap-8">
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={unsureAnalytics.slice(0, 5)} layout="vertical" margin={{ left: 120 }}>
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
                            <Bar dataKey="count" name="Unsure Count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Question</TableHead>
                            <TableHead className="text-right">"Unsure" Count</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {unsureAnalytics.map(item => (
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
