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
        paper: '#141618',
        sand: '#1c1f24',
        card: '#23272e',
        ink: '#ebe6dc',
        muted: '#9a9286',
        line: '#3c414b',
        spruce: {
          DEFAULT: '#d4a24c',
          deep: '#a67c2d',
          soft: '#2f2a1d',
        },
        clay: '#d06a45',
        workshop: '#f3eee4',
        coal: '#1a1b1d',
      },
      fontFamily: {
        display: ['Oswald', 'Impact', 'Arial Narrow', 'sans-serif'],
        sans: ['IBM Plex Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      maxWidth: {
        page: '72rem',
      },
      letterSpacing: {
        stencil: '0.16em',
      },
    },
  },
} satisfies Config
