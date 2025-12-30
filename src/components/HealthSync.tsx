'use client';

import { useState } from 'react';
import { Button } from './ui/button';

export function HealthSync() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const syncAppleHealth = async () => {
    setSyncing(true);
    setMessage('');

    try {
      // In a real implementation, this would use HealthKit API on iOS
      // For now, we'll simulate syncing with sample data
      const today = new Date().toISOString().split('T')[0];
      const steps = Math.floor(Math.random() * 5000) + 5000; // Simulate 5000-10000 steps

      const response = await fetch('/api/health/apple/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps, date: today })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Synced ${steps.toLocaleString()} steps from Apple Health`);
      } else {
        setMessage(`❌ ${data.error || 'Sync failed'}`);
      }
    } catch (error) {
      setMessage('❌ Failed to sync with Apple Health');
    } finally {
      setSyncing(false);
    }
  };

  const syncSamsungHealth = async () => {
    setSyncing(true);
    setMessage('');

    try {
      // In a real implementation, this would use Samsung Health SDK on Android
      // For now, we'll simulate syncing with sample data
      const today = new Date().toISOString().split('T')[0];
      const steps = Math.floor(Math.random() * 5000) + 5000; // Simulate 5000-10000 steps

      const response = await fetch('/api/health/samsung/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps, date: today })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Synced ${steps.toLocaleString()} steps from Samsung Health`);
      } else {
        setMessage(`❌ ${data.error || 'Sync failed'}`);
      }
    } catch (error) {
      setMessage('❌ Failed to sync with Samsung Health');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Sync Health Data</h2>
      <p className="text-gray-600 mb-6">
        Connect your health app to automatically sync your daily steps.
      </p>

      <div className="space-y-4">
        <Button
          onClick={syncAppleHealth}
          disabled={syncing}
          className="w-full bg-black hover:bg-gray-800 text-white"
        >
          {syncing ? '⏳ Syncing...' : '🍎 Sync Apple Health'}
        </Button>

        <Button
          onClick={syncSamsungHealth}
          disabled={syncing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {syncing ? '⏳ Syncing...' : '📱 Sync Samsung Health'}
        </Button>
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-md text-sm text-blue-800">
        <p className="font-semibold mb-2">📝 Note:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Apple Health integration requires iOS device</li>
          <li>Samsung Health integration requires Samsung device</li>
          <li>Your data is synced securely and never shared without permission</li>
        </ul>
      </div>
    </div>
  );
}
