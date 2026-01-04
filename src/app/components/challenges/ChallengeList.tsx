// src/components/challenges/ChallengeList.tsx
'use client';

import { useState, useEffect } from 'react';
import { getActiveChallenges, joinChallenge } from '@/services/challengeService';
import { useSession } from 'next-auth/react';
import { Challenge } from '@/types/challenge';
import { useRouter } from 'next/navigation';

export function ChallengeList() {
  const { data: session } = useSession();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all active challenges
        const activeChallenges = await getActiveChallenges();
        setChallenges(activeChallenges);

        // Load user's joined challenges if authenticated
        if (session?.user) {
          try {
            const res = await fetch('/api/user/challenges');
            const json = await res.json();
            if (json.success) {
              setUserChallenges(json.challengeIds || []);
            }
          } catch (error) {
            console.error('Error loading user challenges:', error);
          }
        }
      } catch (error) {
        console.error('Error loading challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session]);

  const handleJoinChallenge = async (challengeId: string) => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    
    try {
      const res = await joinChallenge(challengeId);
      console.log('[ChallengeList] Join response:', res);
      
      // Reload challenges to get fresh data
      const activeChallenges = await getActiveChallenges();
      setChallenges(activeChallenges);
      
      // Reload user's challenges
      const userRes = await fetch('/api/user/challenges');
      const userJson = await userRes.json();
      if (userJson.success) {
        setUserChallenges(userJson.challengeIds || []);
      }
      
      // Navigate to challenge detail page
      router.push(`/dashboard/challenges/${challengeId}`);
    } catch (error: any) {
      console.error('Error joining challenge:', error);
      alert(error.message || 'Failed to join challenge');
    }
  };

  if (loading) {
    return <div>Loading challenges...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Active Challenges</h2>
      {challenges.length === 0 ? (
        <p>No active challenges at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="border rounded-lg p-4">
              <h3 className="font-bold text-lg">{challenge.name}</h3>
              <p className="text-gray-600">{challenge.description}</p>
              <div className="mt-2 text-sm text-gray-500">
                <p>Goal: {challenge.minSteps.toLocaleString()} steps/day</p>
                <p>Duration: {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}</p>
                <p>Participants: {(challenge.participants || []).length}</p>
              </div>
              {session?.user && !userChallenges.includes(challenge.id) ? (
                <button
                  onClick={() => handleJoinChallenge(challenge.id)}
                  className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Join Challenge
                </button>
              ) : userChallenges.includes(challenge.id) ? (
                <button
                  onClick={() => router.push(`/dashboard/challenges/${challenge.id}`)}
                  className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  View Challenge
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}