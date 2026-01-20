'use client';

import { ChallengeList } from '@/components/challenges/ChallengeList';
import { CreateChallengeForm } from '@/components/challenges/CreateChallengeForm';
import { useState } from 'react';

export default function ChallengesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Challenges</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {showCreateForm ? 'Cancel' : '+ New Challenge'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Create New Challenge</h2>
          <CreateChallengeForm />
        </div>
      )}

      <ChallengeList />
    </div>
  );
}
