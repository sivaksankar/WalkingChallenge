'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useStepHistory } from '@/hooks/useStepHistory';

// Register Chart.js components
Chart.register(...registerables);

interface StepsChartProps {
  userId: string;
  daysBack?: number;
}

export function StepsChart({ userId, daysBack = 7 }: StepsChartProps) {
  const { steps, isLoading, error } = useStepHistory(userId, daysBack);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !steps.length) return;

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Prepare data for chart
    const labels = steps.map(entry => 
      new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })
    );
    
    const data = steps.map(entry => entry.steps);

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Steps',
            data,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              stepSize: 1000,
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 14,
            },
            padding: 10,
            cornerRadius: 4,
            displayColors: false,
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return `${value.toLocaleString()} steps`;
              },
            },
          },
        },
      },
    });

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [steps, daysBack]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>Error loading step data: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Step History</h2>
      <div className="h-64">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}