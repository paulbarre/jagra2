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
        <h1 class="text-3xl sm:text-4xl text-pretty font-bold text-highlighted">
          {{ rule.title }}
        </h1>
      </UCard>
    </template>
  </UModal>
</template>
