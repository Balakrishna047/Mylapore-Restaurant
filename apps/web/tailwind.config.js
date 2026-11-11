/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFDF9',
          100: '#FAF4E8',
          200: '#FBF7F0',
          300: '#F0ECE1',
          400: '#E7DFD5',
        },
        terracotta: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#D95338',
          600: '#C84B31',
          700: '#B03A22',
        },
        saffron: {
          400: '#F59E0B',
          500: '#D97706',
          600: '#C8851A',
        },
        cardamom: {
          500: '#16A34A',
          600: '#15803D',
          700: '#14532D',
        },
        charcoal: {
          800: '#292524',
          900: '#1C1917',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
