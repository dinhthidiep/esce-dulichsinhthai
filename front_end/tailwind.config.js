/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin")
const colors = require("tailwindcss/colors")
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
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
        html: { fontSize: "62.5%" }
      })
    })
  ]
}
