'use client';

import { useLeaderboard } from '@/hooks/useLeaderboard';

interface LeaderboardProps {
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

export function Leaderboard({ 
  limit = 10, 
  showTitle = true,
  className = '' 
}: LeaderboardProps) {
  const { leaderboard, isLoading, error } = useLeaderboard(limit);

  if (isLoading) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
        {showTitle && <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>}
        <div className="space-y-3">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-gray-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg ${className}`}>
        <h2 className="font-semibold mb-2">Error Loading Leaderboard</h2>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
      {showTitle && <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>}
      
      <div className="space-y-3">
        {leaderboard.map((user, index) => (
          <div 
            key={user.id} 
            className={`flex items-center p-3 rounded-lg transition-colors ${
              index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
            } hover:bg-blue-50`}
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-semibold">
              {index + 1}
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {user.steps.toLocaleString()} steps
              </p>
            </div>
            
            {user.profileImage ? (
              <img
                className="w-10 h-10 rounded-full"
                src={user.profileImage}
                alt={user.name}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
        
        {leaderboard.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}