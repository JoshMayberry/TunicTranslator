import { db } from './db'
import { Word, DbWord } from "./types"

export function wordEnsureTable(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE "word" (
          "id"	INTEGER NOT NULL UNIQUE,
          "combined_ids"	TEXT NOT NULL UNIQUE,
          "meaning"	TEXT,
          "confidence"	INTEGER,
          "comment"	TEXT,
          PRIMARY KEY("id" AUTOINCREMENT)
      );
    `, [], err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function wordGetAll(): Promise<Word[]> {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM word`, [], (err, rows: Array<DbWord>) => {
      if (err) return reject(err)
      const parsed: Array<Word> = rows.map(row => ({
        id: row.id,
        combined_ids: row.combined_ids || "",
        meaning: row.meaning || "",
        confidence: row.confidence || 0,
        comment: row.comment || "",
      }));
      resolve(parsed);
    });
  });
}

export function wordSave(data: Word): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT OR REPLACE INTO word
      (id, combined_ids, meaning, confidence, comment)
      VALUES (?, ?, ?, ?, ?)
    `, [
      data.id,
      data.combined_ids,
      data.meaning,
      data.confidence,
      data.comment
    ], err => {
      if (err) return reject(err)
      resolve();
    });
  });
}

export function wordSaveGuess(data: Word): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT OR REPLACE INTO word
      (combined_ids, meaning, confidence)
      VALUES (?, ?, ?)
    `, [
      data.combined_ids,
      data.meaning,
      data.confidence,
    ], err => {
      if (err) return reject(err)
      resolve()
    })
  })
}
