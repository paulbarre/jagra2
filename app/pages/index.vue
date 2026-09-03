<script setup lang="ts">
import ModalRule from '~/components/ModalRule.vue'

const { data: rules } = await useAsyncData('rules', () => {
  return queryCollection('rules')
    .order('title', 'DESC')
    .all()
})

const showDrafts = ref(false)
const showRevisedToday = ref(false)
const showFrozen = ref(false)

const { loaded: revisionsLoaded, isRevisedToday, getRevisedAt } = useRuleRevisions()
const { loaded: frozenLoaded, isFrozen } = useRuleFrozen()
const { loaded: streakLoaded, streak, recordCompletion } = useStreak()
const ready = computed(() => revisionsLoaded.value && frozenLoaded.value)

// Objective completion state, independent of the show* filter toggles: every
// reviewable (non-draft) rule has been revised today or is frozen, and at
// least one revision actually happened today (so an all-frozen board with no
// activity doesn't advance the streak).
const allRulesRevisedOrFrozen = computed(() => {
  const reviewable = rules.value?.filter(rule => !rule.draft)
  if (!reviewable?.length) return false
  if (!reviewable.some(rule => isRevisedToday(rule.id))) return false
  return reviewable.every(rule => isRevisedToday(rule.id) || isFrozen(rule.id))
})

watch([allRulesRevisedOrFrozen, streakLoaded], ([done, loaded]) => {
  if (done && loaded) recordCompletion()
}, { immediate: true })

const filteredRules = computed(() => {
  return rules.value?.filter((rule) => {
    const draft = rule.draft
    const revisedToday = isRevisedToday(rule.id)
    const frozen = isFrozen(rule.id)
    if (!draft && !revisedToday && !frozen) return true
    return (draft && showDrafts.value) || (revisedToday && showRevisedToday.value) || (frozen && showFrozen.value)
  })
})

const allCaughtUpToday = computed(() => {
  if (!rules.value || filteredRules.value?.length !== 0) return false
  if (!rules.value.some(rule => isRevisedToday(rule.id))) return false
  return rules.value.every((rule) => {
    if (rule.draft && !showDrafts.value) return true
    if (isFrozen(rule.id) && !showFrozen.value) return true
    return isRevisedToday(rule.id)
  })
})

const overlay = useOverlay()
const modal = overlay.create(ModalRule)

const { hasSeenTutorial: hasSeenFrozenTutorial, markTutorialSeen: markFrozenTutorialSeen } = useFrozenFilterTutorial()
// Two separate refs so the button highlight can linger a beat after the
// overlay/callout fade out — the button should be visible, un-dimmed, and
// still glowing for a moment before it settles back to normal.
const showFrozenOverlay = ref(false)
const showFrozenHighlight = ref(false)
const FROZEN_TUTORIAL_HOLD = 4000
const FROZEN_HIGHLIGHT_LINGER = 700

async function open(ruleId: string) {
  const result = await modal.open({
    id: ruleId,
    showDrafts: showDrafts.value,
    showRevisedToday: showRevisedToday.value,
    showFrozen: showFrozen.value,
  }).result

  if (result?.frozeCard && !hasSeenFrozenTutorial()) {
    markFrozenTutorialSeen()
    triggerFrozenTutorial()
  }
}

function dismissFrozenTutorial() {
  showFrozenOverlay.value = false
  setTimeout(() => { showFrozenHighlight.value = false }, FROZEN_HIGHLIGHT_LINGER)
}

function triggerFrozenTutorial() {
  showFrozenOverlay.value = true
  showFrozenHighlight.value = true
  setTimeout(dismissFrozenTutorial, FROZEN_TUTORIAL_HOLD)
}

// Dev helper: run `triggerFrozenTutorial()` in the browser console to preview
// the frozen-filter callout without having to freeze a card for the first time.
if (import.meta.dev && import.meta.client) {
  ;(window as unknown as { triggerFrozenTutorial: typeof triggerFrozenTutorial }).triggerFrozenTutorial = triggerFrozenTutorial
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

function revisedLabel(ruleId: string) {
  if (isRevisedToday(ruleId)) return 'Last revised today'
  const iso = getRevisedAt(ruleId)
  return iso ? `Last revised on ${dateFormatter.format(new Date(iso))}` : 'Not revised yet'
}
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-300"
    leave-to-class="opacity-0"
  >
    <div
      v-if="showFrozenOverlay"
      class="fixed inset-0 z-40 bg-black/90"
      @click="dismissFrozenTutorial"
    />
  </Transition>
  <UContainer>
    <UPage>
      <UPageHeader title="Jagra" :ui="{ wrapper: 'flex flex-row items-center justify-between gap-4' }">
        <template #links>
          <UTooltip text="Day streak">
            <div class="flex items-center gap-1 rounded-full border border-default bg-elevated/50 px-2.5 py-1 text-sm font-medium text-highlighted">
              <UIcon name="i-lucide-flame" class="size-4" :class="streak > 0 ? 'text-warning' : 'text-muted'" />
              <span>{{ streak }}</span>
            </div>
          </UTooltip>
          <div class="flex items-center gap-1 rounded-full border border-default bg-elevated/50 p-1">
            <UTooltip text="Show drafts">
              <UButton
                icon="i-lucide-flask-conical"
                color="neutral"
                :variant="showDrafts ? 'subtle' : 'ghost'"
                size="xs"
                square
                class="rounded-full"
                aria-label="Show drafts"
                @click="showDrafts = !showDrafts"
              />
            </UTooltip>
            <UTooltip text="Show reviewed today">
              <UButton
                icon="i-lucide-eye"
                :color="showRevisedToday ? 'primary' : 'neutral'"
                :variant="showRevisedToday ? 'subtle' : 'ghost'"
                size="xs"
                square
                class="rounded-full"
                aria-label="Show reviewed today"
                @click="showRevisedToday = !showRevisedToday"
              />
            </UTooltip>
            <div class="relative" :class="showFrozenHighlight ? 'z-50' : ''">
              <UTooltip text="Show frozen">
                <UButton
                  icon="i-lucide-snowflake"
                  :color="showFrozen || showFrozenHighlight ? 'info' : 'neutral'"
                  :variant="showFrozen || showFrozenHighlight ? 'subtle' : 'ghost'"
                  size="xs"
                  square
                  class="rounded-full transition-shadow duration-300"
                  :class="showFrozenHighlight ? 'ring-4 ring-sky-400/70' : ''"
                  aria-label="Show frozen"
                  @click="showFrozen = !showFrozen"
                />
              </UTooltip>

              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 translate-y-1 scale-95"
                leave-active-class="transition duration-200 ease-in"
                leave-to-class="opacity-0 translate-y-1 scale-95"
              >
                <div
                  v-if="showFrozenHighlight"
                  class="absolute right-0 top-full z-50 mt-3 flex w-max max-w-[min(85vw,20rem)] items-center gap-2 rounded-full bg-sky-500 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-[0_12px_30px_-6px_rgba(0,0,0,0.6)]"
                >
                  <UIcon name="i-lucide-snowflake" class="size-4 shrink-0" />
                  <span>Frozen rules go here — tap to review them</span>
                </div>
              </Transition>
            </div>
          </div>
        </template>
      </UPageHeader>
      <UPageBody>
        <div v-if="!ready" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
        </div>
        <UEmpty
          v-else-if="allCaughtUpToday"
          icon="i-lucide-calendar-check"
          title="All caught up for today"
          description="You've reviewed everything. Come back tomorrow."
        />
        <UEmpty
          v-else-if="filteredRules?.length === 0"
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
            :class="rule.draft ? 'grayscale bg-neutral-500/15' : ''"
            :ui="{ root: 'overflow-hidden', container: 'z-10', footer: 'pt-1 mt-0' }"
            @click="open(rule.id)"
          >
            <UIcon
              v-if="rule.draft"
              name="i-lucide-flask-conical"
              class="pointer-events-none absolute -right-5 -bottom-5 z-0 size-28 text-neutral-500/30"
            />
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