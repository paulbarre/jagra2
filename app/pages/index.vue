<script setup lang="ts">
const rules = [
  { title: '〜に限らず' },
  { title: '〜につき〈理由〉' },
]
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