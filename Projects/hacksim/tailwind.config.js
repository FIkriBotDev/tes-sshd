/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ExOS terminal palette
        exos: {
          bg: '#0a0f0a',
          surface: '#0d1a0d',
          border: '#1a3a1a',
          green: '#00ff41',
          'green-dim': '#00cc33',
          'green-dark': '#004d14',
          amber: '#ffb300',
          red: '#ff3333',
          blue: '#00aaff',
          text: '#c8ffc8',
          'text-dim': '#6aaa6a',
        },
        // City / UI palette
        city: {
          sky: '#87ceeb',
          ground: '#7ec850',
          road: '#555555',
          building: '#d4c5a9',
        },
        // Glass UI
        glass: {
          bg: 'rgba(255,255,255,0.08)',
          border: 'rgba(255,255,255,0.15)',
          hover: 'rgba(255,255,255,0.12)',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'blink': 'blink 1s step-end infinite',
        'scan-line': 'scanLine 3s linear infinite',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'type': 'typing 0.05s steps(1) forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
        scanLine: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
        pulseGreen: { '0%, 100%': { boxShadow: '0 0 5px #00ff41' }, '50%': { boxShadow: '0 0 20px #00ff41, 0 0 40px #00ff4133' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
