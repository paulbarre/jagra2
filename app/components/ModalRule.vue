<script setup lang="ts">
const props = defineProps<{
  id: string
}>()

const { data: rule } = await useAsyncData(`rule-${props.id}`, () => {
  return queryCollection('rules').where('id', '=', props.id).first()
})

const example = computed(() => {
  const examples = rule.value?.examples ?? []
  if (!examples.length) return undefined
  return examples[Math.floor(Math.random() * examples.length)]
})
</script>

<template>
  <UModal>
    <template #content>
      <UCard v-if="rule">
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
              {{ example.ja }}
            </p>
            <p v-if="example.en">
              {{ example.en }}
            </p>
          </template>
        </UPageFeature>
      </UCard>
    </template>
  </UModal>
</template>
