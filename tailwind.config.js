module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        dpblue: '#1f2e3d',
        dpgold: '#c4a160',
        dpgray: '#e6e6e6',
        dpoffwhite: '#f8f8f6',
        dpshadow: '#0d1a26',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      },
      boxShadow: {
        dp: '0 2px 6px rgba(13, 26, 38, 0.15)',
      }
    }
  },
  safelist: [
    'bg-dpblue',
    'text-dpgold',
    'text-dpgray',
    'font-heading',
    'shadow-dp',
  ],
  plugins: [],
};
