

import type { Condition } from '@/hooks/use-user-data';

// Values are in years, e.g. 0.082 is approx 30 days.
export const tenureOptions: { label: string; condition: Condition }[] = [
    { label: '< 30 Days', condition: { type: 'tenure', operator: 'lt', value: [0.082], label: '< 30 Days' }},
    { label: '30 days - 1 Year', condition: { type: 'tenure', operator: 'gte_lt', value: [0.082, 1], label: '30 days - 1 Year' }},
    { label: '1 - 5 Years', condition: { type: 'tenure', operator: 'gte_lt', value: [1, 6], label: '1 - 5 Years' }},
    { label: '6 - 10 Years', condition: { type: 'tenure', operator: 'gte_lt', value: [6, 11], label: '6 - 10 Years' }},
    { label: '10+ Years', condition: { type: 'tenure', operator: 'gte', value: [11], label: '10+ Years' }},
];
