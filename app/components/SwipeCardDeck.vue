<script setup lang="ts" generic="T extends { id: string }">
import SwipeCard, { type SwipeAction } from './SwipeCard.vue'

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
}>()

const STACK_OFFSET = 14
const STACK_SCALE = 0.05
const STACK_OPACITY_STEP = 0.12

// shallowRef avoids Vue's UnwrapRef transform, which otherwise breaks
// inference for the generic-constrained T here.
const queue = shallowRef<T[]>([...props.items])
watch(() => props.items, (items) => {
  queue.value = [...items]
})

const visibleQueue = computed(() => queue.value.slice(0, props.visibleCount))

const busy = ref(false)

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
    opacity: 1 - index * STACK_OPACITY_STEP,
    transition: 'transform 250ms ease-out, opacity 250ms ease-out',
  }
}

function onFlying() {
  busy.value = true
}

function onCardLeft(item: T) {
  queue.value = queue.value.filter(entry => entry.id !== item.id)
  busy.value = false
  emit('left', item)
  if (queue.value.length === 0) emit('empty')
}

function onCardRight(item: T) {
  queue.value = [...queue.value.filter(entry => entry.id !== item.id), item]
  busy.value = false
  cardRefMap.get(item.id)?.reset()
  emit('right', item)
}

function onLeftClick() {
  busy.value = true
  getTopCard()?.triggerLeft()
}

function onRightClick() {
  busy.value = true
  getTopCard()?.triggerRight()
}
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
          @left="onCardLeft(item)"
          @right="onCardRight(item)"
          @flying="onFlying"
        >
          <slot :item="item" />
        </SwipeCard>
      </div>
    </div>

    <div v-if="(left || right) && queue.length" class="flex items-center justify-center gap-4">
      <UButton
        v-if="left"
        :icon="left.icon"
        :color="left.color ?? 'primary'"
        variant="solid"
        size="xl"
        class="pointer-events-auto h-16 w-16 items-center justify-center rounded-full shadow-lg transition-opacity duration-300 [&>span]:size-7"
        :class="{ 'pointer-events-none opacity-0': busy }"
        :aria-label="left.label"
        @click="onLeftClick"
      />
      <UButton
        v-if="right"
        :icon="right.icon"
        :color="right.color ?? 'primary'"
        variant="solid"
        size="xl"
        class="pointer-events-auto h-16 w-16 items-center justify-center rounded-full shadow-lg transition-opacity duration-300 [&>span]:size-7"
        :class="{ 'pointer-events-none opacity-0': busy }"
        :aria-label="right.label"
        @click="onRightClick"
      />
    </div>
  </div>
</template>
