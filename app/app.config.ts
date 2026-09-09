// Which palette is applied is decided at build/dev-server start time via
// NUXT_PUBLIC_UI_THEME, same mechanism as the content collection switch in
// content.config.ts — restart after changing this.
const activeTheme = process.env.NUXT_PUBLIC_UI_THEME || 'sakura'

const themeDefs = {
  sakura: { primary: 'rose', secondary: 'indigo', neutral: 'stone' },
  sumi: { primary: 'indigo', secondary: 'rose', neutral: 'zinc' },
  matcha: { primary: 'green', secondary: 'amber', neutral: 'stone' },
}

export default defineAppConfig({
  ui: {
    colors: themeDefs[activeTheme as keyof typeof themeDefs] ?? themeDefs.sakura,
  },
})
