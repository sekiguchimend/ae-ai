/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // AE風のダークテーマカラー
        'ae-dark': '#1e1e1e',
        'ae-darker': '#0d0d0d',
        'ae-border': '#3d3d3d',
        'ae-accent': '#00a8ff',
        'ae-text': '#e0e0e0',
        'ae-text-secondary': '#888888',
      },
    },
  },
  plugins: [],
};
