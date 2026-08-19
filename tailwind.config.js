/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dfccil: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a8f6',
          500: '#0e8ce4',
          600: '#026fc2',
          700: '#03599e',
          800: '#074b82',
          900: '#0c3f6c',
          950: '#082847',
        },
        rail: {
          dark: '#0a0f1d',
          card: '#111827',
          border: '#1f2937',
          accent: '#0284c7',
        }
      },
    },
  },
  plugins: [],
}
