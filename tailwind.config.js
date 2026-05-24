/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', 'html:not(.light)'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'rgba(24, 24, 27, 0.4)',
        border: 'rgba(255, 255, 255, 0.1)',
        white: 'rgba(var(--white-rgb), <alpha-value>)',
        black: 'rgba(var(--black-rgb), <alpha-value>)',
        zinc: {
          50: 'rgba(var(--zinc-50-rgb), <alpha-value>)',
          100: 'rgba(var(--zinc-100-rgb), <alpha-value>)',
          200: 'rgba(var(--zinc-200-rgb), <alpha-value>)',
          300: 'rgba(var(--zinc-300-rgb), <alpha-value>)',
          400: 'rgba(var(--zinc-400-rgb), <alpha-value>)',
          500: 'rgba(var(--zinc-500-rgb), <alpha-value>)',
          600: 'rgba(var(--zinc-600-rgb), <alpha-value>)',
          700: 'rgba(var(--zinc-700-rgb), <alpha-value>)',
          800: 'rgba(var(--zinc-800-rgb), <alpha-value>)',
          900: 'rgba(var(--zinc-900-rgb), <alpha-value>)',
          950: 'rgba(var(--zinc-950-rgb), <alpha-value>)',
        },
        neutral: {
          300: 'rgba(var(--neutral-300-rgb), <alpha-value>)',
          400: 'rgba(var(--neutral-400-rgb), <alpha-value>)',
          500: 'rgba(var(--neutral-500-rgb), <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(139, 92, 246, 0.15)',
        'glow-cyan': '0 0 40px rgba(34, 211, 238, 0.15)',
      },
    },
  },
  plugins: [],
};
