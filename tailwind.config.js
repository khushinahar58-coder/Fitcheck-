/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#FEFCFA',
          100: '#FAF8F5',
          200: '#F5F0E9',
          300: '#EDE5DA',
          400: '#DDD0C0',
        },
        ink: {
          50: '#F6F4F1',
          100: '#E8E4DF',
          200: '#CFC9C0',
          300: '#A89F92',
          400: '#7A7166',
          500: '#5C5448',
          600: '#4A4239',
          700: '#3A332B',
          800: '#2D2722',
          900: '#1E1A16',
        },
        clay: {
          50: '#FAF0EB',
          100: '#F3DDD2',
          200: '#E5BCA8',
          300: '#D49B80',
          400: '#C47E60',
          500: '#A6674A',
          600: '#8A5339',
          700: '#6E4129',
        },
        sage: {
          50: '#F0F4ED',
          100: '#DCE6D3',
          200: '#B8CCA6',
          300: '#94B27B',
          400: '#789660',
          500: '#5E7A4A',
        },
        gold: {
          300: '#E0C082',
          400: '#D4A856',
          500: '#B8923F',
        },
        success: {
          400: '#7BAE6A',
          500: '#5E9148',
        },
        warning: {
          400: '#E0B85C',
          500: '#C99A38',
        },
        error: {
          400: '#D4806E',
          500: '#B85A48',
        },
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
