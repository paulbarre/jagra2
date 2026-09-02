import Dexie, { type EntityTable } from 'dexie'

export interface RuleRevisionRecord {
  ruleId: string
  revisedAt: string
}

export interface RuleFrozenRecord {
  ruleId: string
  frozenAt: string
}

export interface StreakRecord {
  id: string
  count: number
  lastCompletedDayKey: string
}

type JagraDB = Dexie & {
  ruleRevisions: EntityTable<RuleRevisionRecord, 'ruleId'>
  ruleFrozen: EntityTable<RuleFrozenRecord, 'ruleId'>
  streak: EntityTable<StreakRecord, 'id'>
}

let _db: JagraDB | undefined

export function getDb(): JagraDB {
  if (!import.meta.client) throw new Error('getDb() must only be called on the client')
  if (!_db) {
    const db = new Dexie('jagra') as JagraDB
    db.version(1).stores({ ruleRevisions: 'ruleId' })
    db.version(2).stores({ ruleRevisions: 'ruleId', ruleFrozen: 'ruleId' })
    db.version(3).stores({ ruleRevisions: 'ruleId', ruleFrozen: 'ruleId', streak: 'id' })
    _db = db
  }
  return _db
}
