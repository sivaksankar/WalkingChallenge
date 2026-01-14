'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const ADMIN_EMAIL = 'sivaksankar@gmail.com';

export function DashboardNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Profile', href: '/dashboard/profile' },
    { name: 'Settings', href: '/dashboard/settings' },
  ];

  // Append admin navigation only for the designated admin email
  if (user?.email === ADMIN_EMAIL) {
    navigation.push({ name: 'Admin', href: '/dashboard/admin' });
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-800">
                Walking Challenge
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                    pathname === item.href
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                pathname === item.href
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              )}
            >
              {item.name}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}