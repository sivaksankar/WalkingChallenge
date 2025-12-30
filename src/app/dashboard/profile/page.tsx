// src/app/dashboard/profile/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { ChallengeBadge } from '@/components/challenges/ChallengeBadge';
import { useEffect, useState } from 'react';
import { Challenge } from '@/types/challenge';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserChallenges = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/users/challenges`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load challenges');
        const userChallenges = (json.challenges || []).map((c: any) => ({
          id: c.id,
          ...c,
          startDate: c.startDate,
          endDate: c.endDate
        })) as Challenge[];
        setChallenges(userChallenges);
        setError(null);
      } catch (err) {
        console.error('Error loading user challenges (server):', err);
        setError('Failed to load challenges. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadUserChallenges();
  }, [session]);

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">User Profile</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Personal details and challenges.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {session.user?.name || 'Not provided'}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {session.user?.email}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Active Challenges</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {loading ? (
                    <p>Loading challenges...</p>
                  ) : error ? (
                    <div className="text-red-600 text-sm">{error}</div>
                  ) : challenges.length === 0 ? (
                    <p>Not participating in any challenges yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {challenges.map((challenge) => (
                        <ChallengeBadge 
                          key={challenge.id} 
                          challenge={challenge}
                          onClick={() => router.push(`/dashboard/challenges/${challenge.id}`)}
                        />
                      ))}
                    </div>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}