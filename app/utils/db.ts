import Dexie, { type EntityTable } from 'dexie'

export interface RuleRevisionRecord {
  ruleId: string
  revisedAt: string
}

type JagraDB = Dexie & { ruleRevisions: EntityTable<RuleRevisionRecord, 'ruleId'> }

let _db: JagraDB | undefined

export function getDb(): JagraDB {
  if (!import.meta.client) throw new Error('getDb() must only be called on the client')
  if (!_db) {
    const db = new Dexie('jagra') as JagraDB
    db.version(1).stores({ ruleRevisions: 'ruleId' })
    _db = db
  }
  return _db
}
