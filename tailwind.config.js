/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        ink: '#E8E8E8',
        dim: '#7A7A7A',
        neon: '#00E5FF',
        red: '#FF2E4D',
        panel: '#0A0A0A',
        line: '#1F1F1F',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '0',
      },
    },
  },
  plugins: [],
}
