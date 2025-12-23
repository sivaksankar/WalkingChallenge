// src/app/dashboard/challenges/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Challenge } from '@/types/challenge';
import { ChallengeLeaderboard } from '@/components/challenges/ChallengeLeaderboard';
import { ChallengeProgress } from '@/components/challenges/ChallengeProgress';
import { StepsChart } from '@/components/StepsChart';
import { useEffect, useState } from 'react';

export default function ChallengeDetailPage() {
  const params = useParams() as { id?: string } | null;
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { data: session } = useSession();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        if (!id) return;
        const res = await fetch(`/api/challenges/${id}`);
        const json = await res.json();
        if (json?.success) {
          setChallenge(json.challenge as Challenge);
        } else {
          router.push('/dashboard/challenges');
        }
      } catch (error) {
        console.error('Error loading challenge:', error);
        router.push('/dashboard/challenges');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadChallenge();
    }
  }, [id, router]);

  if (loading) {
    return <div>Loading challenge details...</div>;
  }

  if (!challenge) {
    return <div>Challenge not found</div>;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{challenge.name}</h1>
            <p className="text-gray-600">{challenge.description}</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Goal</p>
                <p className="text-lg font-semibold">{challenge.minSteps.toLocaleString()} steps/day</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p className="text-lg font-semibold">
                  {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Participants</p>
                <p className="text-lg font-semibold">{challenge.participants?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ChallengeProgress challengeId={challenge.id} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChallengeLeaderboard challengeId={challenge.id} />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Your Progress</h3>
              <div className="h-64">
                <StepsChart userId={session?.user?.id ?? ''} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}