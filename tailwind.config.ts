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
        paper: '#e4e1da',
        concrete: '#d4d0c6',
        card: '#f4f2ed',
        ink: '#141311',
        steel: '#3e444c',
        muted: '#5e5a54',
        line: '#c8c4bb',
        accent: '#b8432f',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        page: '72rem',
      },
    },
  },
} satisfies Config
