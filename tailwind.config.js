/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'], display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { 50: '#eefbf3', 100: '#d6f5e1', 200: '#b0e9c8', 300: '#7cd6a8', 400: '#45bc84', 500: '#229f69', 600: '#157f54', 700: '#126645', 800: '#125137', 900: '#10432f' },
        ink: { 50: '#f6f7f6', 100: '#eceeed', 200: '#d5d9d7', 300: '#b3bab6', 400: '#8a938e', 500: '#6b756f', 600: '#535c57', 700: '#434a46', 800: '#2f3532', 900: '#1b1f1d' },
        sun: { 100: '#fff1cc', 500: '#f2a900', 700: '#9a6b00' },
      },
    },
  },
  plugins: [],
}
