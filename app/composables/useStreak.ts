import { getDb } from '~/utils/db'

const STREAK_ID = 'current'

const count = ref(0)
const lastCompletedDayKey = ref<string | undefined>()
const loaded = ref(false)

async function loadAll() {
  if (!import.meta.client || loaded.value) return
  const row = await getDb().streak.get(STREAK_ID)
  count.value = row?.count ?? 0
  lastCompletedDayKey.value = row?.lastCompletedDayKey
  loaded.value = true
}

function previousRevisionDayKey(now = new Date()) {
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  return revisionDayKey(yesterday)
}

// A streak only stays "alive" if the last completed day was today or
// yesterday. Once a whole revision day (5am-to-5am) has gone by with an
// incomplete board, the streak is broken and displays as 0 even before the
// next completion (or lack thereof) gets persisted.
function isStreakActive(now = new Date()) {
  if (!lastCompletedDayKey.value) return true
  return lastCompletedDayKey.value === revisionDayKey(now) || lastCompletedDayKey.value === previousRevisionDayKey(now)
}

export function useStreak() {
  if (import.meta.client && !loaded.value) loadAll()

  const streak = computed(() => isStreakActive() ? count.value : 0)

  async function recordCompletion() {
    if (!import.meta.client || !loaded.value) return
    const todayKey = revisionDayKey(new Date())
    if (lastCompletedDayKey.value === todayKey) return

    count.value = lastCompletedDayKey.value === previousRevisionDayKey() ? count.value + 1 : 1
    lastCompletedDayKey.value = todayKey
    await getDb().streak.put({ id: STREAK_ID, count: count.value, lastCompletedDayKey: todayKey })
  }

  return { loaded: readonly(loaded), streak, recordCompletion }
}
