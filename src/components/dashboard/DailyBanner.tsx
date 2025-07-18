'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const dailyData = [
  { // Sunday
    message: "Every worker deserves a good exit strategy, not just CEOs.",
    color: "hsl(210 40% 96.1%)",
    imageHint: "justice scale"
  },
  { // Monday
    message: "Let’s empower you to make your best exit.",
    color: "hsl(147 50% 94%)",
    imageHint: "empowerment sunrise"
  },
  { // Tuesday
    message: "Layoffs can have less chaos.",
    color: "hsl(45 100% 95%)",
    imageHint: "calm water"
  },
  { // Wednesday
    message: "Pivots can have less panic.",
    color: "hsl(190 50% 94%)",
    imageHint: "path forward"
  },
  { // Thursday
    message: "You deserve compassionate guidance for what’s next.",
    color: "hsl(260 50% 96%)",
    imageHint: "helping hand"
  },
  { // Friday
    message: "You deserve tailored guidance with less noise.",
    color: "hsl(340 50% 96%)",
    imageHint: "focused work"
  },
  { // Saturday
    message: "Awareness is the first step to managing critical choices that impact your life.",
    color: "hsl(25 50% 95%)",
    imageHint: "awareness light"
  }
];

export default function DailyBanner() {
  const [dayIndex, setDayIndex] = useState<number | null>(null);

  useEffect(() => {
    // This runs only on the client, after hydration
    const today = new Date().getDay();
    setDayIndex(today);
  }, []);

  if (dayIndex === null) {
    // Render a skeleton on the server and during initial client render
    return <Skeleton className="mb-8 h-32 w-full rounded-lg" />;
  }

  const { message, color, imageHint } = dailyData[dayIndex];

  return (
    <Card 
        className="mb-8 overflow-hidden shadow-lg relative h-32 w-full flex items-center justify-center p-4"
        style={{ backgroundColor: color }}
    >
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div className="relative z-20">
          <p className="text-center text-xl font-semibold text-white md:text-2xl drop-shadow-md">
            {message}
          </p>
        </div>
    </Card>
  );
}
