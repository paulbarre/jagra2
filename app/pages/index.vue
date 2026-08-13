<script setup lang="ts">
const { data: rules } = await useAsyncData('rules', () => {
  return queryCollection('rules')
    .order('title', 'DESC')
    .all()
})
</script>

<template>
  <UContainer>
    <UPageHero title="Jagra" />
    <UPageGrid>
      <UPageCard
        v-for="(rule, index) in rules"
        :key="`rule-${index}`"
        v-bind="rule"
        variant="subtle"
      />
    </UPageGrid>
  </UContainer>
</template>