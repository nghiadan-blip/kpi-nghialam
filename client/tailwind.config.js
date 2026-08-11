/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vietnix: {
          primary: '#27A4F2',
          sky: '#3EAEF4',
          light: '#6EC2F7',
          soft: '#9FD7F9',
          ice: '#CFEBFC',
          cobalt: '#4585E6',
          periwinkle: '#91A8ED',
          lavender: '#BDCBF4',
          deep: '#1864AB',
          navy: '#0C3260',
          midnight: '#061933',
        },
        commune: {
          50: '#CFEBFC',
          100: '#9FD7F9',
          200: '#6EC2F7',
          300: '#3EAEF4',
          400: '#27A4F2',
          500: '#4585E6',
          600: '#1c7ed6',
          700: '#1864ab',
          800: '#0c3260',
          900: '#061933',
        },
      }
    },
  },
  plugins: [],
}
