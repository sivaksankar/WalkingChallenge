/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: '#3b82f6',
        'primary-foreground': '#ffffff',
        secondary: '#6366f1',
        'secondary-foreground': '#ffffff',
        destructive: '#ef4444',
        'destructive-foreground': '#ffffff',
        accent: '#f3f4f6',
        'accent-foreground': '#111827',
        input: '#e5e7eb',
        ring: '#3b82f6',
      },
    },
  },
  plugins: [],
}

