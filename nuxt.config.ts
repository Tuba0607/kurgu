// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint'],

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'tr' },
      title: 'Kilit Content Studio',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Müşteri ve içerik yönetim paneli' },
        { name: 'theme-color', content: '#242424' },
      ],
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
