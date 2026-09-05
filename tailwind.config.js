/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
        anthropic: {
          bg: '#181816',
          surface: '#22221f',
          'surface-hover': '#2a2a26',
          border: '#383733',
          'border-light': '#4d4b46',
          terracotta: '#cc785c',
          'terracotta-hover': '#d9886c',
          'terracotta-dark': '#ae5631',
          cream: '#faf6ee',
          'cream-muted': '#d4cfc5',
          'cream-dim': '#9e978c',
          amber: '#d49b53',
        }
      }
    },
  },
  plugins: [],
}
