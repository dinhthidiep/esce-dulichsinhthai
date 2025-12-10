/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')
const colors = require('tailwindcss/colors')
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: 0,
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1232px', // dùng làm max-width cho desktop lớn
        '2xl': '1232px' // để không phình rộng thêm trên màn lớn
      }
    },
    extend: {
      colors: {
        primary: colors.green[500],
        accent: colors.yellow[500]
      },
      keyframes: {}
    }
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        html: { fontSize: '62.5%' }
      })
    })
  ]
}
