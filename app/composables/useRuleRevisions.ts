import { getDb } from '~/utils/db'

const revisions = ref<Map<string, string>>(new Map())
const loaded = ref(false)

async function loadAll() {
  if (!import.meta.client || loaded.value) return
  const rows = await getDb().ruleRevisions.toArray()
  revisions.value = new Map(rows.map(r => [r.ruleId, r.revisedAt]))
  loaded.value = true
}

function isSameLocalDay(iso: string, now = new Date()) {
  const d = new Date(iso)
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate()
}

export function useRuleRevisions() {
  if (import.meta.client && !loaded.value) loadAll()

  function getRevisedAt(ruleId: string) {
    return revisions.value.get(ruleId)
  }

  function isRevisedToday(ruleId: string) {
    const at = revisions.value.get(ruleId)
    return !!at && isSameLocalDay(at)
  }

  async function markRevised(ruleId: string) {
    if (!import.meta.client) return
    const revisedAt = new Date().toISOString()
    revisions.value.set(ruleId, revisedAt)
    await getDb().ruleRevisions.put({ ruleId, revisedAt })
  }

  return { getRevisedAt, isRevisedToday, markRevised }
}
