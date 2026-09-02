import { getDb } from '~/utils/db'

const frozen = ref<Map<string, string>>(new Map())
const loaded = ref(false)

async function loadAll() {
  if (!import.meta.client || loaded.value) return
  const rows = await getDb().ruleFrozen.toArray()
  frozen.value = new Map(rows.map(r => [r.ruleId, r.frozenAt]))
  loaded.value = true
}

// Frozen cards thaw out every Monday at 5am, so a freeze doesn't
// silently persist past the review week it was meant to skip.
const FREEZE_RESET_WEEKDAY = 1 // Monday (JS getDay(): 0 = Sunday)
const FREEZE_RESET_HOUR = 5

function mostRecentFreezeResetAt(now = new Date()) {
  const cutoff = new Date(now)
  cutoff.setHours(FREEZE_RESET_HOUR, 0, 0, 0)
  const daysSinceReset = (cutoff.getDay() - FREEZE_RESET_WEEKDAY + 7) % 7
  cutoff.setDate(cutoff.getDate() - daysSinceReset)
  if (cutoff > now) cutoff.setDate(cutoff.getDate() - 7)
  return cutoff
}

export function useRuleFrozen() {
  if (import.meta.client && !loaded.value) loadAll()

  function isFrozen(ruleId: string) {
    const at = frozen.value.get(ruleId)
    return !!at && new Date(at) >= mostRecentFreezeResetAt()
  }

  async function markFrozen(ruleId: string) {
    if (!import.meta.client) return
    const frozenAt = new Date().toISOString()
    frozen.value.set(ruleId, frozenAt)
    await getDb().ruleFrozen.put({ ruleId, frozenAt })
  }

  return { loaded: readonly(loaded), isFrozen, markFrozen }
}
