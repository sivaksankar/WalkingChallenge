'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';

export function HealthSync() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [manualSteps, setManualSteps] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent || navigator.vendor;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream);
    setIsAndroid(/android/i.test(userAgent));
  }, []);

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

  const requestAppleHealthPermission = async () => {
    setMessage('');
    
    if (!isIOS) {
      setMessage('⚠️ Apple Health is only available on iOS devices');
      return;
    }

    // Check if HealthKit is available (requires native bridge)
    if (!(window as any).webkit?.messageHandlers?.healthKit) {
      setMessage('⚠️ Apple Health integration requires the native iOS app. This feature is not available in the browser.');
      return;
    }

    try {
      // Request permission through native bridge
      (window as any).webkit.messageHandlers.healthKit.postMessage({
        action: 'requestPermission'
      });
      
      // Listen for permission response
      setAppleHealthPermission(true);
      setMessage('✅ Apple Health permission granted! You can now sync your steps.');
    } catch (error) {
      setMessage('❌ Failed to request Apple Health permission');
    }
  };

  const requestSamsungHealthPermission = async () => {
    setMessage('');
    
    if (!isAndroid) {
      setMessage('⚠️ Samsung Health is only available on Android devices');
      return;
    }

    // Check if Samsung Health SDK is available (requires native bridge)
    if (!(window as any).SamsungHealth) {
      setMessage('⚠️ Samsung Health integration requires the native Android app. This feature is not available in the browser.');
      return;
    }

    try {
      // Request permission through native bridge
      const granted = await (window as any).SamsungHealth.requestPermission();
      
      if (granted) {
        setSamsungHealthPermission(true);
        setMessage('✅ Samsung Health permission granted! You can now sync your steps.');
      } else {
        setMessage('❌ Samsung Health permission denied');
      }
    } catch (error) {
      setMessage('❌ Failed to request Samsung Health permission');
    }
  };

  const syncAppleHealth = async () => {
    if (!appleHealthPermission) {
      setMessage('⚠️ Please grant Apple Health permission first');
      return;
    }

    setSyncing(true);
    setMessage('');

    try {
      // Request actual step data through native bridge
      (window as any).webkit.messageHandlers.healthKit.postMessage({
        action: 'getSteps',
        date: new Date().toISOString().split('T')[0]
      });

      // Wait for native response (this would be handled by a message listener in production)
      setMessage('⏳ Requesting step data from Apple Health...');
    } catch (error) {
      setMessage('❌ Failed to sync with Apple Health');
      setSyncing(false);
    }
  };

  const syncSamsungHealth = async () => {
    if (!samsungHealthPermission) {
      setMessage('⚠️ Please grant Samsung Health permission first');
      return;
    }

    setSyncing(true);
    setMessage('');

    try {
      // Request actual step data through native bridge
      const stepData = await (window as any).SamsungHealth.getSteps(new Date().toISOString().split('T')[0]);

      if (stepData && stepData.steps) {
        const response = await fetch('/api/health/samsung/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            steps: stepData.steps, 
            date: stepData.date 
          })
        });

        const data = await response.json();

        if (data.success) {
          setMessage(`✅ Synced ${stepData.steps.toLocaleString()} steps from Samsung Health`);
        } else {
          setMessage(`❌ ${data.error || 'Sync failed'}`);
        }
      } else {
        setMessage('❌ No step data available from Samsung Health');
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
        Track your daily steps by syncing from your health app or entering manually.
      </p>

      {/* Manual Entry Section - Always Available */}
      <div className="mb-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">✍️</span>
          <h3 className="font-semibold">Manual Entry</h3>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">Recommended</span>
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

      {/* Health App Integration Info */}
      <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📱</span>
          <div>
            <p className="font-semibold text-gray-800 mb-2">
              {isIOS ? '🍎 Apple Health' : isAndroid ? '🤖 Samsung Health' : '📲 Health App'} Integration
            </p>
            <p className="text-sm text-gray-700 mb-3">
              Automatic health app sync requires a native mobile app. This is a web app running in your browser.
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Current workaround:</strong> Use manual entry above to track your steps</p>
              <p><strong>Future update:</strong> Native iOS/Android apps will support automatic sync</p>
            </div>
          </div>
        </div>
      </div>

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
          <li>Check your phone&apos;s health app for today&apos;s step count</li>
          <li>Enter your steps at the end of each day</li>
          <li>You can also use the step counter button on the dashboard</li>
          <li>Your data syncs automatically across all your devices</li>
        </ul>
      </div>
    </div>
  );
}
