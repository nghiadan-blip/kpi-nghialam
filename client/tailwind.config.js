/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        commune: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        gov: {
          red: '#da251d',
          yellow: '#ffde00',
          dark: '#1e293b'
        }
      }
    },
  },
  plugins: [],
}
