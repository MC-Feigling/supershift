export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  ssr: true,
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    viewer: false,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'de' },
      titleTemplate: '%s · Schichtwerk',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Persönlicher Schichtplan, teilbar mit einer Person.' },
        { name: 'robots', content: 'noindex' },
        { name: 'theme-color', content: '#141311' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.bunny.net' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.bunny.net/css?family=ibm-plex-sans:400,500,600,700',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabasePublishableKey: '',
    },
  },
  typescript: {
    strict: true,
  },
  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
  },
})
