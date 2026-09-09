import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

// Which collection is mounted is decided at build/dev-server start time via
// NUXT_PUBLIC_CONTENT_COLLECTION (see nuxt.config.ts) — only one collection
// is ever registered, so switching targets requires a restart.
const activeCollection = process.env.NUXT_PUBLIC_CONTENT_COLLECTION || 'rules'

const collectionDefs = {
  rules: defineCollection({
    type: 'data',
    source: 'rules/**.yaml',
    schema: z.object({
      title: z.string(),
      draft: z.boolean().default(false),
      meaning: z.object({
        en: z.string(),
      }),
      notes: z.object({
        en: z.string().optional(),
        ja: z.string().optional(),
      }),
      structure: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      examples: z.array(z.object({
        ja: z.string(),
        en: z.string().optional(),
      })).optional(),
    })
  }),
  kanjis: defineCollection({
    type: 'data',
    source: 'kanjis/**.yaml',
    schema: z.object({
      id: z.string(),
      title: z.string(),
    })
  }),
}

export default defineContentConfig({
  collections: {
    [activeCollection]: collectionDefs[activeCollection as keyof typeof collectionDefs],
  }
})
