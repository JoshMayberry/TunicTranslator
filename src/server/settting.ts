import { db } from './db'

export interface Settings {
  id?: number,
  found_pages: Record<string, boolean>,
}

interface DbSettings {
  id: number,
  found_pages: string,
}


export function settingEnsureTable(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE "setting" (
        "id"	INTEGER NOT NULL UNIQUE,
        "found_pages"	JSON,
        PRIMARY KEY("id" AUTOINCREMENT)
      )
    `, [], err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

export function settingGetAll(): Promise<Settings> {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM setting WHERE id = 0`, [], (err, rows: Array<DbSettings>) => {
      if (err) return reject(err)
      const parsed: Array<Settings> = rows.map(row => ({
        id: 0,
        found_pages: JSON.parse(row.found_pages || '{}'),
      }))
      resolve(parsed[0])
    })
  })
}

export function settingSave(data: Settings): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT OR REPLACE INTO setting
      (id, found_pages)
      VALUES (0, ?)
    `, [
      JSON.stringify(data.found_pages || []),
    ], err => {
      if (err) return reject(err)
      resolve()
    })
  })
}