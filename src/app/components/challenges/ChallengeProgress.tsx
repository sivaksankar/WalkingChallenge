// src/components/challenges/ChallengeProgress.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ChallengeProgressProps {
  challengeId: string;
}

export function ChallengeProgress({ challengeId }: ChallengeProgressProps) {
  const { data: session } = useSession();
  const [progress, setProgress] = useState<{
    totalSteps: number;
    dailyAverage: number;
    daysRemaining: number;
    completionPercentage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      if (!session?.user?.email) return;
      try {
        const res = await fetch(`/api/challenges/${challengeId}/progress`);
        const json = await res.json();
        if (json?.success) {
          setProgress(json.progress);
        } else {
          console.error('Failed to load progress:', json?.error);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [session, challengeId]);

  if (loading || !progress) {
    return <div>Loading progress...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Your Progress</h3>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-indigo-600 h-4 rounded-full" 
            style={{ width: `${progress.completionPercentage}%` }}
          ></div>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {progress.completionPercentage}% complete ({progress.daysRemaining} days remaining)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Total Steps</p>
          <p className="text-2xl font-semibold text-gray-900">{progress.totalSteps.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Daily Average</p>
          <p className="text-2xl font-semibold text-gray-900">{progress.dailyAverage.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Days Remaining</p>
          <p className="text-2xl font-semibold text-gray-900">{progress.daysRemaining}</p>
        </div>
      </div>
    </div>
  );
}