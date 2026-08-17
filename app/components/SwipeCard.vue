<script setup lang="ts">
export type SwipeActionColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

export interface SwipeAction {
  icon: string
  label: string
  color?: SwipeActionColor
}

const props = defineProps<{
  left?: SwipeAction
  right?: SwipeAction
}>()

const emit = defineEmits<{
  left: []
  right: []
}>()

const MASK_CLASSES: Record<SwipeActionColor, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  error: 'bg-error',
  neutral: 'bg-neutral',
}

const THRESHOLD = 120
const OPACITY_RANGE = 320
const FLY_OUT_DURATION = 250
const REVEAL_DURATION = 400
const REVEAL_PAUSE = 300

const el = ref<HTMLElement>()
const dragging = ref(false)
const flying = ref(false)
const revealing = ref(false)
const forcedProgress = ref<number | null>(null)
const forcedDirection = ref<'left' | 'right' | null>(null)
const offsetX = ref(0)
const offsetY = ref(0)

let pointerId: number | null = null
let startX = 0
let startY = 0

function onPointerDown(event: PointerEvent) {
  if (flying.value || revealing.value) return
  dragging.value = true
  pointerId = event.pointerId
  startX = event.clientX - offsetX.value
  startY = event.clientY - offsetY.value
  el.value?.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value || event.pointerId !== pointerId) return
  offsetX.value = event.clientX - startX
  offsetY.value = event.clientY - startY
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.value || event.pointerId !== pointerId) return
  dragging.value = false
  pointerId = null

  if (props.left && offsetX.value <= -THRESHOLD) {
    flyOut('left')
  } else if (props.right && offsetX.value >= THRESHOLD) {
    flyOut('right')
  } else {
    offsetX.value = 0
    offsetY.value = 0
  }
}

function flyOut(direction: 'left' | 'right') {
  if (flying.value) return
  flying.value = true
  const distance = (el.value?.offsetWidth ?? window.innerWidth) + 200
  offsetX.value = direction === 'left' ? -distance : distance
  offsetY.value += direction === 'left' ? -15 : 15
  window.setTimeout(() => {
    if (direction === 'left') emit('left')
    else emit('right')
  }, FLY_OUT_DURATION)
}

function revealThenSwipe(direction: 'left' | 'right') {
  if (flying.value || revealing.value) return
  revealing.value = true
  forcedDirection.value = direction
  forcedProgress.value = 1
  window.setTimeout(() => flyOut(direction), REVEAL_DURATION + REVEAL_PAUSE)
}

function onActionClick(direction: 'left' | 'right') {
  revealThenSwipe(direction)
}

const rotation = computed(() => {
  const clamped = Math.max(-240, Math.min(240, offsetX.value))
  return clamped / 14
})

const activeDirection = computed<'left' | 'right' | null>(() => {
  if (forcedDirection.value) return forcedDirection.value
  if (offsetX.value < 0) return 'left'
  if (offsetX.value > 0) return 'right'
  return null
})

const activeAction = computed(() => {
  if (activeDirection.value === 'left') return props.left
  if (activeDirection.value === 'right') return props.right
  return undefined
})

const progress = computed(() => {
  if (!activeAction.value) return 0
  if (forcedProgress.value !== null) return forcedProgress.value
  return Math.min(1, Math.max(0, Math.abs(offsetX.value) / OPACITY_RANGE))
})

const maskClass = computed(() => MASK_CLASSES[activeAction.value?.color ?? 'primary'])

const style = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) rotate(${rotation.value}deg)`,
  transition: dragging.value ? 'none' : `transform ${FLY_OUT_DURATION}ms linear`,
}))

const overlayTransition = computed(() => {
  return dragging.value ? 'none' : `opacity ${REVEAL_DURATION}ms ease-out, transform ${REVEAL_DURATION}ms ease-out`
})

const buttonClass = computed(() => ({
  'pointer-events-none opacity-0': revealing.value || flying.value,
}))
</script>

<template>
  <div class="pointer-events-none flex w-full flex-col items-center gap-6">
    <div
      ref="el"
      class="pointer-events-auto relative w-full touch-none select-none cursor-grab overflow-hidden rounded-lg active:cursor-grabbing"
      :style="style"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <slot />
      <div
        class="pointer-events-none absolute inset-0 z-10"
        :class="maskClass"
        :style="{ opacity: progress * 0.9, transition: overlayTransition }"
      />
      <div class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <div
          class="rotate-[-22deg] rounded-2xl border-8 border-white px-8 py-3 text-4xl font-black tracking-widest text-white uppercase sm:text-5xl"
          :style="{ opacity: progress, transform: `scale(${0.85 + progress * 0.15})`, transition: overlayTransition }"
        >
          {{ activeAction?.label }}
        </div>
      </div>
    </div>

    <div v-if="left || right" class="flex items-center justify-center gap-4">
      <UButton
        v-if="left"
        :icon="left.icon"
        :color="left.color ?? 'primary'"
        variant="solid"
        size="xl"
        class="pointer-events-auto h-16 w-16 items-center justify-center rounded-full shadow-lg transition-opacity duration-300 [&>span]:size-7"
        :class="buttonClass"
        :aria-label="left.label"
        @click="onActionClick('left')"
      />
      <UButton
        v-if="right"
        :icon="right.icon"
        :color="right.color ?? 'primary'"
        variant="solid"
        size="xl"
        class="pointer-events-auto h-16 w-16 items-center justify-center rounded-full shadow-lg transition-opacity duration-300 [&>span]:size-7"
        :class="buttonClass"
        :aria-label="right.label"
        @click="onActionClick('right')"
      />
    </div>
  </div>
</template>
