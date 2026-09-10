export const themeDefs = {
  sakura: { primary: 'rose', secondary: 'indigo', neutral: 'stone' },
  sumi: { primary: 'indigo', secondary: 'rose', neutral: 'zinc' },
  matcha: { primary: 'green', secondary: 'amber', neutral: 'stone' },
}

// Overridden at runtime by app/plugins/theme.ts based on NUXT_PUBLIC_UI_THEME
// (see nuxt.config.ts); this is just the fallback shown before that plugin runs.
export default defineAppConfig({
  ui: {
    colors: themeDefs.sakura,
  },
})
