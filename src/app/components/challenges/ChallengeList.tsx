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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        const activeChallenges = await getActiveChallenges();
        setChallenges(activeChallenges);
      } catch (error) {
        console.error('Error loading challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChallenges();
  }, []);

  const handleJoinChallenge = async (challengeId: string) => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }
    
    try {
      await joinChallenge(challengeId);
      // Update local state to reflect the user joined
      setChallenges(challenges.map(challenge => 
        challenge.id === challengeId 
          ? { 
              ...challenge, 
              participants: [...(challenge.participants || []), session.user!.id!] 
            } 
          : challenge
      ));
    } catch (error) {
      console.error('Error joining challenge:', error);
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
              {session?.user?.id && !challenge.participants?.includes(session.user.id) && (
                <button
                  onClick={() => handleJoinChallenge(challenge.id)}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Join Challenge
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}