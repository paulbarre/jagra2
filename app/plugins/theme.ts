import { themeDefs } from '../app.config'

// Picks the UI color palette from NUXT_PUBLIC_UI_THEME (see nuxt.config.ts's
// runtimeConfig.public.uiTheme). This can't live as a plain `process.env`
// read in app.config.ts: that file is bundled for the client too, where
// process.env is empty, so it would always fall back to the default theme
// after hydration regardless of the configured value.
export default defineNuxtPlugin({
  name: 'theme',
  enforce: 'pre',
  setup() {
    const appConfig = useAppConfig()
    const { uiTheme } = useRuntimeConfig().public
    const theme = themeDefs[uiTheme as keyof typeof themeDefs] ?? themeDefs.sakura
    // Object.assign (not a full `colors =` replace) since themeDefs only
    // covers primary/secondary/neutral — success/info/warning/error keep
    // Nuxt UI's defaults, which the merged AppConfig type requires present.
    Object.assign(appConfig.ui.colors, theme)
  },
})
