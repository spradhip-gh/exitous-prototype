
import type { Condition } from '@/hooks/use-user-data';

export const tenureOptions: { label: string; condition: Condition }[] = [
    { label: '< 1 Year', condition: { type: 'tenure', operator: 'lt', value: [1], label: '< 1 Year' }},
    { label: '1 - 3 Years', condition: { type: 'tenure', operator: 'gte_lt', value: [1, 3], label: '1 - 3 Years' }},
    { label: '3 - 5 Years', condition: { type: 'tenure', operator: 'gte_lt', value: [3, 5], label: '3 - 5 Years' }},
    { label: '5+ Years', condition: { type: 'tenure', operator: 'gte', value: [5], label: '5+ Years' }},
];
