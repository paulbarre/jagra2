<script setup lang="ts">
import SwipeCardDeck from './SwipeCardDeck.vue'

const props = withDefaults(defineProps<{
  id: string
  showDrafts?: boolean
  showRevisedToday?: boolean
  showFrozen?: boolean
}>(), {
  showDrafts: false,
  showRevisedToday: false,
  showFrozen: false,
})

const emit = defineEmits<{
  close: [payload?: { action: 'reviewed' }]
}>()

const { data: rules } = await useAsyncData('rules', () => {
  return queryCollection('rules').all()
})

const rule = computed(() => rules.value?.find(r => r.id === props.id))

const { isRevisedToday, markRevised } = useRuleRevisions()
const { isFrozen, markFrozen } = useRuleFrozen()

function onCardLeft(item: { id: string }) {
  markRevised(item.id)
}

function onCardUp(item: { id: string }) {
  markFrozen(item.id)
}

const deckRef = ref<{ playTutorial: () => Promise<void> } | null>(null)
const { hasSeenTutorial, markTutorialSeen } = useSwipeTutorial()
const tutorialActive = ref(false)

function onModalEnter() {
  if (hasSeenTutorial()) return
  markTutorialSeen()
  deckRef.value?.playTutorial()
}

function replayTutorial() {
  deckRef.value?.playTutorial()
}

function pickExample(examples: { ja: string, en?: string }[] | undefined) {
  if (!examples?.length) return undefined
  return examples[Math.floor(Math.random() * examples.length)]
}

function shuffle<T>(items: T[]) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

// A one-time snapshot, not a computed: the deck's contents must stay fixed for the
// review session. Recomputing on every markFrozen()/markRevised() reactive update
// would reset SwipeCardDeck's internal queue (see its `watch(() => props.items, ...)`),
// undoing swipes already made in this session.
const deckItems = (() => {
  if (!rules.value || !rule.value) return []
  const value = rule.value
  const others = shuffle(rules.value.filter((r) => {
    if (r.id === value.id) return false
    const draft = r.draft
    const revisedToday = isRevisedToday(r.id)
    const frozen = isFrozen(r.id)
    if (!draft && !revisedToday && !frozen) return true
    return (draft && props.showDrafts) || (revisedToday && props.showRevisedToday) || (frozen && props.showFrozen)
  }))
  return [value, ...others].map(r => ({
    id: r.id,
    rule: r,
    example: pickExample(r.examples),
  }))
})()

function onEmptied() {
  emit('close', { action: 'reviewed' })
}

function highlightParts(text: string) {
  return text.split('**').map((part, i) => ({
    text: part,
    highlight: i % 2 === 1,
  }))
}
</script>

<template>
  <UModal
    fullscreen
    :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
    :ui="{
      overlay: tutorialActive ? 'bg-black/90 transition-colors duration-300' : 'transition-colors duration-300',
      content: 'items-center justify-center bg-transparent ring-0 shadow-none rounded-none overflow-visible pointer-events-none!',
    }"
    @after:enter="onModalEnter"
  >
    <template #content>
      <UButton
        icon="i-lucide-help-circle"
        color="neutral"
        variant="ghost"
        size="sm"
        square
        class="pointer-events-auto fixed top-4 right-4 z-50 sm:top-6 sm:right-6"
        aria-label="Replay swipe tutorial"
        @click="replayTutorial"
      />
      <div class="pointer-events-none w-full max-w-lg p-4 sm:p-6">
        <SwipeCardDeck
          v-if="rule"
          ref="deckRef"
          :items="deckItems"
          :left="{ icon: 'i-lucide-check', label: 'Reviewed', color: 'success', hint: 'Swipe left to mark a rule as reviewed' }"
          :right="{ icon: 'i-lucide-rotate-ccw', label: 'Later', color: 'warning', hint: 'Swipe right to come back to it later' }"
          :up="{ icon: 'i-lucide-snowflake', label: 'Frozen', color: 'sky', hint: 'Swipe up to freeze a rule' }"
          @left="onCardLeft"
          @up="onCardUp"
          @empty="onEmptied"
          @tutorial-start="tutorialActive = true"
          @tutorial-end="tutorialActive = false"
        >
          <template #default="{ item }">
            <UCard class="h-full">
              <p v-if="item.rule.meaning?.en" class="mb-1 text-sm font-semibold text-primary">
                {{ item.rule.meaning.en }}
              </p>
              <h1 class="text-3xl sm:text-4xl text-pretty font-bold text-highlighted">
                {{ item.rule.title }}
              </h1>
              <UPageFeature
                v-if="item.example"
                class="mt-6"
                icon="i-lucide-quote"
                title="Example"
              >
                <template #description>
                  <p class="whitespace-pre-line">
                    <template v-for="(part, i) in highlightParts(item.example.ja)" :key="i">
                      <span v-if="part.highlight" class="text-primary">{{ part.text }}</span>
                      <template v-else>{{ part.text }}</template>
                    </template>
                  </p>
                  <p v-if="item.example.en">
                    {{ item.example.en }}
                  </p>
                </template>
              </UPageFeature>
              <UPageFeature
                v-if="item.rule.notes?.en || item.rule.notes?.ja"
                class="mt-4"
                icon="i-lucide-sticky-note"
                title="Notes"
                :description="item.rule.notes.en ?? item.rule.notes.ja"
              />
              <UPageFeature
                v-if="item.rule.structure?.length"
                class="mt-4"
                icon="i-lucide-shapes"
                title="Structure"
              >
                <template #description>
                  <p v-for="(pattern, patternIndex) in item.rule.structure" :key="patternIndex">
                    <template v-for="(part, i) in highlightParts(pattern)" :key="i">
                      <UBadge v-if="part.highlight" variant="subtle">{{ part.text }}</UBadge>
                      <template v-else><span>{{ part.text }}</span></template>
                    </template>
                  </p>
                </template>
              </UPageFeature>
            </UCard>
          </template>
        </SwipeCardDeck>
      </div>
    </template>
  </UModal>
</template>
