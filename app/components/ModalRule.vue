<script setup lang="ts">
import SwipeCard from './SwipeCard.vue'

const props = defineProps<{
  id: string
}>()

const emit = defineEmits<{
  close: [payload?: { action: 'reviewed' }]
}>()

const { data: rule } = await useAsyncData(`rule-${props.id}`, () => {
  return queryCollection('rules').where('id', '=', props.id).first()
})

function onReviewed() {
  emit('close', { action: 'reviewed' })
}

const example = computed(() => {
  const examples = rule.value?.examples ?? []
  if (!examples.length) return undefined
  return examples[Math.floor(Math.random() * examples.length)]
})

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
        <SwipeCard
          v-if="rule"
          :left="{ icon: 'i-lucide-check', label: 'Reviewed', color: 'success' }"
          @left="onReviewed"
        >
          <UCard>
            <p v-if="rule.meaning?.en" class="mb-1 text-sm font-semibold text-primary">
              {{ rule.meaning.en }}
            </p>
            <h1 class="text-3xl sm:text-4xl text-pretty font-bold text-highlighted">
              {{ rule.title }}
            </h1>
            <UPageFeature
              v-if="example"
              class="mt-6"
              icon="i-lucide-quote"
              title="Example"
            >
              <template #description>
                <p>
                  <template v-for="(part, i) in highlightParts(example.ja)" :key="i">
                    <span v-if="part.highlight" class="text-primary">{{ part.text }}</span>
                    <template v-else>{{ part.text }}</template>
                  </template>
                </p>
                <p v-if="example.en">
                  {{ example.en }}
                </p>
              </template>
            </UPageFeature>
            <UPageFeature
              v-if="rule.notes?.en || rule.notes?.ja"
              class="mt-4"
              icon="i-lucide-sticky-note"
              title="Notes"
              :description="rule.notes.en ?? rule.notes.ja"
            />
            <UPageFeature
              v-if="rule.structure?.length"
              class="mt-4"
              icon="i-lucide-shapes"
              title="Structure"
            >
              <template #description>
                <p v-for="(pattern, patternIndex) in rule.structure" :key="patternIndex">
                  <template v-for="(part, i) in highlightParts(pattern)" :key="i">
                    <UBadge v-if="part.highlight" variant="subtle">{{ part.text }}</UBadge>
                    <template v-else><span>{{ part.text }}</span></template>
                  </template>
                </p>
              </template>
            </UPageFeature>
          </UCard>
        </SwipeCard>
      </div>
    </template>
  </UModal>
</template>
