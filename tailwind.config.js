/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dpblue: '#1d2d35',         // matches site nav text
        dpgold: '#b89e64',         // warm beige/gold
        dpgray: '#4b4b4b',         // text gray
        dpoffwhite: '#f8f8f6',     // background
        dpbg: '#f4f4f4'            // light gray background
      },
      fontFamily: {
        heading: ['"Barlow Condensed"', 'sans-serif'],
        body: ['"Open Sans"', 'sans-serif']
      },
      boxShadow: {
        dp: '0 1px 4px rgba(0, 0, 0, 0.1)',
      }
    }
  },
  plugins: [],
};
