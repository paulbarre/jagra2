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

const { isRevisedToday, getRevisedAt } = useRuleRevisions()

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

function revisedLabel(ruleId: string) {
  if (isRevisedToday(ruleId)) return 'Last revised today'
  const iso = getRevisedAt(ruleId)
  return iso ? `Last revised on ${dateFormatter.format(new Date(iso))}` : 'Not revised yet'
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader title="Jagra" />
      <UPageBody>
        <UPageGrid>
          <UPageCard
            v-for="rule in rules"
            :key="rule.id"
            v-bind="rule"
            variant="subtle"
            :ui="{ footer: 'pt-1 mt-0' }"
            @click="open(rule.id)"
          >
            <template #footer>
              <div class="flex items-center gap-1.5 text-sm text-muted">
                <UIcon
                  :name="getRevisedAt(rule.id) ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                  class="size-4"
                  :class="isRevisedToday(rule.id) ? 'text-primary' : 'text-muted'"
                />
                <span>{{ revisedLabel(rule.id) }}</span>
              </div>
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>