// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint'],

  // DevTools only while developing; never part of a production build.
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  app: {
    head: {
      htmlAttrs: { lang: 'tr' },
      title: 'kurgu.',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Ajans hesap yöneticileri için müşteri ve içerik takip paneli' },
        { name: 'theme-color', content: '#1C1520' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  runtimeConfig: {
    public: {
      // Absolute base for link previews (og:url, og:image); NUXT_PUBLIC_SITE_URL overrides it.
      siteUrl: 'https://kurgu-panel.vercel.app',
    },
  },

  compatibilityDate: '2025-07-15',

  typescript: {
    strict: true,
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    viewer: false,
  },
})
