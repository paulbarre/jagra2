<script setup lang="ts">
import { highlightParts } from '~/utils/highlight'

// Mirrors the `kanjis` collection schema in content.config.ts. Meant to be
// dropped into SwipeCardDeck's default slot, the same way ModalRule.vue
// renders rule cards: `<SwipeCardDeck :items="..."><template #default="{ item }">
// <CardKanji :kanji="item.kanji" /></template></SwipeCardDeck>`.
export interface KanjiCardData {
  id: string
  title: string
  meaning: { en: string }
  readings?: { on?: string[], kun?: string[] }
  strokeCount?: number
  jlpt?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  notes?: { en?: string, ja?: string }
  tags?: string[]
  examples?: { word: string, reading: string, en?: string }[]
}

withDefaults(defineProps<{
  kanji: KanjiCardData
  frozen?: boolean
}>(), {
  frozen: false,
})
</script>

<template>
  <UCard class="h-full relative">
    <UIcon
      v-if="frozen"
      name="i-lucide-snowflake"
      class="pointer-events-none absolute -right-12 -bottom-12 z-0 size-64 text-sky-500/10"
    />
    <p class="mb-1 text-sm font-semibold text-primary">
      {{ kanji.meaning.en }}
    </p>
    <h1 class="text-7xl sm:text-8xl leading-none font-bold text-highlighted">
      {{ kanji.title }}
    </h1>

    <div v-if="kanji.tags?.length" class="mt-2 flex flex-wrap gap-1">
      <UBadge v-for="tag in kanji.tags" :key="tag" variant="subtle" color="neutral" size="sm">
        {{ tag }}
      </UBadge>
    </div>

    <div
      v-if="kanji.readings?.on?.length || kanji.readings?.kun?.length"
      class="mt-6 grid grid-cols-2 gap-4"
    >
      <div v-if="kanji.readings?.on?.length">
        <p class="text-xs font-semibold tracking-wide text-muted uppercase">
          On'yomi
        </p>
        <p class="mt-1 text-lg text-highlighted">
          {{ kanji.readings.on.join('、') }}
        </p>
      </div>
      <div v-if="kanji.readings?.kun?.length">
        <p class="text-xs font-semibold tracking-wide text-muted uppercase">
          Kun'yomi
        </p>
        <p class="mt-1 text-lg text-highlighted">
          {{ kanji.readings.kun.join('、') }}
        </p>
      </div>
    </div>

    <UPageFeature
      v-if="kanji.examples?.length"
      class="mt-6"
      icon="i-lucide-quote"
      title="Examples"
    >
      <template #description>
        <p v-for="(example, i) in kanji.examples" :key="i" class="mb-1.5 last:mb-0">
          <span class="text-highlighted">
            <template v-for="(part, pi) in highlightParts(example.word)" :key="pi">
              <span v-if="part.type === 'primary'" class="text-primary">{{ part.text }}</span>
              <span v-else-if="part.type === 'secondary'" class="text-secondary">{{ part.text }}</span>
              <template v-else>{{ part.text }}</template>
            </template>
          </span>
          <span class="text-muted">
            (<template v-for="(part, ri) in highlightParts(example.reading)" :key="ri">
              <span v-if="part.type === 'primary'" class="text-primary">{{ part.text }}</span>
              <span v-else-if="part.type === 'secondary'" class="text-secondary">{{ part.text }}</span>
              <template v-else>{{ part.text }}</template>
            </template>)
          </span>
          <span v-if="example.en"> — {{ example.en }}</span>
        </p>
      </template>
    </UPageFeature>

    <UPageFeature
      v-if="kanji.notes?.en || kanji.notes?.ja"
      class="mt-4"
      icon="i-lucide-sticky-note"
      title="Notes"
      :description="kanji.notes.en ?? kanji.notes.ja"
    />
  </UCard>
</template>
