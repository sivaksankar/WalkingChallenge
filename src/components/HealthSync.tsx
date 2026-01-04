'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { nativeHealthService } from '@/services/nativeHealthService';
import { useSession } from 'next-auth/react';

export function HealthSync() {
  const { data: session } = useSession();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [manualSteps, setManualSteps] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');
  const [todaySteps, setTodaySteps] = useState<number | null>(null);

  useEffect(() => {
    // Check if running on native platform
    const checkNativePlatform = async () => {
      const native = nativeHealthService.isNativePlatform();
      const plat = nativeHealthService.getPlatform();
      setIsNative(native);
      setPlatform(plat);

      if (native) {
        // Check if permissions are already granted
        const permitted = await nativeHealthService.checkPermissions();
        setHasPermission(permitted);

        if (permitted) {
          // Load today's steps automatically
          try {
            const steps = await nativeHealthService.getTodaySteps();
            setTodaySteps(steps);
          } catch (error) {
            console.error('Error loading today steps:', error);
          }
        }
      }
    };

    checkNativePlatform();
  }, []);

  const requestHealthPermissions = async () => {
    if (!isNative) return;

    setSyncing(true);
    setMessage('🔐 Requesting health permissions...');

    try {
      const granted = await nativeHealthService.requestPermissions();
      
      if (granted) {
        setHasPermission(true);
        setMessage('✅ Health permissions granted!');
        
        // Load today's steps
        const steps = await nativeHealthService.getTodaySteps();
        setTodaySteps(steps);
      } else {
        setMessage('⚠️ Health permissions denied. Please enable in Settings.');
      }
    } catch (error) {
      setMessage('❌ Failed to request permissions');
    } finally {
      setSyncing(false);
    }
  };

  const syncNativeHealth = async () => {
    if (!isNative || !session?.user?.id) return;

    setSyncing(true);
    setMessage('🔄 Syncing health data...');

    try {
      const result = await nativeHealthService.syncWithBackend(session.user.id);
      
      if (result.success) {
        setMessage(`✅ ${result.message}`);
        // Refresh today's steps
        const steps = await nativeHealthService.getTodaySteps();
        setTodaySteps(steps);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setMessage('❌ Failed to sync health data');
    } finally {
      setSyncing(false);
    }
  };

  const syncManualSteps = async () => {
    const steps = parseInt(manualSteps);
    if (isNaN(steps) || steps < 0) {
      setMessage('⚠️ Please enter a valid number of steps');
      return;
    }

    setSyncing(true);
    setMessage('');

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch('/api/health/manual/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps, date: today })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Synced ${steps.toLocaleString()} steps successfully`);
        setManualSteps('');
        setShowManualEntry(false);
      } else {
        setMessage(`❌ ${data.error || 'Sync failed'}`);
      }
    } catch (error) {
      setMessage('❌ Failed to sync steps');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Sync Health Data</h2>
      <p className="text-gray-600 mb-6">
        Track your daily steps {isNative ? 'automatically from your health app or' : 'by'} entering manually.
      </p>

      {/* Native Health Sync - Only on iOS/Android apps */}
      {isNative && (
        <div className="mb-6 p-4 border-2 border-green-200 rounded-lg bg-green-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{platform === 'ios' ? '🍎' : '🤖'}</span>
            <h3 className="font-semibold">{platform === 'ios' ? 'Apple Health' : 'Samsung Health'}</h3>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Automatic</span>
          </div>

          {!hasPermission ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Grant permission to automatically sync steps from {platform === 'ios' ? 'Apple Health' : 'Samsung Health'}
              </p>
              <Button
                onClick={requestHealthPermissions}
                disabled={syncing}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {syncing ? '⏳ Requesting...' : '🔓 Grant Health Permission'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySteps !== null && (
                <div className="p-3 bg-white rounded border border-green-200">
                  <p className="text-sm text-gray-600">Today&apos;s Steps</p>
                  <p className="text-3xl font-bold text-green-600">{todaySteps.toLocaleString()}</p>
                </div>
              )}
              <Button
                onClick={syncNativeHealth}
                disabled={syncing}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {syncing ? '⏳ Syncing...' : '🔄 Sync Health Data'}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Syncs last 7 days of step data
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Section */}
      <div className={`mb-6 p-4 border-2 rounded-lg ${isNative ? 'border-blue-200 bg-blue-50' : 'border-blue-200 bg-blue-50'}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">✍️</span>
          <h3 className="font-semibold">Manual Entry</h3>
          {!isNative && <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">Recommended</span>}
        </div>
        
        {!showManualEntry ? (
          <Button
            onClick={() => setShowManualEntry(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            📝 Enter Steps Manually
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Today&apos;s Steps
              </label>
              <input
                type="number"
                value={manualSteps}
                onChange={(e) => setManualSteps(e.target.value)}
                placeholder="e.g., 8500"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={syncManualSteps}
                disabled={syncing || !manualSteps}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {syncing ? '⏳ Saving...' : '✅ Save Steps'}
              </Button>
              <Button
                onClick={() => {
                  setShowManualEntry(false);
                  setManualSteps('');
                }}
                className="px-4 bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Info box - only show for web platform */}
      {!isNative && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <p className="font-semibold text-gray-800 mb-2">
                {platform === 'ios' ? '🍎 Apple Health' : platform === 'android' ? '🤖 Samsung Health' : '📲 Health App'} Integration
              </p>
              <p className="text-sm text-gray-700 mb-3">
                Automatic health app sync requires a native mobile app. This is a web app running in your browser.
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Current workaround:</strong> Use manual entry above to track your steps</p>
                <p><strong>Coming soon:</strong> Download our iOS/Android apps for automatic sync</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.startsWith('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : message.startsWith('⚠️')
            ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-md text-sm text-blue-800">
        <p className="font-semibold mb-2">💡 Pro Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          {isNative ? (
            <>
              <li>Grant health permissions for automatic step tracking</li>
              <li>Sync regularly to keep your challenge data up to date</li>
              <li>Your last 7 days of data will be synced each time</li>
            </>
          ) : (
            <>
              <li>Check your phone&apos;s health app for today&apos;s step count</li>
              <li>Enter your steps at the end of each day</li>
              <li>You can also use the step counter button on the dashboard</li>
              <li>Your data syncs automatically across all your devices</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
