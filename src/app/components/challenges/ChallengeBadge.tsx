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
    <div 
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 mr-2 mb-2 cursor-pointer hover:bg-indigo-200"
      onClick={onClick}
    >
      {challenge.name} ({challenge.minSteps.toLocaleString()}+ steps)
    </div>
  );
}