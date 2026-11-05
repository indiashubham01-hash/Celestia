/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fefbf6',
          100: '#fdf5e6', // main ground
          200: '#f9edd3',
          300: '#f5e8cc', // panel surface
          400: '#e8d4a8', // borders
          500: '#d8c292',
        },
        cream: {
          50: '#fefbf6',
          100: '#fdf5e6',
          200: '#f9edd3',
          300: '#f5e8cc',
          400: '#e8d4a8',
        },
        royal: {
          DEFAULT: '#4c1d95',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          500: '#6d28d9',
          600: '#5b21b6',
          700: '#4c1d95',
          800: '#3b1575',
          900: '#280c54',
        },
        // Alias terracotta to royal or warm velvet
        terracotta: {
          DEFAULT: '#4c1d95',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          500: '#6d28d9',
          600: '#5b21b6',
          700: '#4c1d95',
          800: '#3b1575',
        },
        crimson: {
          DEFAULT: '#b91c1c',
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991515',
          900: '#7f1d1d',
        },
        carmine: {
          DEFAULT: '#b91c1c',
          50: '#fef2f2',
          100: '#fee2e2',
          600: '#dc2626',
          700: '#b91c1c',
        },
        gold: {
          DEFAULT: '#b45309',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#d97706',
          600: '#b45309',
          700: '#924309',
          800: '#78350f',
        },
        brass: {
          DEFAULT: '#b45309',
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#d97706',
          600: '#b45309',
          700: '#924309',
        },
        sage: {
          DEFAULT: '#15803d',
          50: '#f0fdf4',
          100: '#dcfce7',
          600: '#15803d',
          700: '#166534',
        },
        ink: {
          DEFAULT: '#1c1812',
          50: '#fdfbf7',
          100: '#f7f4ed',
          300: '#d4cbbe',
          500: '#786e5e',
          700: '#443a2b',
          800: '#2b2318',
          900: '#1c1812',
        }
      },
      fontFamily: {
        heritage: ['"Playfair Display"', 'Georgia', 'serif'],
        grand: ['Cinzel', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'paper': '0 3px 0 #d8c292, 0 8px 24px -2px rgba(76, 29, 149, 0.06)',
        'paper-lg': '0 5px 0 #c7b07d, 0 14px 34px -4px rgba(76, 29, 149, 0.1)',
        'keycap': '0 3px 0 #d4be8c',
        'keycap-active': '0 1px 0 #d4be8c',
        'btn-royal': '0 4px 0 #3b1575',
        'btn-gold': '0 4px 0 #924309',
        'btn-crimson': '0 4px 0 #991515',
      }
    },
  },
  plugins: [],
}