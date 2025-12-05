/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          main: '#1565C0',
          dark: '#0D47A1',
        },
        warning: {
          main: '#FF8F00',
          dark: '#F57C00',
        },
        info: {
          main: '#00ACC1',
          dark: '#0097A7',
        },
        success: {
          main: '#388E3C',
          dark: '#2E7D32',
        },
      }
    },
  },
  plugins: [],
}
