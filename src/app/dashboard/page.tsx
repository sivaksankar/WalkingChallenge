// src/app/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { StepsChart } from '@/components/StepsChart';
import { StepCounter } from '@/components/StepCounter';
import { Leaderboard } from '@/components/Leaderboard';
import { CreateChallengeForm } from '@/components/challenges/CreateChallengeForm';
import { ChallengeList } from '@/components/challenges/ChallengeList';
import { useRouter } from 'next/navigation';
import { useStepTracking } from '@/hooks/useStepTracking';
import { useStepHistory } from '@/hooks/useStepHistory';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { InsightsDashboard } from '@/components/InsightsDashboard';
import { HealthSync } from '@/components/HealthSync';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log('[Dashboard] status:', status, 'session:', session?.user?.email || 'null');
  }, [status, session]);

  // Handle loading and unauthenticated states
  if (status === 'loading' || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session?.user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-sm opacity-70">
            Track your steps and see how you compare with others
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Steps Chart - Takes 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Insights Dashboard */}
            <InsightsDashboard />

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Your Activity</h2>
              <div className="h-80">
                <StepsChart 
                  userId={session.user.id} 
                  daysBack={7} 
                />
              </div>
            
              <div className="mt-6">
                <StepCounter />
              </div>
            </div>

            {/* Stats grid component */}
          

            {/* Additional stats or components can go here */}
            <StatGrid
              session={session}
            />

            {/* Health Sync */}
            <HealthSync />
          </div>

          {/* Leaderboard - Takes 1/3 width on large screens */}
          <div className="lg:col-span-1">
            <Leaderboard 
              limit={5} 
              showTitle={true}
              className="sticky top-6"
            />
            <div className="mt-6 space-y-6">
              <CreateChallengeForm />
              <ChallengeList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small helper component rendered inside the Dashboard to keep the main layout tidy.
function StatGrid({ session }: { session: any }) {
  const { steps: todaySteps, isLoading: todayLoading } = useStepTracking();
  const { steps: weekSteps, isLoading: weekLoading } = useStepHistory(undefined, 7);
  const { leaderboard, isLoading: lbLoading } = useLeaderboard(100);

  const weeklyTotal = (weekSteps || []).reduce((s, e) => s + (e.steps || 0), 0);

  let rankDisplay = '#-';
  if (!lbLoading && leaderboard && session?.user?.id) {
    const idx = leaderboard.findIndex((u: any) => u.id === session.user.id);
    if (idx >= 0) rankDisplay = `#${idx + 1}`;
    else {
      // not in top list, but we can compute approximate rank by position among fetched list
      rankDisplay = `#${leaderboard.length + 1}+`;
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-sm font-medium text-gray-500">Today&apos;s Steps</p>
        <p className="text-2xl font-bold mt-1">{todayLoading ? '...' : (todaySteps ?? 0).toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-1">{todayLoading ? '' : '+0% from yesterday'}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-sm font-medium text-gray-500">Weekly Total</p>
        <p className="text-2xl font-bold mt-1">{weekLoading ? '...' : weeklyTotal.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-1">{weekLoading ? '' : '+0% from last week'}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-sm font-medium text-gray-500">Rank</p>
        <p className="text-2xl font-bold mt-1">{lbLoading ? '...' : rankDisplay}</p>
        <p className="text-xs text-gray-500 mt-1">of all users</p>
      </div>
    </div>
  );
}