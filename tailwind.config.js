/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Use Tailwind's class-based dark mode
  theme: {
    extend: {
      transitionDuration: {
        240: '240ms',
        300: '300ms',
      },
      transitionTimingFunction: {
        'ease-out-smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'slide-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'slide-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'bar-grow': {
          '0%': {
            transform: 'scaleY(0)',
            opacity: '0'
          },
          '100%': {
            transform: 'scaleY(1)',
            opacity: '1'
          }
        },
        'scale-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)'
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)'
          }
        }
      },
      animation: {
        'slide-in-up': 'slide-in-up 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-down': 'slide-in-down 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'bar-grow': 'bar-grow 400ms cubic-bezier(0.0, 0.0, 0.2, 1) both',
        'scale-in': 'scale-in 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'card-1': 'slide-in-up 240ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both',
        'card-2': 'slide-in-up 240ms cubic-bezier(0.22, 1, 0.36, 1) 50ms both',
        'card-3': 'slide-in-up 240ms cubic-bezier(0.22, 1, 0.36, 1) 100ms both',
        'card-4': 'slide-in-up 240ms cubic-bezier(0.22, 1, 0.36, 1) 150ms both',
        'card-5': 'slide-in-up 240ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both',
      }
    },
  },
  plugins: [],
};
