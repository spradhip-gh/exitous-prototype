'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/personalized-recommendations.ts';
import '@/ai/flows/find-expert-matches.ts';
// This flow is removed for prototype stability.
// import '@/ai/flows/summarize-document.ts';
