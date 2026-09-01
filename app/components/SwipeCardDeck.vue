<script setup lang="ts" generic="T extends { id: string }">
import SwipeCard, { type SwipeAction, type SwipeActionColor } from './SwipeCard.vue'

const props = withDefaults(defineProps<{
  items: T[]
  left?: SwipeAction
  right?: SwipeAction
  visibleCount?: number
}>(), {
  visibleCount: 3,
})

const emit = defineEmits<{
  left: [item: T]
  right: [item: T]
  empty: []
  tutorialStart: []
  tutorialEnd: []
}>()

const STACK_OFFSET = 20
const STACK_SCALE = 0.05

// shallowRef avoids Vue's UnwrapRef transform, which otherwise breaks
// inference for the generic-constrained T here.
const queue = shallowRef<T[]>([...props.items])
watch(() => props.items, (items) => {
  queue.value = [...items]
})

const visibleQueue = computed(() => queue.value.slice(0, props.visibleCount))

// Keyed by item id rather than a positional v-for ref array: Vue does not
// guarantee v-for ref arrays stay in source-array order across reorders.
const cardRefMap = new Map<string, InstanceType<typeof SwipeCard>>()
function setCardRef(id: string, instance: unknown) {
  if (instance) cardRefMap.set(id, instance as InstanceType<typeof SwipeCard>)
  else cardRefMap.delete(id)
}
function getTopCard() {
  const topId = visibleQueue.value[0]?.id
  return topId ? cardRefMap.get(topId) : undefined
}

function stackStyle(index: number) {
  if (index === 0) {
    return {
      position: 'relative' as const,
      zIndex: props.visibleCount,
      transition: 'transform 250ms ease-out, opacity 250ms ease-out',
    }
  }
  return {
    position: 'absolute' as const,
    inset: '0',
    zIndex: props.visibleCount - index,
    transform: `translateY(${index * STACK_OFFSET}px) scale(${1 - index * STACK_SCALE})`,
    transition: 'transform 250ms ease-out, opacity 250ms ease-out',
  }
}

function onCardLeft(item: T) {
  queue.value = queue.value.filter(entry => entry.id !== item.id)
  emit('left', item)
  if (queue.value.length === 0) emit('empty')
}

function onCardRight(item: T) {
  queue.value = [...queue.value.filter(entry => entry.id !== item.id), item]
  cardRefMap.get(item.id)?.reset()
  emit('right', item)
}

const TUTORIAL_HOLD = 2200
const TUTORIAL_PAUSE = 400

function delay(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, ms))
}

const BG_CLASSES: Record<SwipeActionColor, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  error: 'bg-error',
  neutral: 'bg-neutral',
}

const tutorialStep = ref<'left' | 'right' | null>(null)
const tutorialPlaying = ref(false)

const tutorialAction = computed(() => {
  if (tutorialStep.value === 'left') return props.left
  if (tutorialStep.value === 'right') return props.right
  return undefined
})
const tutorialBgClass = computed(() => BG_CLASSES[tutorialAction.value?.color ?? 'primary'])

async function demoDirection(card: InstanceType<typeof SwipeCard>, direction: 'left' | 'right') {
  await card.swipeOut(direction)
  tutorialStep.value = direction
  await delay(TUTORIAL_HOLD)
  tutorialStep.value = null
  await card.swipeBack()
}

async function playTutorial() {
  if (tutorialPlaying.value) return
  const card = getTopCard()
  if (!card) return
  tutorialPlaying.value = true
  emit('tutorialStart')
  try {
    if (props.left) {
      await demoDirection(card, 'left')
      await delay(TUTORIAL_PAUSE)
    }
    if (props.right) {
      await demoDirection(card, 'right')
    }
  } finally {
    tutorialPlaying.value = false
    emit('tutorialEnd')
  }
}

defineExpose({
  playTutorial,
})
</script>

<template>
  <div class="pointer-events-none flex w-full flex-col items-center gap-6">
    <div class="relative w-full">
      <div
        v-for="(item, index) in visibleQueue"
        :key="item.id"
        :style="stackStyle(index)"
      >
        <SwipeCard
          :ref="(el: unknown) => setCardRef(item.id, el)"
          :left="left"
          :right="right"
          :interactive="index === 0"
          :depth="index"
          @left="onCardLeft(item)"
          @right="onCardRight(item)"
        >
          <slot :item="item" />
        </SwipeCard>
      </div>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-1 scale-95"
        leave-active-class="transition duration-200 ease-in"
        leave-to-class="opacity-0 translate-y-1 scale-95"
      >
        <div
          v-if="tutorialAction?.hint"
          class="pointer-events-none absolute left-1/2 top-full z-30 mt-5 flex w-max max-w-[min(85vw,22rem)] -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 text-center text-base font-semibold text-white shadow-[0_12px_30px_-6px_rgba(0,0,0,0.6)]"
          :class="tutorialBgClass"
        >
          <UIcon :name="tutorialAction.icon" class="size-5 shrink-0" />
          <span>{{ tutorialAction.hint }}</span>
        </div>
      </Transition>
    </div>
  </div>
</template>
