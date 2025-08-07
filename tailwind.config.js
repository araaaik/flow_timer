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
    },
  },
  plugins: [],
};
