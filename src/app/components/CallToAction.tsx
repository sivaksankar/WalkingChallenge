'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function CallToAction() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/login');
  };

  return (
    <div className="mt-24 bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto text-center border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Walking?</h2>
      <p className="text-xl text-gray-600 mb-8">Join thousands of people improving their health one step at a time.</p>
      <Button 
        size="lg" 
        onClick={handleGetStarted}
      >
        Get Started for Free
      </Button>
      <p className="mt-4 text-sm text-gray-500">
        No credit card required. Cancel anytime.
      </p>
    </div>
  );
}
