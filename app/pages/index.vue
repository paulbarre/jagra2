<script setup lang="ts">
import ModalRule from '~/components/ModalRule.vue'

const { data: rules } = await useAsyncData('rules', () => {
  return queryCollection('rules')
    .order('title', 'DESC')
    .all()
})

const showDrafts = ref(false)
const showRevisedToday = ref(true)
const showFrozen = ref(false)

const { isRevisedToday, getRevisedAt } = useRuleRevisions()
const { isFrozen } = useRuleFrozen()

const filteredRules = computed(() => {
  return rules.value?.filter((rule) => {
    const draft = rule.draft
    const revisedToday = isRevisedToday(rule.id)
    const frozen = isFrozen(rule.id)
    if (!draft && !revisedToday && !frozen) return true
    return (draft && showDrafts.value) || (revisedToday && showRevisedToday.value) || (frozen && showFrozen.value)
  })
})

const overlay = useOverlay()
const modal = overlay.create(ModalRule)

async function open(ruleId: string) {
  modal.open({
    id: ruleId,
    showDrafts: showDrafts.value,
    showFrozen: showFrozen.value,
  })
}

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
      <UPageHeader title="Jagra">
        <template #links>
          <div class="flex items-center gap-1 rounded-lg border border-default bg-elevated/50 p-1">
            <UTooltip text="Show drafts">
              <UButton
                icon="i-lucide-flask-conical"
                :color="showDrafts ? 'primary' : 'neutral'"
                :variant="showDrafts ? 'subtle' : 'ghost'"
                square
                aria-label="Show drafts"
                @click="showDrafts = !showDrafts"
              />
            </UTooltip>
            <UTooltip text="Show reviewed today">
              <UButton
                icon="i-lucide-eye"
                :color="showRevisedToday ? 'primary' : 'neutral'"
                :variant="showRevisedToday ? 'subtle' : 'ghost'"
                square
                aria-label="Show reviewed today"
                @click="showRevisedToday = !showRevisedToday"
              />
            </UTooltip>
            <UTooltip text="Show frozen">
              <UButton
                icon="i-lucide-snowflake"
                :color="showFrozen ? 'primary' : 'neutral'"
                :variant="showFrozen ? 'subtle' : 'ghost'"
                square
                aria-label="Show frozen"
                @click="showFrozen = !showFrozen"
              />
            </UTooltip>
          </div>
        </template>
      </UPageHeader>
      <UPageBody>
        <UEmpty
          v-if="filteredRules?.length === 0"
          icon="i-lucide-search-x"
          title="No rules to show"
          description="Every rule is filtered out. Try adjusting the filters above."
        />
        <UPageGrid v-else>
          <UPageCard
            v-for="rule in filteredRules"
            :key="rule.id"
            v-bind="rule"
            variant="subtle"
            :ui="{ root: 'overflow-hidden', container: 'z-10', footer: 'pt-1 mt-0' }"
            @click="open(rule.id)"
          >
            <UIcon
              v-if="isFrozen(rule.id)"
              name="i-lucide-snowflake"
              class="pointer-events-none absolute -right-5 -bottom-5 z-0 size-28 text-sky-500/30"
            />
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