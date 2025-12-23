// src/components/challenges/ChallengeBadge.tsx
'use client';

interface ChallengeBadgeProps {
  challenge: {
    id: string;
    name: string;
    minSteps: number;
  };
  onClick?: () => void;
}

export function ChallengeBadge({ challenge, onClick }: ChallengeBadgeProps) {
  return (
    <span 
      onClick={onClick}
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 cursor-pointer"
    >
      {challenge.name} ({challenge.minSteps.toLocaleString()}+ steps)
    </span>
  );
}