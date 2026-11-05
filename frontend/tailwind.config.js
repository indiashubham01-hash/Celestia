/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfdfb',
          100: '#fcfbf7',
          200: '#f9f7f1',
          300: '#f4f0e6',
          400: '#ede6d6',
        },
        terracotta: {
          DEFAULT: '#c2410c',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          500: '#ea580c',
          600: '#c2410c',
          700: '#9a3412',
          800: '#7c2d12',
        },
        brass: {
          DEFAULT: '#b45309',
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
        },
        sage: {
          DEFAULT: '#15803d',
          50: '#f0fdf4',
          100: '#dcfce7',
          600: '#15803d',
          700: '#166534',
        },
        carmine: {
          DEFAULT: '#be123c',
          50: '#fff1f2',
          100: '#ffe4e6',
          600: '#be123c',
          700: '#9f1239',
        },
        deck: {
          DEFAULT: '#1d4ed8',
          50: '#eff6ff',
          100: '#dbeafe',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          300: '#cbd5e1',
          500: '#64748b',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        heritage: ['"Playfair Display"', 'Georgia', 'serif'],
        grand: ['Cinzel', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'paper': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'paper-lg': '0 10px 30px -4px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04)',
        'terracotta': '0 4px 16px 0 rgba(194, 65, 12, 0.25)',
      }
    },
  },
  plugins: [],
}
