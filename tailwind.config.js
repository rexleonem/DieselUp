/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        diesel: '#FF8A00', ink: '#0F172A', accent: '#3B82F6', success: '#10B981', warning: '#F59E0B', danger: '#EF4444'
      }
    }
  },
  plugins: []
};
