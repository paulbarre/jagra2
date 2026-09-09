// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devServer: { port: Number(process.env.DEV_SERVER_PORT) || 3000, host: '0.0.0.0' },
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/content'],
  css: ['~/assets/css/main.css'],
  content: {
    experimental: { sqliteConnector: 'native' },
  },
})