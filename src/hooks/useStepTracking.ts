// src/hooks/useStepTracking.ts
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UseStepTrackingReturn {
  steps: number;
  isLoading: boolean;
  error: string | null;
  updateSteps: (newSteps: number) => Promise<void>;
  addSteps: (stepsToAdd: number) => Promise<void>;
}

export function useStepTracking(): UseStepTrackingReturn {
  const { data: session, status } = useSession();
  const [steps, setSteps] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Fetch today's steps from server endpoint (avoids client Firestore permissions requirements)
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      setIsLoading(false);
      return;
    }

    const fetchTodaySteps = async () => {
      try {
        setIsLoading(true);
        const userId = (session.user as any)?.id;
        const url = userId ? `/api/steps?userId=${encodeURIComponent(userId)}&daysBack=0` : `/api/steps?daysBack=0`;
        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load step data');

        const today = new Date().toISOString().split('T')[0];
        const entry = (json.steps || []).find((d: any) => d.date === today);
        setSteps(entry?.steps || 0);
        setError(null);
      } catch (err) {
        const error = err as Error;
        console.error('Error fetching today steps:', error);
        setError(error.message || 'Failed to load step data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodaySteps();
  }, [session, status]);

  const updateSteps = async (newSteps: number) => {
    // Call server endpoint to set exact steps (server uses admin SDK)
    try {
      const res = await fetch('/api/steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newSteps })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update steps');
      setSteps(newSteps);
    } catch (error) {
      const err = error as Error;
      console.error('Error updating steps via API:', err);
      throw new Error(`Failed to update steps: ${err.message}`);
    }
  };

  const addSteps = async (stepsToAdd: number) => {
    // Call server endpoint to increment steps using admin SDK
    try {
      const res = await fetch('/api/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepsToAdd })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to add steps');

      // Optimistically update local value
      setSteps((prev) => prev + stepsToAdd);
    } catch (error) {
      const err = error as Error;
      console.error('Error adding steps via API:', err);
      throw new Error(`Failed to add steps: ${err.message}`);
    }
  };

  return { steps, isLoading, error, updateSteps, addSteps };
}