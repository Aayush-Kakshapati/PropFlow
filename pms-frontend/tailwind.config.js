/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c0d2ff',
          300: '#94b0ff',
          400: '#6084ff',
          500: '#3d5cff',
          600: '#1e38f5',
          700: '#1528e0',
          800: '#1621b5',
          900: '#18228f',
          950: '#111457',
        },
        surface: {
          0: '#ffffff',
          50: '#f8f9fc',
          100: '#f0f2f8',
          200: '#e2e6f0',
          300: '#c8cedf',
          400: '#9aa3bf',
          500: '#6b7699',
          600: '#4d5680',
          700: '#363f6a',
          800: '#222952',
          900: '#131830',
          950: '#0a0d1a',
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(10, 13, 26, 0.08), 0 4px 16px rgba(10, 13, 26, 0.04)',
        'card-hover': '0 4px 12px rgba(10, 13, 26, 0.12), 0 8px 32px rgba(10, 13, 26, 0.08)',
        'modal': '0 24px 64px rgba(10, 13, 26, 0.24)',
        'brand': '0 4px 16px rgba(61, 92, 255, 0.32)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.24s ease-out',
        'spin-slow': 'spin 1.4s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
