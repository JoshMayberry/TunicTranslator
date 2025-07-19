import { db } from './db'
import { SoundType, Sound, DbSound } from "./types"

export function soundEnsureTable(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE "sound" (
        "id"	INTEGER NOT NULL UNIQUE,
        "type"	TEXT,
        "guessed_sound"	TEXT,
        "alternate_guesses"	TEXT,
        "confidence"	INTEGER,
        "comment"	TEXT,
        PRIMARY KEY("id")
      )
    `, [], err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

export function soundGetAll(): Promise<Sound[]> {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM sound`, [], (err, rows: Array<DbSound>) => {
      if (err) return reject(err)
      const parsed: Array<Sound> = rows.map(row => ({
        id: row.id,
        type: (row.type || "") as SoundType,
        guessed_sound: row.guessed_sound || "",
        alternate_guesses: JSON.parse(row.alternate_guesses || '[]'),
        confidence: row.confidence || 0,
        comment: row.comment || "",
      }))
      resolve(parsed)
    })
  })
}

export function soundSave(data: Sound): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT OR REPLACE INTO sound
      (id, type, guessed_sound, alternate_guesses, confidence, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      data.id,
      data.type,
      data.guessed_sound,
      JSON.stringify(data.alternate_guesses || []),
      data.confidence,
      data.comment
    ], err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

export function soundSaveGuess(data: Sound): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT OR REPLACE INTO sound
      (id, guessed_sound, confidence)
      VALUES (?, ?, ?)
    `, [
      data.id,
      data.guessed_sound,
      data.confidence,
    ], err => {
      if (err) return reject(err)
      resolve()
    })
  })
}