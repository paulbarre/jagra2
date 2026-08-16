import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    rules: defineCollection({
      type: 'data',
      source: 'rules/**.yaml',
      schema: z.object({
        title: z.string(),
        meaning: z.object({
          en: z.string(),
        }),
        notes: z.object({
          en: z.string().optional(),
          ja: z.string().optional(),
        }),
        structure: z.array(z.string()).optional(),
        examples: z.array(z.object({
          ja: z.string(),
          en: z.string().optional(),
        })).optional(),
      })
    })
  }
})

