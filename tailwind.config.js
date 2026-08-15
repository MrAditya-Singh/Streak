/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0c0f14',
        card: '#161b22',
        cardBorder: '#232936',
        cardHover: '#1c2330',
        streakOrange: '#ff5c00',
        streakFlame: '#ff9800',
        duoGreen: '#58cc02',
        duoGreenDark: '#46a302',
        duoGreenLight: '#61e002',
        duoYellow: '#ffc800',
        duoBlue: '#1cb0f6',
        duoPurple: '#af4bfb',
        duoRed: '#ff4b4b',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 25px -5px rgba(88, 204, 2, 0.4)',
        'glow-orange': '0 0 25px -5px rgba(255, 92, 0, 0.4)',
        'glow-purple': '0 0 25px -5px rgba(175, 75, 251, 0.4)',
        'card-soft': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flame-bounce': 'flameBounce 1.5s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        flameBounce: {
          '0%': { transform: 'scale(1) rotate(-2deg)' },
          '100%': { transform: 'scale(1.1) rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
