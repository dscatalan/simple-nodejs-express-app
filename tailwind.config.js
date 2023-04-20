/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./static/*.{html,js,css}",
    "./views/**/*.{html,js,ejs}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms'),],
};
