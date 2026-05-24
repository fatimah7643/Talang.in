/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy-dark':  '#121358', 
        'navy':       '#232F72', 
        'navy-mid':   '#243a6e',  
        'primary':    '#232F72',  
        'accent':     '#2F578A',  
        'teal':       '#36ADA3',  
        'surface':    '#f8f9fa',  
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}