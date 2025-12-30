// src/services/challengeService.ts
import { Challenge } from '@/types/challenge';

export const createChallenge = async (challengeData: Omit<Challenge, 'id' | 'createdAt' | 'participants' | 'isActive' | 'createdBy'>) => {
  const res = await fetch('/api/challenges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(challengeData),
  });

  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create challenge');
  return json.challenge as Challenge;
};

export const getActiveChallenges = async (): Promise<Challenge[]> => {
  const res = await fetch('/api/challenges');
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load challenges');
  return (json.challenges || []) as Challenge[];
};

export const getChallenge = async (id: string): Promise<Challenge | null> => {
  // Lightweight getter; reuse existing API or implement detail endpoint later
  const res = await fetch(`/api/challenges`);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load challenge');
  const found = (json.challenges || []).find((c: any) => c.id === id);
  return found || null;
};

export const joinChallenge = async (challengeId: string) => {
  const res = await fetch('/api/challenges/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to join challenge');
  return true;
};

export const getChallengeLeaderboard = async (challengeId: string) => {
  // For now, fall back to existing client-side or server endpoint later.
  const res = await fetch(`/api/challenges`);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load challenge');
  // Not implemented: compute leaderboard server-side yet.
  return [];
};