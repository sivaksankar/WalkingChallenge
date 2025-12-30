// src/components/StepCounter.tsx
'use client';

import { useState } from 'react';
import { useStepTracking } from '@/hooks/useStepTracking';

export function StepCounter() {
  const { steps, isLoading, error, addSteps } = useStepTracking();
  const [stepsToAdd, setStepsToAdd] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [lastAddedSteps, setLastAddedSteps] = useState<number>(0);

  const handleAddSteps = async () => {
    if (stepsToAdd <= 0) return;
    
    const stepsToAddValue = stepsToAdd;
    setIsAdding(true);
    setAddSuccess(false);
    
    try {
      await addSteps(stepsToAddValue);
      setLastAddedSteps(stepsToAddValue);
      setStepsToAdd(0);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to add steps:', err);
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Step Tracker</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3">Loading step data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Step Tracker</h2>
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Step Tracker</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-500">Today&apos;s Steps</p>
            <p className="text-2xl font-bold text-gray-900">{steps.toLocaleString()}</p>
          </div>
          <div className="w-24">
            <label htmlFor="steps" className="sr-only">Add steps</label>
            <input
              type="number"
              id="steps"
              min="1"
              value={stepsToAdd || ''}
              onChange={(e) => setStepsToAdd(Math.max(0, Number(e.target.value)))}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 text-center"
              placeholder="0"
              disabled={isAdding}
            />
          </div>
          <button
            onClick={handleAddSteps}
            disabled={stepsToAdd <= 0 || isAdding}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? 'Adding...' : 'Add'}
          </button>
        </div>

        {addSuccess && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Added {lastAddedSteps.toLocaleString()} steps!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}