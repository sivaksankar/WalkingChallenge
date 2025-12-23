import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
interface StepEntry {
  id: string;
  date: string;
  steps: number;
  timestamp: any;
}
export function useStepHistory(userId?: string, daysBack: number = 7) {
  const { data: session, status } = useSession();
  const [steps, setSteps] = useState<StepEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If a userId is provided, use it. Otherwise, rely on server session (GET /api/steps will derive user).
    if (userId == null && status !== 'authenticated') {
      setIsLoading(false);
      return;
    }

    const fetchStepHistory = async () => {
      try {
        setIsLoading(true);
        const url = userId
          ? `/api/steps?userId=${encodeURIComponent(userId)}&daysBack=${daysBack}`
          : `/api/steps?daysBack=${daysBack}`;

        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load step history');
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);
        const startDateStr = startDate.toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];

        const stepsData = new Map<string, StepEntry>();
        (json.steps || []).forEach((doc: any) => {
          stepsData.set(doc.date, {
            id: doc.id,
            date: doc.date,
            steps: doc.steps || 0,
            timestamp: doc.timestamp || null,
          });
        });

        const dateRange = getDateRange(startDateStr, today);
        const completeSteps = dateRange.map((date) => {
          const existingData = stepsData.get(date);
          return (
            existingData || {
              id: `missing-${date}`,
              date,
              steps: 0,
              timestamp: new Date(date),
            }
          );
        });

        setSteps(completeSteps);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching step history:', err);
        setError('Failed to load step history: ' + (err.message || 'error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStepHistory();
  }, [userId, daysBack, status]);

  return { steps, isLoading, error };
}

// Helper function to generate an array of dates between start and end (inclusive)
function getDateRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateArray: string[] = [];
  let currentDate = new Date(start);

  while (currentDate <= end) {
    dateArray.push(currentDate.toISOString().split('T')[0]);
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateArray;
}