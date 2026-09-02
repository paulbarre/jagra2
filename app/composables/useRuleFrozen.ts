import { getDb } from '~/utils/db'

const frozen = ref<Map<string, string>>(new Map())
const loaded = ref(false)

async function loadAll() {
  if (!import.meta.client || loaded.value) return
  const rows = await getDb().ruleFrozen.toArray()
  frozen.value = new Map(rows.map(r => [r.ruleId, r.frozenAt]))
  loaded.value = true
}

export function useRuleFrozen() {
  if (import.meta.client && !loaded.value) loadAll()

  function isFrozen(ruleId: string) {
    return frozen.value.has(ruleId)
  }

  async function markFrozen(ruleId: string) {
    if (!import.meta.client) return
    const frozenAt = new Date().toISOString()
    frozen.value.set(ruleId, frozenAt)
    await getDb().ruleFrozen.put({ ruleId, frozenAt })
  }

  return { loaded: readonly(loaded), isFrozen, markFrozen }
}
