'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export function Navbar() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    console.log('[Navbar] user:', user?.email || 'null', 'loading:', loading);
  }, [user, loading]);

  const handleSignIn = () => {
    router.push('/login');
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Walking Challenge
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <Button 
                onClick={handleDashboard}
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button 
                onClick={handleSignIn}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
