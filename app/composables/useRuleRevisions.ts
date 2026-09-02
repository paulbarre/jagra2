import { getDb } from '~/utils/db'

const revisions = ref<Map<string, string>>(new Map())
const loaded = ref(false)

async function loadAll() {
  if (!import.meta.client || loaded.value) return
  const rows = await getDb().ruleRevisions.toArray()
  revisions.value = new Map(rows.map(r => [r.ruleId, r.revisedAt]))
  loaded.value = true
}

// The revision "day" rolls over at 5am rather than midnight, so a late-night
// session (e.g. Monday's review done Tuesday at 3am) still counts as Monday.
const DAY_START_HOUR = 5

export function revisionDayKey(date: Date) {
  const shifted = new Date(date)
  shifted.setHours(shifted.getHours() - DAY_START_HOUR)
  return `${shifted.getFullYear()}-${shifted.getMonth()}-${shifted.getDate()}`
}

function isSameRevisionDay(iso: string, now = new Date()) {
  return revisionDayKey(new Date(iso)) === revisionDayKey(now)
}

export function useRuleRevisions() {
  if (import.meta.client && !loaded.value) loadAll()

  function getRevisedAt(ruleId: string) {
    return revisions.value.get(ruleId)
  }

  function isRevisedToday(ruleId: string) {
    const at = revisions.value.get(ruleId)
    return !!at && isSameRevisionDay(at)
  }

  async function markRevised(ruleId: string) {
    if (!import.meta.client) return
    const revisedAt = new Date().toISOString()
    revisions.value.set(ruleId, revisedAt)
    await getDb().ruleRevisions.put({ ruleId, revisedAt })
  }

  return { loaded: readonly(loaded), getRevisedAt, isRevisedToday, markRevised }
}
