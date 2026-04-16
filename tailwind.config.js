/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          300: "#F0D070",
          400: "#E8C84A",
          500: "#D4AF37",
          600: "#B8960C",
          700: "#9A7D0A",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
}