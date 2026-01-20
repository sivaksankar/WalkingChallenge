// src/components/challenges/ChallengeList.tsx
'use client';

import { useState, useEffect } from 'react';
import { getActiveChallenges, joinChallenge } from '@/services/challengeService';
import { useSession } from 'next-auth/react';
import { Challenge } from '@/types/challenge';
import { useRouter } from 'next/navigation';
// Uses server APIs via `challengeService` now; no direct client Firestore writes

export function ChallengeList() {
  const { data: session } = useSession();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        const activeChallenges = await getActiveChallenges();
        setChallenges(activeChallenges);
        setError(null);
      } catch (err) {
        console.error('Error loading challenges:', err);
        setError('Failed to load challenges. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadChallenges();
  }, []);

  const handleJoinChallenge = async (challengeId: string) => {
    if (!session?.user?.email) {
      router.push('/login');
      return;
    }
    
    try {
      // Call server endpoint to join
      await joinChallenge(challengeId);

      // Refresh active challenges from server to reflect authoritative state
      const activeChallenges = await getActiveChallenges();
      setChallenges(activeChallenges);
    } catch (error) {
      console.error('Error joining challenge:', error);
      // Prefer server-provided message when available
      const msg = (error as any)?.message || 'Failed to join challenge. Please try again.';
      setError(msg);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading challenges...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Active Challenges</h2>
      {challenges.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium">No Active Challenges</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>There are no active challenges at the moment. Please check back later or create a new challenge.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium">{challenge.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{challenge.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Goal</p>
                    <p className="text-lg font-semibold">
                      {challenge.minSteps.toLocaleString()} steps/day
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Participants</p>
                    <p className="text-lg font-semibold">
                      {(challenge.participants || []).length}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="text-sm text-gray-900">
                    {new Date(challenge.startDate).toLocaleDateString()} -{' '}
                    {new Date(challenge.endDate).toLocaleDateString()}
                  </p>
                </div>
                {session?.user && (() => {
                  const userId = (session.user as any).id;
                  const userEmail = session.user.email;
                  const participants = challenge.participants || [];
                  const isJoined = (userId && participants.includes(userId)) || (userEmail && participants.includes(userEmail));
                  if (isJoined) {
                    return (
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/challenges/${challenge.id}`)}
                          className="flex-1 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                        >
                          View Leaderboard
                        </button>
                        <span className="inline-flex items-center px-3 py-2 rounded-md bg-green-100 text-green-800 text-sm font-medium">
                          Joined
                        </span>
                      </div>
                    );
                  }

                  return (
                    <button
                      type="button"
                      onClick={() => handleJoinChallenge(challenge.id)}
                      className="mt-4 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                    >
                      Join Challenge
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}