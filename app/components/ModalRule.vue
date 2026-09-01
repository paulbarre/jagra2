<script setup lang="ts">
import SwipeCardDeck from './SwipeCardDeck.vue'

const props = withDefaults(defineProps<{
  id: string
  showDrafts?: boolean
}>(), {
  showDrafts: false,
})

const emit = defineEmits<{
  close: [payload?: { action: 'reviewed' }]
}>()

const { data: rules } = await useAsyncData('rules', () => {
  return queryCollection('rules').all()
})

const rule = computed(() => rules.value?.find(r => r.id === props.id))

const { markRevised } = useRuleRevisions()

function onCardLeft(item: { id: string }) {
  markRevised(item.id)
}

function pickExample(examples: { ja: string, en?: string }[] | undefined) {
  if (!examples?.length) return undefined
  return examples[Math.floor(Math.random() * examples.length)]
}

function shuffle<T>(items: T[]) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

const deckItems = computed(() => {
  if (!rules.value || !rule.value) return []
  const value = rule.value
  const others = shuffle(rules.value.filter(r => r.id !== value.id && (!r.draft || props.showDrafts)))
  return [value, ...others].map(r => ({
    id: r.id,
    rule: r,
    example: pickExample(r.examples),
  }))
})

function onEmptied() {
  emit('close', { action: 'reviewed' })
}

function highlightParts(text: string) {
  return text.split('**').map((part, i) => ({
    text: part,
    highlight: i % 2 === 1,
  }))
}
</script>

<template>
  <UModal :ui="{ content: 'bg-transparent ring-0 shadow-none rounded-none overflow-visible pointer-events-none!' }">
    <template #content>
      <div class="pointer-events-none p-4 sm:p-6">
        <SwipeCardDeck
          v-if="rule"
          :items="deckItems"
          :left="{ icon: 'i-lucide-check', label: 'Reviewed', color: 'success' }"
          :right="{ icon: 'i-lucide-rotate-ccw', label: 'Later', color: 'warning' }"
          @left="onCardLeft"
          @empty="onEmptied"
        >
          <template #default="{ item }">
            <UCard class="h-full">
              <p v-if="item.rule.meaning?.en" class="mb-1 text-sm font-semibold text-primary">
                {{ item.rule.meaning.en }}
              </p>
              <h1 class="text-3xl sm:text-4xl text-pretty font-bold text-highlighted">
                {{ item.rule.title }}
              </h1>
              <UPageFeature
                v-if="item.example"
                class="mt-6"
                icon="i-lucide-quote"
                title="Example"
              >
                <template #description>
                  <p>
                    <template v-for="(part, i) in highlightParts(item.example.ja)" :key="i">
                      <span v-if="part.highlight" class="text-primary">{{ part.text }}</span>
                      <template v-else>{{ part.text }}</template>
                    </template>
                  </p>
                  <p v-if="item.example.en">
                    {{ item.example.en }}
                  </p>
                </template>
              </UPageFeature>
              <UPageFeature
                v-if="item.rule.notes?.en || item.rule.notes?.ja"
                class="mt-4"
                icon="i-lucide-sticky-note"
                title="Notes"
                :description="item.rule.notes.en ?? item.rule.notes.ja"
              />
              <UPageFeature
                v-if="item.rule.structure?.length"
                class="mt-4"
                icon="i-lucide-shapes"
                title="Structure"
              >
                <template #description>
                  <p v-for="(pattern, patternIndex) in item.rule.structure" :key="patternIndex">
                    <template v-for="(part, i) in highlightParts(pattern)" :key="i">
                      <UBadge v-if="part.highlight" variant="subtle">{{ part.text }}</UBadge>
                      <template v-else><span>{{ part.text }}</span></template>
                    </template>
                  </p>
                </template>
              </UPageFeature>
            </UCard>
          </template>
        </SwipeCardDeck>
      </div>
    </template>
  </UModal>
</template>
