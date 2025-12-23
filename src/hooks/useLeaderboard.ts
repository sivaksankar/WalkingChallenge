// src/hooks/useLeaderboard.ts
import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  steps: number;
  profileImage?: string | null;
}

export function useLeaderboard(limitCount: number = 10) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/leaderboard?limit=${limitCount}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load leaderboard');
        }

        const data: LeaderboardEntry[] = (json.leaderboard || []).map((u: any) => ({
          id: u.id,
          name: u.name || 'Anonymous',
          email: u.email || '',
          steps: u.steps || 0,
          profileImage: u.image || null,
        }));

        setLeaderboard(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [limitCount]);

  return { leaderboard, isLoading, error };
}

interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  steps: number;
  profileImage?: string;
}

interface UserData extends DocumentData {
  name: string;
  email: string;
  image?: string;
  steps?: number;
}

// (old implementation removed)