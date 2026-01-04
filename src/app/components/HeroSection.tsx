'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function HeroSection() {
  return (
    <div className="max-w-3xl mx-auto text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        Walk More, Live Better
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Join the ultimate walking challenge with friends. Track your steps, 
        compete on leaderboards, and achieve your fitness goals together.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/login">
          <Button size="lg">
            Start Your Journey
          </Button>
        </Link>
        <Link href="#how-it-works">
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </Link>
      </div>
    </div>
  );
}
