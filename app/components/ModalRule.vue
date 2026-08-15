<script setup lang="ts">
const props = defineProps<{
  id: string
}>()

const { data: rule } = await useAsyncData(`rule-${props.id}`, () => {
  return queryCollection('rules').where('id', '=', props.id).first()
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
      </UCard>
    </template>
  </UModal>
</template>
