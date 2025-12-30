'use client';

import { useState, useEffect } from 'react';

interface Insights {
  period: string;
  totalSteps: number;
  avgStepsPerDay: number;
  maxSteps: number;
  minSteps: number;
  currentStreak: number;
  longestStreak: number;
  activeChallenges: number;
  thisWeekSteps: number;
  lastWeekSteps: number;
  weeklyChange: number;
  messages: string[];
  stepData: Array<{ date: string; steps: number }>;
}

export function InsightsDashboard() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/insights');
      const data = await response.json();
      if (data.success) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500">Unable to load insights. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-2">📊 Your Insights</h2>
        <p className="text-blue-100">Last {insights.period}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-blue-600">
            {insights.totalSteps.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Steps</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-green-600">
            {insights.avgStepsPerDay.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mt-1">Daily Average</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-orange-600">
            {insights.currentStreak}
          </div>
          <div className="text-sm text-gray-600 mt-1">Current Streak</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-purple-600">
            {insights.maxSteps.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mt-1">Best Day</div>
        </div>
      </div>

      {/* Weekly Comparison */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">📈 Weekly Progress</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-600">This Week</div>
            <div className="text-2xl font-bold text-blue-600">
              {insights.thisWeekSteps.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Last Week</div>
            <div className="text-2xl font-bold text-gray-600">
              {insights.lastWeekSteps.toLocaleString()}
            </div>
          </div>
        </div>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
          insights.weeklyChange > 0 
            ? 'bg-green-100 text-green-800' 
            : insights.weeklyChange < 0 
            ? 'bg-red-100 text-red-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {insights.weeklyChange > 0 ? '↑' : insights.weeklyChange < 0 ? '↓' : '='} 
          {' '}{Math.abs(insights.weeklyChange)}%
        </div>
      </div>

      {/* Personalized Messages */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">💡 Personalized Insights</h3>
        <div className="space-y-3">
          {insights.messages.map((message, index) => (
            <div
              key={index}
              className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500"
            >
              <p className="text-gray-800">{message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Chart */}
      {insights.stepData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">📉 Last 14 Days</h3>
          <div className="flex items-end justify-between h-40 gap-1">
            {insights.stepData.map((day, index) => {
              const height = (day.steps / Math.max(...insights.stepData.map(d => d.steps))) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`${day.date}: ${day.steps.toLocaleString()} steps`}
                  ></div>
                  <div className="text-xs text-gray-500 mt-1 rotate-45 origin-top-left">
                    {new Date(day.date).getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
