<script setup lang="ts">
import ModalRule from '~/components/ModalRule.vue'

const { data: rules } = await useAsyncData('rules', () => {
  return queryCollection('rules')
    .order('title', 'DESC')
    .all()
})

const overlay = useOverlay()
const modal = overlay.create(ModalRule)

async function open(ruleId: string) {
  modal.open({
    id: ruleId
  })
}
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
        @click="open(rule.id)"
      />
    </UPageGrid>
  </UContainer>
</template>