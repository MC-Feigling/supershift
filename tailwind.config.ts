import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.vue',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#f3eee4',
        sand: '#ebe4d6',
        card: '#fffdf8',
        ink: '#1c1915',
        muted: '#6e665c',
        line: '#e4d9c8',
        spruce: {
          DEFAULT: '#1d4a38',
          deep: '#143528',
          soft: '#e4f0ea',
        },
        clay: '#8d3b2c',
      },
      fontFamily: {
        display: ['Fraunces', 'Iowan Old Style', 'Palatino', 'Georgia', 'serif'],
        sans: ['Source Sans 3', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        page: '72rem',
      },
    },
  },
} satisfies Config
