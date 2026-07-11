/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'oma-yellow': '#f5c518',
        'oma-gold': '#e6b800',
        'oma-navy': '#1a2332',
        'oma-navy-deep': '#131b27',
        'oma-navy-light': '#243447',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
