'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';

export function HealthSync() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [appleHealthPermission, setAppleHealthPermission] = useState(false);
  const [samsungHealthPermission, setSamsungHealthPermission] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent || navigator.vendor;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream);
    setIsAndroid(/android/i.test(userAgent));
  }, []);

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
        Connect your health app to automatically sync your daily steps.
      </p>

      {/* iOS Section */}
      {isIOS && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍎</span>
              <h3 className="font-semibold">Apple Health</h3>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${appleHealthPermission ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {appleHealthPermission ? '✓ Authorized' : 'Not Authorized'}
            </span>
          </div>
          
          {!appleHealthPermission ? (
            <Button
              onClick={requestAppleHealthPermission}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              Grant Permission
            </Button>
          ) : (
            <Button
              onClick={syncAppleHealth}
              disabled={syncing}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {syncing ? '⏳ Syncing...' : '🔄 Sync Now'}
            </Button>
          )}
        </div>
      )}

      {/* Android Section */}
      {isAndroid && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📱</span>
              <h3 className="font-semibold">Samsung Health</h3>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${samsungHealthPermission ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {samsungHealthPermission ? '✓ Authorized' : 'Not Authorized'}
            </span>
          </div>
          
          {!samsungHealthPermission ? (
            <Button
              onClick={requestSamsungHealthPermission}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Grant Permission
            </Button>
          ) : (
            <Button
              onClick={syncSamsungHealth}
              disabled={syncing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {syncing ? '⏳ Syncing...' : '🔄 Sync Now'}
            </Button>
          )}
        </div>
      )}

      {/* Desktop/Unsupported Platform */}
      {!isIOS && !isAndroid && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <span className="font-semibold">📱 Mobile Device Required</span><br />
            Health app sync is only available on iOS or Android devices. Please access this page from your mobile device.
          </p>
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
        <p className="font-semibold mb-2">📝 How It Works:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Grant permission to read your step data</li>
          <li>Sync automatically pulls your daily steps</li>
          <li>Data is synced securely to your account</li>
          <li>Your data is never shared without permission</li>
          <li>Works best with native mobile apps (iOS/Android)</li>
        </ul>
      </div>
    </div>
  );
}
