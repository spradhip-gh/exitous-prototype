'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/personalized-recommendations.ts';
// The summarize-document flow is causing issues with the genkit dev server.
// It is still available to the app because it's imported directly where it's used.
// import '@/ai/flows/summarize-document.ts';
